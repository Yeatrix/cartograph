import Link from "next/link";
import { currentUser } from "@/lib/auth";

export default function Header() {
  const user = currentUser();
  return (
    <header className="border-b border-pine-edge">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
        <Link href="/expedition" className="font-instrument tracking-[0.3em] text-sm text-parchment">
          CARTOGRAPH
        </Link>
        <nav className="flex gap-5 text-sm font-instrument text-mist">
          <Link href="/expedition" className="hover:text-parchment">The Map</Link>
          <Link href="/journal" className="hover:text-parchment">Journal</Link>
          <Link href="/leaderboard" className="hover:text-parchment">Leaderboard</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <span className="font-instrument text-xs text-ember-bright" title="Current streak">
              &#9650; {user.profile.streak}-day streak
            </span>
          )}
          {user && (
            <form action="/api/auth/logout" method="post">
              <button className="font-instrument text-xs text-faded hover:text-parchment" type="submit">
                sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
