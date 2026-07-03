# Technical Architecture Document: Cartograph

**Version:** 1.0 · **Audience:** Solo developer, zero budget · **Companion doc:** cartograph-prd.md

---

## 1. Architecture Philosophy

You are one person shipping in 2–3 weeks. Every choice below optimizes for: **free tier, one language, one repo, zero DevOps.** The architecture is a monolith on purpose — microservices, queues, and Docker are v3 problems you may never have.

```
Browser ──> Next.js (Vercel) ──> Supabase (Postgres + Auth)
                   │
                   └──> Anthropic API (Claude Haiku) — server-side only
```

---

## 2. Tech Stack & Reasoning

| Layer | Choice | Why this, why not alternatives |
|---|---|---|
| Framework | **Next.js 14+ (App Router, TypeScript)** | Frontend + API routes in one repo/language. Vercel free tier deploys on git push. Alternatives: separate React+Express doubles your surface area for zero gain at this scale. |
| Database + Auth | **Supabase (Postgres)** | Free tier covers 500MB DB / 50k MAU — years of runway at 200 users. Magic-link auth is built in (PRD requires it). Row Level Security replaces writing your own authorization layer. Alternative: Firebase — but Firestore's document model fights your relational data (expeditions→sessions→artifacts), and SQL keeps the leaderboard a one-line view. |
| LLM | **Claude Haiku via Anthropic API** | Cheapest model that handles Socratic questioning well (~$0.001/user/day; 200 users ≈ $6/mo). Called only from server routes — the API key must never reach the browser. |
| Styling | **Tailwind CSS** | Fast iteration, no CSS architecture decisions. shadcn/ui for the few components you need (dialog, toast). |
| Map rendering | **Inline SVG + CSS transitions** | The fog-of-war map is zones of a hand-drawn SVG revealed by class toggles. No canvas, no game engine — Phaser/PixiJS is massive overkill for "reveal region on pass" and would eat your 3 weeks. |
| State | **React state + Supabase queries; no Redux/Zustand** | One screen, one loop. Server components fetch; a single client component runs the session. |
| Validation | **Zod** | Validates LLM JSON output (grading responses) and API inputs. LLMs return malformed JSON ~1–2% of the time; Zod + one retry handles it. |
| Hosting | **Vercel free tier** | Push to deploy, HTTPS, edge caching for excerpts. |
| Email (v1.x) | Resend free tier | Only when you add the weekly digest — skip in MVP. |

**Total monthly cost at 200 users: ~$6 (Anthropic only).**

---

## 3. Project Structure

```
cartograph/
├── app/
│   ├── layout.tsx                  # Root layout, fonts, providers
│   ├── page.tsx                    # Landing page (pitch + sample map)
│   ├── login/page.tsx              # Magic-link form
│   ├── auth/callback/route.ts      # Supabase auth redirect handler
│   ├── expedition/
│   │   ├── page.tsx                # Region picker (3 launch regions)
│   │   └── [regionSlug]/page.tsx   # THE core screen: map + today's session
│   ├── journal/page.tsx            # Artifact list
│   ├── leaderboard/page.tsx        # Depth Score rankings
│   ├── mirror/page.tsx             # Day-30 diff view
│   └── api/
│       ├── session/start/route.ts  # Creates session, returns today's excerpt
│       ├── session/answer/route.ts # Grades one answer tier via Claude, returns next question
│       ├── session/complete/route.ts # Finalizes score, extracts artifact, updates map/streak
│       └── mirror/generate/route.ts  # Builds the day-30 diff via Claude
├── components/
│   ├── FogMap.tsx                  # SVG map, zone reveal logic — your 50% effort item
│   ├── SessionChat.tsx             # Question/answer UI (client component)
│   ├── ArtifactCard.tsx
│   ├── StreakBadge.tsx
│   └── ui/                         # shadcn primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (anon key)
│   │   ├── server.ts               # Server client (cookies-based)
│   │   └── admin.ts                # Service-role client — server ONLY
│   ├── claude.ts                   # Anthropic wrapper: retries, Zod parsing, token caps
│   ├── prompts.ts                  # ALL LLM prompts in one file (tone lives here)
│   ├── scoring.ts                  # Depth Score formula — pure function, unit-testable
│   └── types.ts                    # Shared TS types mirroring DB schema
├── content/
│   └── regions/                    # Curated excerpts as markdown, seeded into DB
│       ├── pg-essays/
│       ├── meditations/
│       └── walden/
├── supabase/
│   ├── migrations/                 # SQL migration files (schema below)
│   └── seed.sql                    # Loads regions + excerpts from /content
├── public/maps/                    # Hand-drawn SVG map files per region
├── .env.local                      # Never committed
├── .env.example                    # Committed template
└── middleware.ts                   # Auth guard for /expedition, /journal, etc.
```

