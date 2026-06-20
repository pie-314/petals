import { NextResponse } from 'next/server';
import { runAction, runBatch } from '../../../lib/wire.js';
import { getCategory, getWatchlist } from '../../../watchlist.js';

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
  return new RegExp(`(?:\\$${escapeRegex(ticker)}\\b|\\b${escapeRegex(ticker)}\\b)`, 'i');
}

function buildRedditByTickerForList(tickers, result) {
  const empty = Object.fromEntries(tickers.map((t) => [t, { ok: false, data: { posts: [] } }]));
  if (!result?.ok || !result.data?.posts) return empty;

  const matchers = Object.fromEntries(tickers.map((t) => [t, buildTickerMatcher(t)]));
  const postsByTicker = Object.fromEntries(tickers.map((t) => [t, []]));

  for (const post of result.data.posts) {
    const haystack = [post.title, post.selftext, post.subreddit].filter(Boolean).join(' ');
    for (const ticker of Object.keys(matchers)) {
      if (matchers[ticker].test(haystack)) postsByTicker[ticker].push(post);
    }
  }

  return Object.fromEntries(tickers.map((t) => [t, { ok: true, data: { posts: postsByTicker[t] } }]));
}

function chunk(items, size) {
  const groups = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

function normalize(values) {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

export async function GET(request) {
  try {
    if (!process.env.ANAKIN_API_KEY) {
      return NextResponse.json({ error: 'Set ANAKIN_API_KEY in .env or .env.local first.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const category = getCategory(searchParams.get('category'));
    const { label, description, tickers } = getWatchlist(category);
    const redditQuery = tickers.join(' OR ');
    const financeTickerGroups = chunk(tickers, FINANCE_BATCH_LIMIT);

    const [redditResult, financeResults] = await Promise.all([
      runAction(REDDIT_ACTION_ID, { query: redditQuery, limit: REDDIT_LIMIT, sort: 'hot', time: 'week' }, { retries: 2, retryDelayMs: 2500, pollMs: 4000 }),
      FINANCE_ACTION_ID === 'cn_multi_quote'
        ? Promise.all(financeTickerGroups.map((group) => runAction(FINANCE_ACTION_ID, { symbols: group.join(',') }, { retries: 2, retryDelayMs: 1500, pollMs: 4000 })))
        : runBatch(tickers.map((ticker) => ({ key: ticker, action_id: FINANCE_ACTION_ID, params: { symbol: ticker } })), { concurrency: 2, retries: 1, retryDelayMs: 1500, pollMs: 4000 }),
    ]);

    const redditByTicker = buildRedditByTickerForList(tickers, redditResult);
    let financeByTicker = {};

    if (FINANCE_ACTION_ID === 'cn_multi_quote') {
      financeByTicker = Object.assign({}, ...financeResults.map((r) => buildFinanceByTicker(r)));
    } else {
      financeByTicker = Object.fromEntries(financeResults.map((r) => [r.key, r]));
    }

    const hypeRaw = tickers.map((ticker) => {
      const r = redditByTicker[ticker];
      const posts = r?.ok ? (r.data?.posts || []) : [];
      return posts.length * 10 + posts.reduce((sum, p) => sum + Number(p.score ?? 0) + Number(p.num_comments ?? 0), 0);
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

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      category: { slug: category, label, description, count: tickers.length },
      leaderboard,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
