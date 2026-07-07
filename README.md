<<<<<<< HEAD
# Cartograph

*The reading app where you can't fake it. One page a day, three questions — recall it, reframe it, apply it — and the fog lifts only over terrain you actually understood.*

A local-first prototype of the product defined in the PRD, architecture, and security docs.

---

## Quickstart

Requires Node.js 18+ (nothing else — no database to install, no accounts to create).

```bash
npm install
npm run dev
```

Open http://localhost:3000, name your explorer, and chart your first zone. It works **fully offline out of the box** — a built-in mock guide asks the questions and grades heuristically.

### Turning on the real guide (Claude)

```bash
cp .env.example .env.local
# then put your Anthropic API key in .env.local
```

With a key present, Claude generates the Socratic questions, grades your answers, and distills your artifacts. Without one, the mock engine runs. Same interface, one switch (`lib/llm.ts`).

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Run locally with hot reload |
| `npm run build && npm start` | Production build + serve |
| `npm run reset` | Wipe all local profiles/progress (the fog rolls back in) |

`DEV_UNLIMITED_SESSIONS=true` (the default) lets you play many sessions per day for testing. Set it to `false` in `.env.local` to feel the real one-page-a-day product.

---

## How the loop works

1. **Terrain** — today's excerpt renders on the right; the region map on the left shows your progress as fog.
2. **The ladder** — the guide asks three escalating questions: *Recall* (did you read it?), *Reframe* (can you say it in your own words?), *Apply* (where does it touch your life?). One retry per tier; a second miss moves you on with partial credit — the trail never traps you.
3. **The reveal** — completing the session lifts the fog on that zone, mints an **artifact** (your insight, in your words) into the journal, updates your **streak**, and adds to your **Depth Score**.
4. **The board** — Depth Score = accuracy × novelty of your personal connection × terrain difficulty. Skimming scores nothing.

## Project map

```
app/
  page.tsx                    landing
  login/                      name-based local profiles
  expedition/                 region picker
  expedition/[slug]/          THE core screen: map + terrain + dialogue
  journal/                    collected artifacts
  leaderboard/                the Depth Board
  api/auth/*                  login/logout (cookie session)
  api/session/start           creates today's session, first question
  api/session/answer          the whole state machine: grade → retry/advance → complete
components/
  FogMap.tsx                  the signature: generated SVG chart, fog lifts per zone
  SessionChat.tsx             dumb client — renders state, posts answers
lib/
  db.ts                       local JSON store (data/db.json)
  llm.ts                      pluggable engine: Claude or mock, fail-open on errors
  prompts.ts                  EVERY word the guide says — tune tone here only
  scoring.ts                  Depth Score formula (pure function)
  auth.ts                     cookie session + username rules
content/
  regions.ts                  seed region (Meditations, public domain) — add yours here
```

## Design decisions worth knowing

- **All grading and scoring is server-side.** The client only submits text. This mirrors the security doc's core rule: no browser can ever write a score. Even in a local prototype, the habit matters.
- **Fail open.** If the LLM times out or returns garbage (retry once first), the user passes and the incident is logged. Your infrastructure's bad day must never break someone's streak.
- **Prompts live in one file** (`lib/prompts.ts`). The product's #1 risk is "feels like school" — tone tuning should be one file, not a hunt.
- **The map is generated SVG**, not assets: zone blobs are deterministic "hand-drawn" wobbles, fog is a hatch pattern, grain is an SVG filter. Restyling the whole chart is editing one component.

## Prototype ↔ production map

This prototype deliberately swaps heavy infrastructure for local equivalents. The seams are clean:

| Here (local prototype) | Production (per architecture doc) |
|---|---|
| `lib/db.ts` JSON store | Supabase Postgres — table shapes already match 1:1 |
| Cookie + username auth | Supabase magic links |
| RLS simulated by server-only writes | Real Row Level Security policies |
| `DEV_UNLIMITED_SESSIONS` | One-session-per-day DB constraint |
| Machine-local dates | Per-user IANA timezone (security doc §5.1) |
| Mock grader fallback | Same fail-open path, plus Sentry logging |

## Known prototype limits (on purpose)

- Streaks use your machine's local date — fine locally, must be per-user timezone in production.
- "Profiles" are trust-based names on one machine; the leaderboard is your household/friends, not the internet.
- The Mirror (day-30 belief diff) is not built yet — artifacts are being collected for it. It's the next feature after the loop proves itself on you.
- Public-domain seed content only (Meditations, George Long translation, abridged). Add regions in `content/regions.ts`.

## The founder's gate

Before building more: **use it daily for 14 days.** If you skip three days, the loop is wrong — fix the loop, not the feature list. The product's first user was always meant to be you.
=======
# Cartography

The prd and architecture docs are ai-generated based on specificatoins and idea's i have given to the llm. they are starting points for clarity while making the prototype and supporting in simplyfying what i intend to build and not stray away from my path.
>>>>>>> 93b6da99bd0e61e22ea252462eb2328b38931d93
