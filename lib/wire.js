import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const BASE_URL = 'https://api.anakin.io/v1';
const execFileAsync = promisify(execFile);

function authHeaders(includeJson = false) {
  if (!process.env.ANAKIN_API_KEY) {
    throw new Error('ANAKIN_API_KEY is not set — copy .env.example to .env and fill it in');
  }
  const headers = {
    'X-API-Key': process.env.ANAKIN_API_KEY,
  };
  if (includeJson) headers['Content-Type'] = 'application/json';
  return headers;
}

function isNetworkResolutionError(err) {
  const message = String(err?.message || '');
  return message.includes('fetch failed') || message.includes('EAI_AGAIN') || message.includes('ENOTFOUND');
}

function shouldRetry(error) {
  const message = JSON.stringify(error ?? {});
  return (
    message.includes('429') ||
    message.includes('TIMEOUT') ||
    message.includes('EAI_AGAIN') ||
    message.includes('ENOTFOUND') ||
    message.includes('fetch failed')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function curlJson(url, { method = 'GET', body } = {}) {
  const headers = authHeaders(Boolean(body));
  const args = ['-L', '-sS', '-X', method, url];

  for (const [name, value] of Object.entries(headers)) {
    args.push('-H', `${name}: ${value}`);
  }
  if (body) {
    args.push('--data', JSON.stringify(body));
  }

  const { stdout, stderr } = await execFileAsync('curl', args, { maxBuffer: 1024 * 1024 * 4 });
  if (stderr && !stdout) {
    throw new Error(stderr.trim());
  }
  return JSON.parse(stdout);
}

async function requestJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`${res.status} ${JSON.stringify(body)}`);
    }
    return body;
  } catch (err) {
    if (!isNetworkResolutionError(err)) throw err;
    return curlJson(url, {
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : undefined,
    });
  }
}

export async function searchActions({ q, catalog, category, auth } = {}) {
  const url = new URL(`${BASE_URL}/wire/search`);
  if (q) url.searchParams.set('q', q);
  if (catalog) url.searchParams.set('catalog', catalog);
  if (category) url.searchParams.set('category', category);
  if (auth !== undefined) url.searchParams.set('auth', String(auth));

  return requestJson(url, { headers: authHeaders() });
}

export async function executeTask(action_id, params, credential_id) {
  return requestJson(`${BASE_URL}/wire/task`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({
      action_id,
      params,
      ...(credential_id ? { credential_id } : {}),
    }),
  });
}

export async function getJob(job_id) {
  return requestJson(`${BASE_URL}/wire/jobs/${job_id}`, { headers: authHeaders() });
}

export async function runAction(
  action_id,
  params,
  { credential_id, pollMs = 3000, timeoutMs = 90000, retries = 0, retryDelayMs = 1000 } = {}
) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let job_id;
    try {
      const submitted = await executeTask(action_id, params, credential_id);
      job_id = submitted.job_id;
    } catch (err) {
      if (attempt < retries && shouldRetry(err.message)) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      throw err;
    }

    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const job = await getJob(job_id);
      if (job.status === 'completed') return { ok: true, data: job.data?.data ?? job.data, credits_used: job.credits_used };
      if (job.status === 'failed') {
        const error = job.error ?? job.data?.error;
        if (attempt < retries && shouldRetry(error)) {
          await sleep(retryDelayMs * (attempt + 1));
          break;
        }
        return { ok: false, error };
      }
      await sleep(pollMs);
    }

    if (attempt < retries) {
      await sleep(retryDelayMs * (attempt + 1));
      continue;
    }

    return { ok: false, error: { code: 'TIMEOUT', message: `Job ${job_id} did not finish within ${timeoutMs}ms` } };
  }

  return { ok: false, error: { code: 'RETRY_EXHAUSTED', message: `Action ${action_id} exhausted retries` } };
}

export async function runBatch(
  jobs,
  { concurrency = jobs.length || 1, retries = 0, retryDelayMs = 1000, pollMs, timeoutMs, throttleMs = 0 } = {}
) {
  const results = new Array(jobs.length);
  let index = 0;

  async function worker() {
    while (index < jobs.length) {
      const current = index;
      index += 1;
      const j = jobs[current];

      try {
        const result = await runAction(j.action_id, j.params, {
          credential_id: j.credential_id,
          retries,
          retryDelayMs,
          pollMs,
          timeoutMs,
        });
        results[current] = { key: j.key, ...result };
      } catch (err) {
        results[current] = { key: j.key, ok: false, error: { code: 'CLIENT_ERROR', message: err.message } };
      }

      if (throttleMs > 0) {
        await sleep(throttleMs);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  return results;
}
