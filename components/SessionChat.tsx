"use client";

// ─── SessionChat ─────────────────────────────────────────────────────────────
// Deliberately dumb client: it renders conversation state and posts answers.
// All grading, scoring, and progression happen server-side (see security doc).

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMessage, SessionSummary, Tier } from "@/lib/types";

interface Props {
  regionSlug: string;
  initialSession: { id: string; conversation: ChatMessage[]; passed: Record<Tier, boolean | null> } | null;
  alreadyDoneToday: boolean;
}

const TIER_LABEL: Record<Tier, string> = {
  recall: "I \u00b7 RECALL",
  reframe: "II \u00b7 REFRAME",
  apply: "III \u00b7 APPLY"
};

export default function SessionChat({ regionSlug, initialSession, alreadyDoneToday }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(initialSession?.id ?? null);
  const [conversation, setConversation] = useState<ChatMessage[]>(initialSession?.conversation ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ regionSlug })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something slipped");
      if (data.alreadyDoneToday) {
        setError("Today\u2019s terrain is charted. The map waits for tomorrow.");
        return;
      }
      setSessionId(data.session.id);
      setConversation(data.session.conversation);
      scrollDown();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The guide is catching their breath \u2014 try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!input.trim() || !sessionId || busy) return;
    const answer = input.trim();
    setInput("");
    setBusy(true);
    setError(null);
    // optimistic echo
    setConversation((c) => [...c, { role: "explorer", tier: "recall", text: answer }]);
    scrollDown();
    try {
      const res = await fetch("/api/session/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, answer })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something slipped");
      setConversation(data.conversation);
      if (data.done && data.result) {
        setResult(data.result);
        router.refresh(); // re-render map, streak, journal counts from the server
      }
      scrollDown();
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "Something slipped"
          ? e.message
          : "The guide is catching their breath \u2014 your progress is saved. Try again in a minute."
      );
    } finally {
      setBusy(false);
    }
  }

  // ── Completed state ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="border border-pine-edge bg-pine p-6 space-y-4">
        <p className="font-instrument text-xs tracking-[0.25em] text-moss">ZONE CHARTED \u00b7 {result.zoneRevealed.toUpperCase()}</p>
        <div className="flex items-baseline gap-6">
          <div>
            <p className="font-instrument text-4xl text-ember-bright">{result.depthScore}</p>
            <p className="font-instrument text-[11px] tracking-widest text-mist">DEPTH SCORE</p>
          </div>
          <div>
            <p className="font-instrument text-4xl text-parchment">{result.passedCount}/3</p>
            <p className="font-instrument text-[11px] tracking-widest text-mist">TIERS PASSED</p>
          </div>
          <div>
            <p className="font-instrument text-4xl text-parchment">&#9650;{result.streak}</p>
            <p className="font-instrument text-[11px] tracking-widest text-mist">DAY STREAK</p>
          </div>
        </div>
        <div className="border-l-2 border-ember pl-4">
          <p className="font-instrument text-[11px] tracking-widest text-mist mb-1">ARTIFACT COLLECTED</p>
          <p className="text-lg italic">&ldquo;{result.artifact.content}&rdquo;</p>
          <p className="font-instrument text-xs text-faded mt-1">{result.artifact.themes.join(" \u00b7 ")}</p>
        </div>
        {result.regionCompleted && (
          <p className="text-moss">The whole region is charted. Your journal holds the expedition\u2019s artifacts.</p>
        )}
        <p className="text-mist text-sm">The fog has lifted on the map above. Same place tomorrow.</p>
      </div>
    );
  }

  // ── Pre-session state ──────────────────────────────────────────────────────
  if (!sessionId) {
    return (
      <div className="space-y-3">
        {alreadyDoneToday ? (
          <p className="text-mist">Today\u2019s terrain is charted. The map waits for tomorrow.</p>
        ) : (
          <button
            onClick={begin}
            disabled={busy}
            className="font-instrument tracking-widest text-sm bg-ember text-ink px-6 py-3 hover:bg-ember-bright disabled:opacity-50"
          >
            {busy ? "THE GUIDE APPROACHES\u2026" : "I\u2019VE READ IT \u2014 BEGIN THE QUESTIONS"}
          </button>
        )}
        {error && <p className="text-sm text-ember-bright">{error}</p>}
      </div>
    );
  }

  // ── Live dialogue ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {conversation.map((m, i) => (
          <div key={i} className={m.role === "guide" ? "" : "text-right"}>
            {m.role === "guide" ? (
              <div className="inline-block max-w-[92%] text-left">
                <p className="font-instrument text-[10px] tracking-widest text-moss mb-0.5">
                  GUIDE \u00b7 {TIER_LABEL[m.tier]}
                </p>
                <p className="bg-pine border border-pine-edge px-4 py-2.5">{m.text}</p>
              </div>
            ) : (
              <div className="inline-block max-w-[92%] text-left">
                <p className="bg-parchment/10 border border-pine-edge px-4 py-2.5 text-parchment">{m.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-ember-bright">{error}</p>}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Answer in your own words\u2026"
          className="flex-1 bg-ink border border-pine-edge px-3 py-2 text-parchment placeholder-faded resize-none focus:border-ember"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="font-instrument tracking-widest text-xs bg-ember text-ink px-5 hover:bg-ember-bright disabled:opacity-40"
        >
          {busy ? "\u2026" : "SEND"}
        </button>
      </div>
      <p className="font-instrument text-[10px] text-faded">Enter to send \u00b7 Shift+Enter for a new line</p>
    </div>
  );
}
