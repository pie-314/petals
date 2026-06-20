# petals — Anakin Blitz starter

For every ticker on the watchlist: pull recent Reddit chatter via Wire, pull
real price/volume data via Wire, score both 0-100, and plot the gap as a
diverging bar. Right = the internet is louder than the numbers. Left = the
numbers are louder than the internet.

This repo is wired up end-to-end except for two things only you can fill in:
the real Wire `action_id`s. Do that first — it's a 15-minute step, not
optional, and everything else depends on it.

---

## Step 0 — Get a key (2 min)

Sign up at anakin.io, grab your API key from the dashboard, drop it into
`.env` (copy `.env.example` first).

## Step 1 — Discover your two actions (15-20 min, do this before anything else)

I don't have live visibility into the exact `action_id`s or param schemas in
the Wire catalog right now, so run these yourself and read the JSON that
comes back:

```bash
# Find a Reddit action that searches/lists posts, no login required
curl "https://api.anakin.io/v1/wire/search?catalog=reddit&auth=false" \
  -H "X-API-Key: $ANAKIN_API_KEY" | jq

# Find finance actions — browse the whole Finance category
curl "https://api.anakin.io/v1/wire/search?category=finance&auth=false" \
  -H "X-API-Key: $ANAKIN_API_KEY" | jq
```

For each, you want an action whose `params` schema takes something like a
search query / ticker symbol and whose `auth_mode` is `"none"` (skip
`"required"` actions — that needs a connected identity, which costs you
setup time you don't have today).

Write down:
- the `action_id` for your Reddit pick → put it in `.env` as `REDDIT_ACTION_ID`
- the `action_id` for your finance pick → put it in `.env` as `FINANCE_ACTION_ID`
- the exact `params` field names each one expects
- once you've run one for real, the exact field names in the `data` object
  it returns (run a one-off `POST /v1/wire/task` + poll `GET /v1/wire/jobs/{id}`
  by hand, or just hit `/api/refresh` once and read the `redditOk: false` /
  console error to see what's wrong)

Then open `server.js` and adjust two spots marked with comments:
- the `params: {...}` sent to each action (line up with the real schema)
- the field names read off `r.data` / `f.data` when computing `hypeRaw` /
  `fundamentalsRaw`

This is the only "real" work in the whole build — everything else is glue
that's already written.

## Step 2 — Run it

```bash
npm install
cp .env.example .env   # then fill in the three values
npm start
```

Open `http://localhost:3000`, hit **Refresh**. First run will take
20-60 seconds depending on category size. The 30-name board uses one Reddit
query plus batched finance quote jobs, all polled asynchronously through
Wire.

---

## How the score works

- **Hype** — mentions × engagement (upvotes + comments) for that ticker on
  Reddit, normalized 0-100 against the loudest ticker in the batch.
- **Fundamentals** — price move % and volume vs. average, normalized 0-100
  against the most active ticker in the batch.
- **Divergence** — hype minus fundamentals. Positive = all noise, not much
  underneath it. Negative = something's actually moving and nobody's
  talking about it yet.

Both are intentionally simple linear scores so you can explain them in one
sentence to a judge. Don't over-engineer this part — a defensible, explained
score beats a "smarter" one you can't justify live.

---

## Hour-by-hour (6-hour window)

**0:00–0:30** — Step 0 + Step 1 above. Don't skip this or build around it;
get the two real `action_id`s before writing anything else.

**0:30–1:00** — Wire the real param names and response field names into
`server.js`. Hit `/api/refresh` directly in the browser (not the UI yet),
confirm you get real numbers back for a couple of tickers.

**1:00–1:30** — Trim/adjust the category lists in `watchlist.js` to names
you know have active subreddit chatter (meme-stock names work better than
sleepy blue chips for a demo).

**1:30–2:30** — Get the full pipeline running clean for your target
categories.
This is where you'll hit `AUTH_REQUIRED`, rate limits, or per-call
failures — the `redditOk`/`financeOk` flags in the table and the `flag`
text under each bar exist so you can see broken rows live instead of
silently wrong numbers.

**2:30–3:30** — Open `public/index.html` in the browser, confirm the bars
and callouts render correctly against real data. Tune the scoring weights
if everything pins to one side.

**3:30–4:30** — Polish pass: tighten copy, double check it reads fine on a
laptop being screen-shared (this is what judges will actually see), make
sure the loading state during a refresh doesn't look broken.

**4:30–5:00** — Buffer. Something in this list will eat more time than
planned — this slot is for that, not new features.

**5:00–5:30** — Stretch, only if everything above is solid: add a one-line
LLM blurb per overhyped ticker using Anakin's Agentic Search or Search API,
citing the actual Reddit threads it's reacting to.

**5:30–6:00** — Pre-run a fresh refresh right before you demo (don't rely on
a live call working perfectly in front of judges), and prep a 30-second
pitch: "two unrelated data sources, one number neither gives you alone."

---

## Demo script

1. Open the page already loaded with a fresh run.
2. Point at the loudest, least-fundamentals-backed ticker at the top —
   "Reddit's screaming about this one, but the actual numbers don't back it
   up."
3. Point at the bottom — "this one's quietly moving and nobody's talking
   about it."
4. Hit Refresh live to prove it's real, not canned — narrate the "running
   Wire jobs…" status while it works.
5. One sentence on the architecture: "every number on this page is two Wire
   calls — one to Reddit's catalog, one to a finance catalog — scored and
   diffed."
