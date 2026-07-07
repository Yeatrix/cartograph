import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { currentUser } from "@/lib/auth";
import { allUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Leaderboard() {
  const me = currentUser();
  if (!me) redirect("/login");

  const rows = allUsers()
    .map((u) => ({
      name: u.profile.username,
      score: u.profile.totalDepthScore,
      zones: u.sessions.filter((s) => s.completedAt).length,
      streak: u.profile.streak
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div>
          <p className="font-instrument text-xs tracking-[0.3em] text-moss mb-2">THE DEPTH BOARD</p>
          <h1 className="text-3xl">Understanding, ranked</h1>
        </div>
        <table className="w-full font-instrument text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-widest text-mist border-b border-pine-edge">
              <th className="py-2 pr-4">RANK</th>
              <th className="py-2 pr-4">EXPLORER</th>
              <th className="py-2 pr-4 text-right">DEPTH</th>
              <th className="py-2 pr-4 text-right">ZONES</th>
              <th className="py-2 text-right">STREAK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.name}
                className={`border-b border-pine ${r.name === me.profile.username ? "text-ember-bright" : "text-parchment"}`}
              >
                <td className="py-2.5 pr-4">{String(i + 1).padStart(2, "0")}</td>
                <td className="py-2.5 pr-4">{r.name}</td>
                <td className="py-2.5 pr-4 text-right">{r.score}</td>
                <td className="py-2.5 pr-4 text-right">{r.zones}</td>
                <td className="py-2.5 text-right">&#9650;{r.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-mist text-sm leading-relaxed">
          Depth Score = accuracy &times; novelty of connection &times; terrain difficulty. One page of Marcus
          truly understood outranks fifty pages skimmed. Pages alone score nothing here.
        </p>
      </main>
    </>
  );
}
