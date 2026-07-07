import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import FogMap from "@/components/FogMap";
import SessionChat from "@/components/SessionChat";
import { currentUser } from "@/lib/auth";
import { getRegion } from "@/content/regions";
import { todayStr } from "@/lib/db";
import { llmMode } from "@/lib/llm";

export const dynamic = "force-dynamic";

const DEV_UNLIMITED = process.env.DEV_UNLIMITED_SESSIONS !== "false";

export default function ExpeditionScreen({ params }: { params: { slug: string } }) {
  const user = currentUser();
  if (!user) redirect("/login");

  const region = getRegion(params.slug);
  if (!region) notFound();

  const today = todayStr();
  const currentPosition = user.expedition?.currentPosition ?? 1;
  const completed = user.expedition?.status === "completed";

  const revealed = user.sessions.filter((s) => s.completedAt).map((s) => s.excerptPosition);
  const excerpt = completed ? null : region.excerpts[currentPosition - 1];

  // Resume a half-finished session after a lost connection or reload.
  const openSession =
    (excerpt &&
      user.sessions.find((s) => s.date === today && s.excerptPosition === excerpt.position && !s.completedAt)) ||
    null;

  const alreadyDoneToday = !DEV_UNLIMITED && user.sessions.some((s) => s.date === today && !!s.completedAt);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
        {/* The chart */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <div className="border border-pine-edge bg-pine p-2">
            <FogMap revealed={revealed} current={completed ? null : currentPosition} title={region.title} />
          </div>
          <p className="font-instrument text-[11px] text-faded flex justify-between">
            <span>
              GUIDE MODE: {llmMode() === "claude" ? "CLAUDE" : "MOCK (add ANTHROPIC_API_KEY for the real guide)"}
            </span>
            {DEV_UNLIMITED && <span>DEV \u00b7 UNLIMITED SESSIONS</span>}
          </p>
        </div>

        {/* Today's terrain + dialogue */}
        <div className="space-y-6">
          {completed ? (
            <div className="border border-pine-edge bg-pine p-6 space-y-3">
              <p className="font-instrument text-xs tracking-[0.25em] text-moss">REGION CHARTED</p>
              <h1 className="text-3xl">{region.title}, fully mapped.</h1>
              <p className="text-mist leading-relaxed">
                Six zones, six artifacts. Your journal holds the record of the climb &mdash; and adding
                the next region is one entry in <span className="font-instrument text-xs">content/regions.ts</span>.
              </p>
            </div>
          ) : (
            excerpt && (
              <>
                <div>
                  <p className="font-instrument text-xs tracking-[0.25em] text-moss mb-1">
                    TODAY&apos;S TERRAIN \u00b7 ZONE {excerpt.position}/{region.excerpts.length} \u00b7 {excerpt.zoneName.toUpperCase()}
                  </p>
                  <h1 className="text-3xl mb-1">{excerpt.title}</h1>
                  <p className="font-instrument text-xs text-faded">{excerpt.source}</p>
                </div>
                <div className="terrain-text border-l-2 border-parchment-deep pl-5">
                  {excerpt.content.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <SessionChat
                  regionSlug={region.slug}
                  initialSession={
                    openSession
                      ? { id: openSession.id, conversation: openSession.conversation, passed: openSession.passed }
                      : null
                  }
                  alreadyDoneToday={alreadyDoneToday}
                />
              </>
            )
          )}
        </div>
      </main>
    </>
  );
}
