# PRD: Cartograph (ai=generated)

**Version:** 1.0 · **Owner:** Solo founder · **Status:** Pre-build

---

## 1. Overview

Cartograph is a web app that turns deep reading into an exploration game. Users read short daily excerpts, prove comprehension through LLM-driven questions, and watch a fog-of-war map of the book uncover as they *understand* it — not just read it. A monthly "Mirror" diff shows how their thinking has changed.

**One-liner:** *The reading app where you can't fake it — the leaderboard ranks understanding, not pages.*

## 2. Problem

Motivated people buy books and abandon them. Existing tools fail in two ways:
- **Reading apps** (Kindle, Blinkist) track volume, so skimming is rewarded and retention is zero.
- **Comprehension tools** (NotebookLM) are utilities with no habit pull — nobody opens them daily.

No product makes *understanding* the progress metric, and none shows users how reading changed their thinking.

## 3. Target User

- **Primary:** Self-improvement-curious 20–35 year olds (X/HN/IndieHackers crowd) who buy books, quit by chapter 3, and feel guilty. Enjoy light games; hate feeling lectured.
- **First user:** The founder (dogfooding is a launch requirement).

## 4. Goals & Success Metrics

| Goal | Metric | Target (90 days) |
|---|---|---|
| Habit formation | D7 retention | ≥ 40% |
| | D30 retention | ≥ 20% |
| Core loop works | Avg. sessions/week per active user | ≥ 4 |
| Depth over volume | Depth-question pass rate | 60–80% (too high = too easy) |
| Growth | Registered users | 100–200 |
| Founder outcome | Founder streak | 30 consecutive days |

**North star:** Weekly Deep Sessions (sessions where user passes all 3 question tiers).

## 5. Core Features

### Must-have (MVP)
1. **Daily Terrain** — 2–3 page curated excerpt from the active region (public-domain books + permissioned essays). One per day.
2. **Comprehension Ladder** — 3 LLM questions per session: Recall → Reframe → Apply. Conversational tone, not exam tone. Pass/fail per tier.
3. **Fog-of-War Map** — Hand-drawn-style map per book; sections illuminate only when questions are passed. This is the emotional core — budget 50% of frontend effort here.
4. **Artifacts** — LLM extracts one insight per session in the user's own words; saved to journal.
5. **Depth Score & Leaderboard** — Score = accuracy × apply-novelty × region difficulty. Single global board.
6. **Mirror Diff (Day 30)** — Side-by-side of Day-1 vs Day-30 "Apply" answers on recurring themes.
7. **3 Launch Regions** — e.g., Paul Graham essays (Shallows), *Meditations* (Highlands), a dense classic (Peaks).
8. **Auth + streak counter** — Email magic link. Minimal.

### Nice-to-have (v1.x, only after retention is proven)
- Expedition parties (20-person guild leaderboards)
- Weekly email digest of artifacts
- More regions; difficulty-based unlocks
- Achievements/cosmetics
- Spaced-repetition review of artifacts

## 6. User Flow

1. **Land** → one-screen pitch + sample map → sign up (magic link).
2. **Pick a region** (3 options, difficulty labeled).
3. **Daily session (~10 min):** read excerpt → answer 3 escalating questions in chat → map section uncovers with animation → artifact revealed and saved → Depth Score updates → "return tomorrow" state.
4. **Repeat daily.** Streak + partially-lit map create the pull.
5. **Day 30:** Mirror diff screen ("who you were vs. who you are") → shareable image → prompt to start next region.
6. **Anytime:** view journal (artifacts), map, leaderboard.

## 7. MVP Definition

One screen, one loop, shippable in 2–3 weeks:
- **Stack:** Next.js + Supabase + Claude Haiku API (~$0.001/user/day; 200 users ≈ $6/mo).
- **Scope:** Features 1–8 above. Web only, desktop + mobile responsive.
- **Pre-code gate:** Founder runs the loop manually (Claude.ai + one PG essay) for 5 days. If founder skips days, revise the loop before building.

## 8. Explicitly NOT Building in V1

- ❌ User-uploaded books (copyright + parsing complexity)
- ❌ Native mobile apps
- ❌ Payments/subscriptions
- ❌ Guilds/parties/social feed
- ❌ Multiple concurrent regions per user
- ❌ Audio/TTS narration
- ❌ AI-generated reading content (curation only)
- ❌ Global chat, comments, or any UGC moderation surface

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Questions feel like school → churn | Curious-companion tone; test prompts on founder first |
| Map reads as a progress bar | Hand-drawn aesthetic (ref: *A Short Hike*, *Dorfromantik*) |
| Leaderboard gamed by skimmers | Depth Score already weights accuracy + novelty; monitor pass rates |
| Empty leaderboard at launch | Seed with founder + 5 friends before public launch |
| Founder builds instead of reads | 5-day manual gate before any code |

## 10. Launch Plan (summary)

Week 1: manual validation. Weeks 2–3: build MVP. Week 4: launch with a "my 30-day map + Mirror diff" thread on X / HN Show / r/getdisciplined. Target: 50 signups in week one.
