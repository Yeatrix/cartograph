import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getRegion } from "@/content/regions";
import { todayStr, yesterdayStr, updateUser } from "@/lib/db";
import { gradeAnswer, generateQuestion, extractArtifact } from "@/lib/llm";
import { GUIDE_LINES } from "@/lib/prompts";
import { depthScore } from "@/lib/scoring";
import { Artifact, Session, SessionSummary, Tier, TIERS } from "@/lib/types";

const MAX_ATTEMPTS = 2; // second miss advances anyway — never trap the explorer

export async function POST(req: Request) {
  const user = currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body;
  const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 2000) : "";
  if (!answer) return NextResponse.json({ error: "Say a little more than nothing." }, { status: 400 });

  const session = user.sessions.find((s) => s.id === sessionId && !s.completedAt);
  if (!session) return NextResponse.json({ error: "No open session" }, { status: 404 });

  const expedition = user.expedition;
  const region = expedition && getRegion(expedition.regionSlug);
  if (!expedition || !region) return NextResponse.json({ error: "No expedition" }, { status: 400 });
  const excerpt = region.excerpts[session.excerptPosition - 1];

  const tier = TIERS.find((t) => session.passed[t] === null);
  if (!tier) return NextResponse.json({ error: "Session already finished" }, { status: 400 });

  const lastQuestion =
    [...session.conversation].reverse().find((m) => m.role === "guide" && m.tier === tier)?.text ?? "";
  const grade = await gradeAnswer(tier, excerpt, lastQuestion, answer);

  // ── Mutate the session (server-side only; the client just talks) ──────────
  session.conversation.push({ role: "explorer", tier, text: answer });
  session.conversation.push({ role: "guide", tier, text: grade.feedback });
  session.attempts[tier] += 1;

  if (grade.passed) {
    session.passed[tier] = true;
  } else if (session.attempts[tier] >= MAX_ATTEMPTS) {
    session.passed[tier] = false; // move on with partial credit
    session.conversation.push({ role: "guide", tier, text: GUIDE_LINES.movingOn });
  }
  if (tier === "apply" && typeof grade.novelty === "number") {
    session.applyNovelty = grade.novelty;
  }

  const nextTier = TIERS.find((t) => session.passed[t] === null);

  if (nextTier && nextTier !== tier) {
    const priorAnswers = session.conversation.filter((m) => m.role === "explorer").map((m) => m.text);
    const q = await generateQuestion(nextTier, excerpt, priorAnswers);
    session.conversation.push({ role: "guide", tier: nextTier, text: q });
  }

  let result: SessionSummary | null = null;

  if (!nextTier) {
    // ── Complete: score, artifact, map, streak — all server-authored ────────
    const lastApply =
      [...session.conversation].reverse().find((m) => m.role === "explorer" && m.tier === "apply")?.text ?? answer;
    const art = await extractArtifact(excerpt, lastApply);

    session.depthScore = depthScore(session.passed, session.applyNovelty, region.difficultyMultiplier);
    session.completedAt = new Date().toISOString();
    session.conversation.push({ role: "guide", tier: "apply", text: GUIDE_LINES.completed });

    const artifact: Artifact = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      excerptTitle: excerpt.title,
      content: art.content,
      themes: art.themes,
      createdAt: new Date().toISOString()
    };

    const today = todayStr();
    const yesterday = yesterdayStr();

    let streakNow = 0;
    let regionCompleted = false;

    updateUser(user.profile.username, (u) => {
      const s = u.sessions.find((x) => x.id === session.id);
      if (s) Object.assign(s, session);
      u.artifacts.push(artifact);

      // Streaks break only when the explorer doesn't show up — never twice a day.
      if (u.profile.lastSessionDate !== today) {
        u.profile.streak = u.profile.lastSessionDate === yesterday ? u.profile.streak + 1 : 1;
        u.profile.lastSessionDate = today;
      }
      u.profile.totalDepthScore += session.depthScore;
      streakNow = u.profile.streak;

      if (u.expedition) {
        u.expedition.currentPosition += 1;
        if (u.expedition.currentPosition > region.excerpts.length) {
          u.expedition.status = "completed";
          regionCompleted = true;
        }
      }
    });

    result = {
      depthScore: session.depthScore,
      passedCount: TIERS.filter((t) => session.passed[t]).length,
      artifact,
      streak: streakNow,
      zoneRevealed: excerpt.zoneName,
      regionCompleted
    };
  } else {
    // Persist mid-session progress so a lost connection resumes cleanly.
    updateUser(user.profile.username, (u) => {
      const s = u.sessions.find((x) => x.id === session.id);
      if (s) Object.assign(s, session);
    });
  }

  return NextResponse.json({
    conversation: session.conversation,
    passed: session.passed,
    done: !!result,
    result
  });
}
