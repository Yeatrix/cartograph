import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function Journal() {
  const user = currentUser();
  if (!user) redirect("/login");
  const artifacts = [...user.artifacts].reverse();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div>
          <p className="font-instrument text-xs tracking-[0.3em] text-moss mb-2">EXPLORER&apos;S JOURNAL</p>
          <h1 className="text-3xl">
            {artifacts.length} artifact{artifacts.length === 1 ? "" : "s"} collected
          </h1>
        </div>
        {artifacts.length === 0 ? (
          <p className="text-mist">
            Empty pages, for now. Chart your first zone and the day&apos;s insight will be pressed here &mdash; in your words, not the author&apos;s.
          </p>
        ) : (
          <div className="space-y-4">
            {artifacts.map((a) => (
              <div key={a.id} className="border border-pine-edge bg-pine p-5 border-l-2 border-l-ember">
                <p className="text-lg italic mb-2">&ldquo;{a.content}&rdquo;</p>
                <p className="font-instrument text-xs text-mist">
                  {a.excerptTitle} \u00b7 {a.themes.join(" \u00b7 ")} \u00b7 {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
        <p className="font-instrument text-[11px] text-faded">
          After 30 days these become your Mirror &mdash; the diff of how your thinking moved. (v1.x)
        </p>
      </main>
    </>
  );
}
