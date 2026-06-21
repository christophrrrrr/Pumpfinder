# Pump

A fast daily **stock news-briefing** web app. Paste in the tickers you got from
your investor group and instantly get a scannable AI card per stock — catalyst
summary, financial health, volatility behavior, and an optional AI verdict — so
you can size up a short-term trade in under five minutes.

> Informational only — **not financial advice**. Data comes from free public
> feeds and may be delayed or incomplete. There is **no trade execution**.

## What each card shows

- **AI Catalyst Summary** (Gemini) — why the stock is moving, and whether the
  catalyst looks meaningful or like hype. Optional **AI Verdict** scores
  (Catalyst / Financials / Volatility, 0–10) with a Strong Candidate / Likely
  Hype / Neutral label. Toggle it on/off.
- **Financial Health** — market cap, revenue + growth, profitability, free cash
  flow, cash, debt, country.
- **Volatility & Behavior** — annualized volatility, typical daily move, recent
  big single-day moves, and volume-spike detection.
- **News & Catalysts** — an AI bullet-point digest of the recent news (Yahoo +
  Google News) and SEC filings (8-K / 10-Q / 10-K), with each point linked to its
  source. Plus a TradingView chart link. (Falls back to raw headline links when
  AI is off.)

## Tech

Next.js (App Router) + Tailwind, deployed on Vercel's free tier. Data: the free
`yahoo-finance2` library, Google News RSS, and SEC EDGAR. AI: Google Gemini
(free tier). Optional: Supabase/Neon Postgres for persistent history.

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then edit .env.local (see below)
npm run dev                     # http://localhost:3000
```

Log in with the `APP_PASSWORD` you set. The app runs with only `APP_PASSWORD` +
`SESSION_SECRET`; everything else is optional and unlocks extra features.

### Environment variables (`.env.local`)

| Variable | Required | What it enables |
| --- | --- | --- |
| `APP_PASSWORD` | yes | The single login password. |
| `SESSION_SECRET` | yes | Cookie encryption (>=32 chars). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | no | AI summary + verdict. Free key: <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash`. |
| `DATABASE_URL` | no | Persistent history. A Postgres **connection string** (Supabase/Neon free tier), e.g. `postgresql://…pooler.supabase.com:6543/postgres` — not a Supabase API key. Without it, history is in-memory and resets on restart. |

> **Note for this Windows machine:** a TLS-inspecting security tool is installed,
> so Node can't verify Google/SEC certificates with its bundled CA list. The
> `dev` script already passes `--use-system-ca` to fix this locally. Hosted
> environments (Vercel) don't need it.

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new> (it auto-detects Next.js).
3. Add the environment variables above in the Vercel project settings.
4. For persistent history, add a Postgres database from the Vercel
   Storage/Marketplace (Neon) — it sets `DATABASE_URL` for you.
5. Deploy. Share the URL with your mom; she logs in with `APP_PASSWORD`.

## Notes & limitations

- Not real-time: this is a research/news briefing tool, **not** premarket/live
  quotes (by design — that keeps it free).
- Free data sources can be rate-limited or occasionally stale; each card section
  fails softly (shown as a small notice) rather than breaking the page.
- Gemini's free tier has rate limits and may use prompts to improve Google's
  models (only public stock info is sent). Lookups are cached ~30 min to stay
  within limits.