Key principle: **all LLM prompts live in `lib/prompts.ts`.** The PRD's #1 risk is "questions feel like school" — you'll tune tone constantly, and hunting prompts across files kills iteration speed.

---

## 4. Database Schema

Six tables plus one view. Supabase manages `auth.users`; everything below is your `public` schema.

### 4.1 `profiles`
One row per user; extends `auth.users`. **Plain English:** the player card — identity, streak, lifetime score.

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | FK → auth.users.id, cascade delete |
| username | text, unique | Shown on leaderboard; generated on signup, editable |
| streak_count | int, default 0 | Consecutive days with a completed session |
| last_session_date | date, nullable | Used to compute streak continuation/reset |
| total_depth_score | numeric, default 0 | Denormalized running sum — keeps leaderboard a simple sort |
| created_at | timestamptz | |

*Auto-created by a Postgres trigger on `auth.users` insert.*

### 4.2 `regions`
**Plain English:** a book or essay collection — one explorable territory.

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| slug | text, unique | URL identifier, e.g. `meditations` |
| title / author | text | |
| difficulty | enum: `shallows`,`foothills`,`highlands`,`peaks` | |
| difficulty_multiplier | numeric | 1.0 / 1.3 / 1.6 / 2.0 — feeds Depth Score |
| description | text | Region-picker copy |
| map_svg_path | text | e.g. `/maps/meditations.svg` |
| excerpt_count | int | Denormalized; drives "X% explored" |
| is_published | boolean | Lets you stage new regions |

### 4.3 `excerpts`
**Plain English:** one day's terrain — the ordered chunks a region is split into.

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| region_id | uuid, FK → regions | |
| position | int | Order within region; unique(region_id, position) |
| title | text | e.g. "Book II, §1–4" |
| content | text | The 2–3 page excerpt (public domain / permissioned) |
| word_count | int | |
| map_zone_id | text | Matches an SVG `<g id>` in the region's map file — this string is the bridge between DB and visual |

### 4.4 `expeditions`
**Plain English:** a user's journey through one region — the save file. Unique(user_id, region_id).

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | |
| region_id | uuid, FK → regions | |
| status | enum: `active`,`completed`,`abandoned` | MVP allows one `active` per user |
| current_position | int, default 1 | Which excerpt is "today's terrain" |
| started_at / completed_at | timestamptz | |

### 4.5 `sessions`
**Plain English:** one daily reading + questioning encounter — the heart of the product. Every row is one core-loop completion (or attempt).

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| expedition_id | uuid, FK → expeditions | |
| user_id | uuid, FK → profiles | Denormalized for cheap RLS + leaderboard queries |
| excerpt_id | uuid, FK → excerpts | |
| conversation | jsonb | Full Q&A message history — keeps schema stable while you iterate on question format |
| recall_passed / reframe_passed / apply_passed | boolean, nullable | The three-tier ladder; null = not reached |
| apply_novelty | numeric 0–1, nullable | LLM-scored originality of the Apply answer |
| depth_score | numeric, default 0 | accuracy × apply_novelty × difficulty_multiplier, computed server-side in `scoring.ts` |
| started_at / completed_at | timestamptz | completed_at null = abandoned mid-session |

*Why JSONB for conversation instead of a `messages` table: you'll change the question flow weekly during tuning; a rigid table would need a migration each time, and you never query individual messages relationally.*

### 4.6 `artifacts`
**Plain English:** the one insight extracted per session — the journal, and the raw material for Mirror.

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| session_id | uuid, FK → sessions, unique | One artifact per session |
| user_id | uuid, FK → profiles | |
| content | text | The insight, phrased from the user's own answer |
| themes | text[] | LLM-assigned tags (e.g. `{discipline, identity}`) — this is how Mirror finds "same theme, 30 days apart" |
| created_at | timestamptz | |

### 4.7 `mirror_diffs`
**Plain English:** a generated Day-1 vs Day-30 comparison on one theme — the shareable payoff.

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles | |
| theme | text | |
| early_excerpt / late_excerpt | text | Snippets of the user's own past answers |
| commentary | text | LLM's observation of the shift |
| generated_at | timestamptz | |

