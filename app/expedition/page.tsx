import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { currentUser } from "@/lib/auth";
import { REGIONS } from "@/content/regions";

export const dynamic = "force-dynamic";

export default function RegionPicker() {
  const user = currentUser();
  if (!user) redirect("/login");

  const region = REGIONS[0];
  const exp = user.expedition;
  const charted = user.sessions.filter((s) => s.completedAt).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div>
          <p className="font-instrument text-xs tracking-[0.3em] text-moss mb-2">CHOOSE YOUR TERRAIN</p>
          <h1 className="text-3xl">Where does the expedition go, {user.profile.username}?</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Link href={`/expedition/${region.slug}`} className="border border-pine-edge bg-pine p-6 hover:border-ember block">
            <p className="font-instrument text-[11px] tracking-widest text-ember-bright mb-2">
              {region.difficulty.toUpperCase()} \u00b7 \u00d7{region.difficultyMultiplier} DEPTH
            </p>
            <h2 className="text-2xl mb-1">{region.title}</h2>
            <p className="font-instrument text-xs text-mist mb-3">{region.author}</p>
            <p className="text-mist leading-relaxed mb-4">{region.description}</p>
            <p className="font-instrument text-xs tracking-widest text-parchment">
              {exp
                ? exp.status === "completed"
                  ? "REGION CHARTED \u2014 REVISIT THE MAP \u2192"
                  : `CONTINUE \u00b7 ${Math.min(charted, region.excerpts.length)}/${region.excerpts.length} ZONES \u2192`
                : "BEGIN EXPEDITION \u2192"}
            </p>
          </Link>
          <div className="border border-pine-edge p-6 opacity-50">
            <p className="font-instrument text-[11px] tracking-widest text-mist mb-2">SHALLOWS \u00b7 \u00d71.0 DEPTH</p>
            <h2 className="text-2xl mb-1">The Essays</h2>
            <p className="font-instrument text-xs text-mist mb-3">A modern collection</p>
            <p className="text-mist leading-relaxed mb-4">
              Charting in progress. Add your own region in <span className="font-instrument text-xs">content/regions.ts</span> &mdash; curation is the product.
            </p>
            <p className="font-instrument text-xs tracking-widest text-faded">LOCKED</p>
          </div>
        </div>
      </main>
    </>
  );
}
