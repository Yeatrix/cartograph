// ─── Cartograph shared types ────────────────────────────────────────────────

export type Tier = "recall" | "reframe" | "apply";
export const TIERS: Tier[] = ["recall", "reframe", "apply"];

export interface Excerpt {
  position: number;        // 1-based order within the region
  title: string;           // e.g. "Book II · On Waking"
  source: string;          // attribution line
  content: string;         // the day's terrain
  mapZoneId: string;       // matches a zone id in the region map
  zoneName: string;        // display name on the map
  themes: string[];        // candidate themes for artifact tagging
}

export interface Region {
  slug: string;
  title: string;
  author: string;
  difficulty: "shallows" | "foothills" | "highlands" | "peaks";
  difficultyMultiplier: number;
  description: string;
  excerpts: Excerpt[];
}

export interface Profile {
  username: string;
  streak: number;
  lastSessionDate: string | null; // YYYY-MM-DD (machine-local date)
  totalDepthScore: number;
  createdAt: string;
}

export interface Expedition {
  regionSlug: string;
  status: "active" | "completed";
  currentPosition: number; // which excerpt is "today's terrain"
  startedAt: string;
}

export interface ChatMessage {
  role: "guide" | "explorer";
  tier: Tier;
  text: string;
}

export interface Session {
  id: string;
  date: string;             // YYYY-MM-DD
  excerptPosition: number;
  conversation: ChatMessage[];
  passed: Record<Tier, boolean | null>;
  attempts: Record<Tier, number>;
  applyNovelty: number | null; // 0..1
  depthScore: number;
  startedAt: string;
  completedAt: string | null;
}

export interface Artifact {
  id: string;
  sessionId: string;
  excerptTitle: string;
  content: string;
  themes: string[];
  createdAt: string;
}

export interface UserData {
  profile: Profile;
  expedition: Expedition | null;
  sessions: Session[];
  artifacts: Artifact[];
}

export interface Store {
  users: Record<string, UserData>;
}

// ─── API payloads ───────────────────────────────────────────────────────────

export interface GradeResult {
  passed: boolean;
  feedback: string;   // one warm sentence from the guide
  novelty?: number;   // only for the apply tier
}

export interface SessionSummary {
  depthScore: number;
  passedCount: number;
  artifact: Artifact;
  streak: number;
  zoneRevealed: string;
  regionCompleted: boolean;
}
