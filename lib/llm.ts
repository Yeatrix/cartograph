// ─── LLM engine ──────────────────────────────────────────────────────────────
// Two modes, one interface:
//   MOCK  (no ANTHROPIC_API_KEY): deterministic heuristics — fully playable offline.
//   REAL  (key present): Claude generates questions, grades answers, distills artifacts.
// Every real call: 15s timeout, one retry on bad JSON, then FAIL OPEN to the mock
// (never block a user's session because our parser or the API had a bad minute).
import { Excerpt, GradeResult, Tier } from "./types";
import { GUIDE_SYSTEM, questionPrompt, gradePrompt, artifactPrompt } from "./prompts";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";

function hasKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ─── Anthropic plumbing ──────────────────────────────────────────────────────

async function callClaude(prompt: string, temperature: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature,
        system: GUIDE_SYSTEM,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return (data?.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
  } finally {
    clearTimeout(timer);
  }
}

function extractJson<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]) as T;
}

/** Call → parse; retry once; on second failure return null so callers fail open. */
async function claudeJson<T>(prompt: string, temperature: number): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return extractJson<T>(await callClaude(prompt, temperature));
    } catch (err) {
      console.error(`[llm] attempt ${attempt + 1} failed:`, err);
    }
  }
  return null;
}

// ─── Mock mode: honest heuristics, clearly imperfect, great for building ────

const STOPWORDS = new Set(
  "the and for that this with thou thy thee then them they from what which have hath been will shall not are but his her him our your into when where how why can may more most than upon only all any one two out now even also like just very much some been does dost art wilt".split(" ")
);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s']/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  a.forEach((w) => {
    if (b.has(w)) n++;
  });
  return n;
}

/** True if any run of 6 consecutive words from the answer appears verbatim in the excerpt. */
function copiesVerbatim(answer: string, excerpt: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean(answer).split(" ");
  const hay = clean(excerpt);
  for (let i = 0; i + 6 <= words.length; i++) {
    if (hay.includes(words.slice(i, i + 6).join(" "))) return true;
  }
  return false;
}

const MOCK_QUESTIONS: Record<Tier, (e: Excerpt) => string> = {
  recall: (e) =>
    `Before we climb on \u2014 what stayed with you from \u201c${e.title}\u201d? Sketch the central idea as you remember it; rough edges are fine.`,
  reframe: (e) =>
    `Now say it as your own: if a friend who\u2019s never read this asked what ${e.zoneName} was about, how would you put it \u2014 one or two sentences, none of the author\u2019s phrases?`,
  apply: () =>
    `Last one, and it\u2019s about you: where does this idea touch your actual week? Name one concrete situation \u2014 a decision, a habit, a person \u2014 where it would change what you do.`
};

function mockGrade(tier: Tier, excerpt: Excerpt, answer: string): GradeResult {
  const ansWords = significantWords(answer);
  const excerptWords = significantWords(excerpt.content);
  const overlap = overlapCount(ansWords, excerptWords);

  if (tier === "recall") {
    const passed = answer.trim().length >= 25 && (overlap >= 2 || ansWords.size >= 8);
    return passed
      ? { passed, feedback: "That\u2019s the shape of it \u2014 you were clearly on the page. Let\u2019s go a step further." }
      : { passed, feedback: "I don\u2019t think we\u2019re on the same page yet \u2014 glance back at the passage\u2019s opening claim and tell me what it\u2019s driving at." };
  }

  if (tier === "reframe") {
    const verbatim = copiesVerbatim(answer, excerpt.content);
    const passed = answer.trim().length >= 50 && !verbatim;
    return passed
      ? { passed, feedback: "Good \u2014 that\u2019s yours now, not just his. A borrowed idea only becomes equipment once it\u2019s restated." }
      : {
          passed,
          feedback: verbatim
            ? "You\u2019re still carrying the author\u2019s exact words \u2014 set them down and rebuild the idea from your own vocabulary."
            : "Give it a little more room \u2014 a sentence or two, as if your friend just asked you across a table."
        };
  }

  // apply
  const personal = /\b(i|i'm|i\u2019m|my|me|mine|myself|we|our)\b/i.test(answer);
  const passed = answer.trim().length >= 60 && personal;
  const novelty = Math.max(
    0.2,
    Math.min(0.95, ansWords.size / 40 - overlap / Math.max(ansWords.size, 1) * 0.5)
  );
  return passed
    ? { passed, feedback: "That\u2019s a real place on your map, not the author\u2019s \u2014 that connection is what we came for.", novelty }
    : { passed, feedback: "Bring it closer to home \u2014 one specific moment from your own week, even a small one.", novelty: 0.3 };
}

function mockArtifact(excerpt: Excerpt, applyAnswer: string): { content: string; themes: string[] } {
  const firstSentence = applyAnswer.split(/(?<=[.!?])\s/)[0] ?? applyAnswer;
  const trimmed = firstSentence.length > 150 ? firstSentence.slice(0, 147).trimEnd() + "\u2026" : firstSentence;
  return { content: trimmed, themes: excerpt.themes.slice(0, 2) };
}

// ─── Public interface ────────────────────────────────────────────────────────

export async function generateQuestion(tier: Tier, excerpt: Excerpt, priorAnswers: string[]): Promise<string> {
  if (hasKey()) {
    const out = await claudeJson<{ question: string }>(questionPrompt(tier, excerpt, priorAnswers), 0.7);
    if (out?.question) return out.question;
  }
  return MOCK_QUESTIONS[tier](excerpt);
}

export async function gradeAnswer(tier: Tier, excerpt: Excerpt, question: string, answer: string): Promise<GradeResult> {
  if (hasKey()) {
    const out = await claudeJson<{ passed: boolean; feedback: string; novelty?: number }>(
      gradePrompt(tier, excerpt, question, answer),
      0.2 // grading wants consistency; questioning wants warmth
    );
    if (out && typeof out.passed === "boolean" && out.feedback) {
      return {
        passed: out.passed,
        feedback: out.feedback,
        novelty: typeof out.novelty === "number" ? Math.max(0, Math.min(1, out.novelty)) : undefined
      };
    }
    // Fail OPEN: our failure must never break the explorer's day.
    return { passed: true, feedback: "I\u2019ll take that \u2014 the trail\u2019s more important than my questions today.", novelty: 0.5 };
  }
  return mockGrade(tier, excerpt, answer);
}

export async function extractArtifact(excerpt: Excerpt, applyAnswer: string): Promise<{ content: string; themes: string[] }> {
  if (hasKey()) {
    const out = await claudeJson<{ artifact: string; themes: string[] }>(artifactPrompt(excerpt, applyAnswer), 0.5);
    if (out?.artifact) return { content: out.artifact, themes: out.themes?.slice(0, 3) ?? excerpt.themes.slice(0, 2) };
  }
  return mockArtifact(excerpt, applyAnswer);
}

export function llmMode(): "claude" | "mock" {
  return hasKey() ? "claude" : "mock";
}
