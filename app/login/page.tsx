"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: name })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Try another name.");
      return;
    }
    router.push("/expedition");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm border border-pine-edge bg-pine p-8 space-y-5">
        <p className="font-instrument tracking-[0.3em] text-sm">CARTOGRAPH</p>
        <div>
          <h1 className="text-2xl mb-1">Name your explorer</h1>
          <p className="text-mist text-sm">
            Profiles live on this machine. Returning? Enter the same name to pick up your map.
          </p>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. marcus_a"
          className="w-full bg-ink border border-pine-edge px-3 py-2.5 text-parchment placeholder-faded focus:border-ember"
        />
        {error && <p className="text-sm text-ember-bright">{error}</p>}
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="w-full font-instrument tracking-widest text-sm bg-ember text-ink py-3 hover:bg-ember-bright disabled:opacity-40"
        >
          {busy ? "\u2026" : "STEP ASHORE"}
        </button>
      </form>
    </main>
  );
}
