# Market Polygraph

A real-time dashboard that cross-references Reddit sentiment, live market quotes, and corporate announcements to detect divergence between what people are saying and what prices are actually doing.

Built with [Next.js](https://nextjs.org/) and [Anakin AI](https://anakin.ai/) APIs.

---

## How it works

Three independent signals are pulled in parallel for each ticker:

1. **Reddit Hype** — post mentions and engagement weight from r/stocks, r/wallstreetbets, etc. via the Anakin Wire Reddit catalog action.
2. **Market Fundamentals** — price change % and volume vs. 30-day average via the Anakin Wire Finance catalog action.
3. **Corporate Claims** — key claims extracted from official press releases or earnings URLs via the Anakin URL Scraper (`generateJson: true`).

When these signals disagree significantly, that gap is the signal.

---

## The Math

### Hype Score

For each ticker, raw hype is computed as:

```
hypeRaw(t) = mentions(t) × (upvotes(t) + comments(t))
```

This is then min-max normalized across all tickers in the current batch:

```
hype(t) = ( hypeRaw(t) - min(hypeRaw) ) / ( max(hypeRaw) - min(hypeRaw) ) × 100
```

Result: a score in `[0, 100]` where 100 is the loudest ticker in the batch.

### Fundamentals Score

Raw fundamentals combine price momentum and relative volume:

```
fundamentalsRaw(t) = |priceChange%(t)| × ( volume(t) / avgVolume30d(t) )
```

Normalized the same way:

```
fundamentals(t) = ( fundamentalsRaw(t) - min ) / ( max - min ) × 100
```

### Divergence Score

```
divergence(t) = hype(t) - fundamentals(t)
```

| Range | Interpretation |
|---|---|
| `divergence >> 0` | High noise, low signal. Reddit is louder than the market. |
| `divergence ≈ 0` | Signals agree. |
| `divergence << 0` | Market is moving quietly. No one is talking about it yet. |

Tickers are ranked by `|divergence|` descending — the biggest disconnects appear at the top.

### Reality Check Score

When a corporate URL is submitted, the scraper extracts structured claims. Each claim is then scored against the current divergence:

```
realityGap(claim) = sentiment(claim) - sign(divergence(t))
```

A positive `realityGap` means the company is claiming upward momentum while the market signals otherwise, and vice versa.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| API Routes | Next.js Route Handlers |
| Reddit Signal | Anakin Wire — Reddit catalog |
| Finance Signal | Anakin Wire — Finance catalog |
| URL Scraping | Anakin `/v1/url-scraper` with `generateJson: true` |
| Web Discovery | Anakin `/v1/map` + `/v1/crawl` |
| Alerts | Discord / Slack webhooks, or Anakin Wire simulation |

---

## Setup

```bash
git clone https://github.com/pie-314/petals
cd petals
npm install
cp .env.example .env
```

Fill in `.env`:

```env
ANAKIN_API_KEY=your_key_here
REDDIT_ACTION_ID=   # Wire action for Reddit search (no auth required)
FINANCE_ACTION_ID=  # Wire action for Finance quotes (no auth required)
```

To find valid action IDs:

```bash
# Reddit actions, no login required
curl "https://api.anakin.io/v1/wire/search?catalog=reddit&auth=false" \
  -H "X-API-Key: $ANAKIN_API_KEY" | jq

# Finance actions
curl "https://api.anakin.io/v1/wire/search?category=finance&auth=false" \
  -H "X-API-Key: $ANAKIN_API_KEY" | jq
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/refresh` | `GET` | Pulls Reddit + Finance signals for all tickers, computes divergence scores |
| `/api/reality-check` | `POST` | Accepts `{ url, ticker }`, scrapes the URL, extracts claims, compares against live quote |
| `/api/discovery` | `GET` | Maps and crawls trending financial signals from the web |
| `/api/alert` | `POST` | Fires a webhook alert to Discord/Slack when divergence crosses a threshold |

---

## Fallback behavior

All three Anakin-dependent endpoints (`/api/reality-check`, `/api/discovery`, `/api/alert`) include high-fidelity simulated responses when API credits are unavailable. The simulation uses the same response schema as the live API so the frontend remains fully functional during demos.

---

## Notes

- Normalization is batch-relative, not absolute. Scores shift as the watchlist changes.
- `avgVolume30d` is approximated from the finance action's returned volume field if a 30-day baseline is not available in the catalog response. The approximation uses `volume × 0.85` as a conservative floor.
- The Reality Check endpoint is stateless — it does not store claims between runs.