### 4.8 `leaderboard` (view, not a table)
```sql
create view leaderboard as
select username, total_depth_score,
       rank() over (order by total_depth_score desc) as rank
from profiles
where total_depth_score > 0;
```
**Plain English:** the leaderboard is just profiles sorted by score. At 200 users this needs no caching, no materialization, nothing.

### Relationships in one sentence
A **profile** starts **expeditions** into **regions**; each expedition produces daily **sessions** against **excerpts**; each session yields one **artifact**; artifacts sharing themes across time are compared into **mirror_diffs**.

---

## 5. Row Level Security (non-optional)

Enable RLS on every table. The policies that matter:

- `profiles`: anyone authenticated can **read** (leaderboard needs usernames); users can **update only their own row** — but exclude `total_depth_score` and `streak_count` from client updates (score writes go through the service-role client in API routes, or a `security definer` function).
- `expeditions`, `sessions`, `artifacts`, `mirror_diffs`: users can read/insert **only rows where `user_id = auth.uid()`**. Updates to pass/score fields happen server-side only.
- `regions`, `excerpts`: public read where `is_published = true`; no client writes.

**Why the strictness:** your leaderboard is the product's credibility. If the browser can write `depth_score`, someone will set theirs to 9999 within a week of launch.

---

## 6. Environment Variables

`.env.example`:

```bash
# Supabase — from Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # Safe in browser (RLS enforces access)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # SERVER ONLY — bypasses RLS. Never NEXT_PUBLIC_.

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...                # SERVER ONLY — never NEXT_PUBLIC_.
CLAUDE_MODEL=claude-haiku-...               # Env var so you can swap models without a deploy

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # Used in magic-link redirects; set to prod URL on Vercel
```

**Rules:**
1. Anything prefixed `NEXT_PUBLIC_` is compiled into the browser bundle. The service-role key or Anthropic key with that prefix = game over.
2. Set the same vars in Vercel's dashboard for production; `.env.local` is gitignored.
3. In Supabase Auth settings, add both localhost and your prod URL to the redirect allowlist, or magic links will silently fail in prod.

---

## 7. Configuration & Gotchas Before You Start

1. **LLM calls only in `/app/api/*` routes.** The browser sends the user's answer; the server holds the prompt, calls Claude, grades, writes the score. This protects the key *and* the prompt (your grading prompt is gameable if visible).
2. **Cap Claude output tokens (~500) and set temperature ~0.7** for questions, **~0.2 for grading**. Grading needs consistency; questioning needs warmth.
3. **Grading responses must be structured.** Prompt Claude to return JSON (`{passed, feedback, novelty}`), parse with Zod, retry once on failure, and on second failure fail *open* (pass the user, log it) — never block a streak on your parser.
4. **Rate-limit the answer endpoint** (e.g., 30 req/hour/user via a simple Postgres count). You have no billing alerts wired to users; one script kiddie shouldn't be able to run up your Anthropic bill.
5. **Streak logic runs server-side at session completion**, comparing `last_session_date` to today in the *user's* timezone — store an IANA timezone string on the profile at signup, or every streak resets at UTC midnight and your users in India revolt.
6. **SVG maps:** each zone is a `<g id="zone-3">` matching `excerpts.map_zone_id`. Fog = a dark overlay per zone removed by CSS class. Commission or hand-draw one map first; validate the reveal feels good before making three.
7. **Seed content lives in git** (`/content`), loaded by `seed.sql`/script. Your curation is product IP — keep it versioned, not hand-pasted into a dashboard.
8. **Supabase free tier pauses after 7 days of inactivity.** Fine during dev; before launch, know that a cold DB adds ~2s to first request or set up a keep-alive ping.
9. **Migrations from day one** (`supabase migration new ...`). Clicking around the dashboard UI feels faster until you need to recreate the schema and can't remember what you did.

---

## 8. Build Order (maps to PRD week 2–3)

1. Supabase project + schema migrations + RLS + seed one region
2. Auth (magic link) + profile trigger + middleware guard
3. Core API routes: start → answer → complete, with prompts + scoring
4. Session UI (chat) wired to routes — playable with an ugly map
5. FogMap component + one real SVG — spend the saved time here
6. Journal, leaderboard, streaks
7. Mirror generation (can ship days after launch; nobody hits day 30 in week one)
