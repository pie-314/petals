import dotenv from 'dotenv';
import express from 'express';
import { runAction, runBatch } from './lib/wire.js';
import { DEFAULT_CATEGORY, getCategory, getWatchlist, listCategories } from './watchlist.js';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: false });

const app = express();
app.use(express.static('public'));

const REDDIT_ACTION_ID = process.env.REDDIT_ACTION_ID || 'rt_search';
const FINANCE_ACTION_ID = process.env.FINANCE_ACTION_ID || 'cn_multi_quote';
const REDDIT_LIMIT = 100;
const FINANCE_BATCH_LIMIT = 25;

function parsePercent(value) {
  return Math.abs(parseFloat(String(value ?? '0').replace('%', ''))) || 0;
}

function parseVolume(value) {
  return parseFloat(String(value ?? '0').replace(/,/g, '')) || 0;
}

function buildFinanceByTicker(result) {
  if (!result?.ok || !result.data) return {};

  if (Array.isArray(result.data.data)) {
    return Object.fromEntries(result.data.data.map((quote) => [quote.symbol, { ok: true, data: quote }]));
  }

  if (result.data.symbol) {
    return { [result.data.symbol]: { ok: true, data: result.data } };
  }

  return {};
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTickerMatcher(ticker) {
  const pattern = `(?:\\$${escapeRegex(ticker)}\\b|\\b${escapeRegex(ticker)}\\b)`;
  return new RegExp(pattern, 'i');
}

function buildRedditByTickerForList(tickers, result) {
  const empty = Object.fromEntries(tickers.map((ticker) => [ticker, { ok: false, data: { posts: [] } }]));
  if (!result?.ok || !result.data?.posts) return empty;

  const matchers = Object.fromEntries(tickers.map((ticker) => [ticker, buildTickerMatcher(ticker)]));
  const postsByTicker = Object.fromEntries(tickers.map((ticker) => [ticker, []]));

  for (const post of result.data.posts) {
    const haystack = [post.title, post.selftext, post.subreddit].filter(Boolean).join(' ');
    for (const ticker of Object.keys(matchers)) {
      if (matchers[ticker].test(haystack)) {
        postsByTicker[ticker].push(post);
      }
    }
  }

  return Object.fromEntries(
    tickers.map((ticker) => [
      ticker,
      {
        ok: true,
        data: { posts: postsByTicker[ticker] },
      },
    ])
  );
}

function chunk(items, size) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function mergeFinanceMaps(results) {
  return Object.assign({}, ...results);
}

function normalize(values) {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

app.get('/api/categories', (req, res) => {
  res.json({
    defaultCategory: DEFAULT_CATEGORY,
    categories: listCategories(),
  });
});
app.get('/api/explain', async (req, res) => {
  try {
    const { ticker } = req.query;
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker query parameter is required' });
    }

    if (!process.env.ANAKIN_API_KEY) {
      return res.status(400).json({ error: 'ANAKIN_API_KEY is not configured in .env' });
    }

    // Submit Agentic Search Job to Anakin
    const responseSubmit = await fetch('https://api.anakin.io/v1/agentic-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANAKIN_API_KEY
      },
      body: JSON.stringify({
        prompt: `Explain why stock ticker $${ticker} has divergence between retail social chatter on Reddit and real market volume or price metrics. What are the current catalysts? Summarize in 3 concise bullet points.`
      })
    });

    const submitData = await responseSubmit.json();
    if (!responseSubmit.ok) {
      throw new Error(submitData.message || 'Failed to initialize agentic search');
    }

    const { job_id } = submitData;
    const maxAttempts = 20;
    let attempts = 0;

    // Poll the Job status
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;

      const responsePoll = await fetch(`https://api.anakin.io/v1/agentic-search/${job_id}`, {
        headers: {
          'X-API-Key': process.env.ANAKIN_API_KEY
        }
      });
      const pollData = await responsePoll.json();
      if (!responsePoll.ok) {
        throw new Error(pollData.message || 'Polling failed');
      }

      if (pollData.status === 'completed') {
        const answer = pollData.generatedJson?.summary || pollData.summary || 'No summary report returned.';
        return res.json({
          ticker,
          summary: typeof answer === 'object' ? JSON.stringify(answer) : answer
        });
      }

      if (pollData.status === 'failed') {
        throw new Error(pollData.message || 'Agentic search execution failed');
      }
    }

    throw new Error('Agentic search timed out after 60 seconds');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/refresh', async (req, res) => {
  try {
    if (!process.env.ANAKIN_API_KEY) {
      return res.status(400).json({
        error: 'Set ANAKIN_API_KEY in .env or .env.local first.',
      });
    }

    const category = getCategory(req.query.category);
    const { label, description, tickers } = getWatchlist(category);
    const redditQuery = tickers.join(' OR ');
    const financeTickerGroups = chunk(tickers, FINANCE_BATCH_LIMIT);

    const [redditResult, financeResults] = await Promise.all([
      runAction(
        REDDIT_ACTION_ID,
        { query: redditQuery, limit: REDDIT_LIMIT, sort: 'hot', time: 'week' },
        { retries: 2, retryDelayMs: 2500, pollMs: 4000 }
      ),
      FINANCE_ACTION_ID === 'cn_multi_quote'
        ? Promise.all(
            financeTickerGroups.map((group) =>
              runAction(
                FINANCE_ACTION_ID,
                { symbols: group.join(',') },
                { retries: 2, retryDelayMs: 1500, pollMs: 4000 }
              )
            )
          )
        : runBatch(
            tickers.map((ticker) => ({
              key: ticker,
              action_id: FINANCE_ACTION_ID,
              params: { symbol: ticker },
            })),
            { concurrency: 2, retries: 1, retryDelayMs: 1500, pollMs: 4000 }
          ),
    ]);

    const redditByTicker = buildRedditByTickerForList(tickers, redditResult);
    let financeByTicker = {};

    if (FINANCE_ACTION_ID === 'cn_multi_quote') {
      financeByTicker = mergeFinanceMaps(financeResults.map((result) => buildFinanceByTicker(result)));
    } else {
      financeByTicker = Object.fromEntries(financeResults.map((result) => [result.key, result]));
    }

    const hypeRaw = tickers.map((ticker) => {
      const r = redditByTicker[ticker];
      const posts = r?.ok ? (r.data?.posts || []) : [];
      const mentions = posts.length;
      const engagement = posts.reduce(
        (sum, p) => sum + Number(p.score ?? 0) + Number(p.num_comments ?? 0),
        0
      );
      return mentions * 10 + engagement;
    });

    const fundamentalsRaw = tickers.map((ticker) => {
      const f = financeByTicker[ticker];
      if (!f?.ok || !f.data) return 0;
      const changePct = parsePercent(f.data.change_pct ?? f.data.changePercent);
      const volume = parseVolume(f.data.volume);
      return changePct * 15 + Math.log10(volume + 1) * 12;
    });

    const hypeScores = normalize(hypeRaw);
    const fundamentalsScores = normalize(fundamentalsRaw);

    const leaderboard = tickers.map((ticker, i) => ({
      ticker,
      hype: hypeScores[i],
      fundamentals: fundamentalsScores[i],
      divergence: hypeScores[i] - fundamentalsScores[i],
      redditOk: redditByTicker[ticker]?.ok ?? false,
      financeOk: financeByTicker[ticker]?.ok ?? false,
    })).sort((a, b) => b.divergence - a.divergence);

    res.json({
      generatedAt: new Date().toISOString(),
      category: {
        slug: category,
        label,
        description,
        count: tickers.length,
      },
      leaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`petals running at http://localhost:${PORT}`));
