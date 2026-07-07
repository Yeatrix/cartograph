import Link from "next/link";
import FogMap from "@/components/FogMap";

export default function Landing() {
  return (
    <main className="mx-auto max-w-5xl px-4">
      <div className="py-4 font-instrument tracking-[0.3em] text-sm text-parchment">CARTOGRAPH</div>
      <section className="grid md:grid-cols-2 gap-10 items-center py-14">
        <div className="space-y-6">
          <p className="font-instrument text-xs tracking-[0.3em] text-moss">A READING EXPEDITION</p>
          <h1 className="text-5xl leading-tight">
            The map only reveals what you actually understood.
          </h1>
          <p className="text-mist text-lg leading-relaxed">
            One page a day. Three questions you can&apos;t fake &mdash; recall it, reframe it, apply it
            to your own life. Pass, and the fog lifts. Skim, and the territory stays dark.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="font-instrument tracking-widest text-sm bg-ember text-ink px-6 py-3 hover:bg-ember-bright"
            >
              BEGIN CHARTING
            </Link>
            <span className="font-instrument text-xs text-faded">free &middot; runs on your machine</span>
          </div>
        </div>
        <div className="border border-pine-edge p-2 bg-pine">
          <FogMap revealed={[1, 2, 3]} current={4} compact />
        </div>
      </section>
      <section className="grid md:grid-cols-3 gap-6 pb-16">
        {[
          ["TERRAIN", "A short excerpt from a great book \u2014 two or three pages, chosen for density, not length."],
          ["THE LADDER", "A guide asks three things: what it said, what it means in your words, where it touches your life."],
          ["ARTIFACTS", "Each day yields one insight in your own voice. Your journal becomes a record of how your mind moved."]
        ].map(([t, d]) => (
          <div key={t} className="border border-pine-edge p-5">
            <p className="font-instrument text-xs tracking-[0.25em] text-moss mb-2">{t}</p>
            <p className="text-mist leading-relaxed">{d}</p>
          </div>
        ))}
      </section>
      <p className="pb-10 font-instrument text-xs text-faded text-center">
        The leaderboard ranks understanding, not pages.
      </p>
    </main>
  );
}
