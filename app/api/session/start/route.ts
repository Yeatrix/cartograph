import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getRegion } from "@/content/regions";
import { todayStr, updateUser } from "@/lib/db";
import { generateQuestion } from "@/lib/llm";
import { GUIDE_LINES } from "@/lib/prompts";
import { Session } from "@/lib/types";

const DEV_UNLIMITED = process.env.DEV_UNLIMITED_SESSIONS !== "false";

export async function POST(req: Request) {
  const user = currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { regionSlug } = await req.json().catch(() => ({}));
  const region = getRegion(regionSlug);
  if (!region) return NextResponse.json({ error: "Unknown region" }, { status: 404 });

  const username = user.profile.username;
  const today = todayStr();

  // One session per day (the real rule) — relaxed in dev so you can playtest.
  if (!DEV_UNLIMITED && user.sessions.some((s) => s.date === today && s.completedAt)) {
    return NextResponse.json({ alreadyDoneToday: true });
  }

  // Ensure an expedition exists; server owns this, never the client.
  if (!user.expedition) {
    updateUser(username, (u) => {
      u.expedition = { regionSlug, status: "active", currentPosition: 1, startedAt: new Date().toISOString() };
    });
  }
  const fresh = currentUser()!;
  const expedition = fresh.expedition!;
  if (expedition.status === "completed") {
    return NextResponse.json({ regionCompleted: true });
  }

  const excerpt = region.excerpts[expedition.currentPosition - 1];

  // Resume an in-progress session (connection-loss edge case).
  const existing = fresh.sessions.find(
    (s) => s.date === today && s.excerptPosition === excerpt.position && !s.completedAt
  );
  if (existing) {
    return NextResponse.json({ session: pub(existing) });
  }

  const question = await generateQuestion("recall", excerpt, []);
  const session: Session = {
    id: crypto.randomUUID(),
    date: today,
    excerptPosition: excerpt.position,
    conversation: [
      { role: "guide", tier: "recall", text: GUIDE_LINES.opening(excerpt.zoneName) },
      { role: "guide", tier: "recall", text: question }
    ],
    passed: { recall: null, reframe: null, apply: null },
    attempts: { recall: 0, reframe: 0, apply: 0 },
    applyNovelty: null,
    depthScore: 0,
    startedAt: new Date().toISOString(),
    completedAt: null
  };
  updateUser(username, (u) => u.sessions.push(session));
  return NextResponse.json({ session: pub(session) });
}

function pub(s: Session) {
  return { id: s.id, conversation: s.conversation, passed: s.passed };
}
