// ─── Local JSON store ────────────────────────────────────────────────────────
// Prototype stand-in for Supabase Postgres. Table shapes mirror the
// architecture doc 1:1 so migration later is a mapping exercise, not a rewrite.
import fs from "fs";
import path from "path";
import { Store, UserData, Profile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function emptyStore(): Store {
  return { users: {} };
}

function load(): Store {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return emptyStore();
  }
}

function save(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH); // atomic-ish write: never leaves a half-file
}

export function todayStr(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, machine-local
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

export function getUser(username: string): UserData | null {
  const store = load();
  return store.users[username.toLowerCase()] ?? null;
}

export function createUser(username: string): UserData {
  const store = load();
  const key = username.toLowerCase();
  if (!store.users[key]) {
    const profile: Profile = {
      username,
      streak: 0,
      lastSessionDate: null,
      totalDepthScore: 0,
      createdAt: new Date().toISOString()
    };
    store.users[key] = { profile, expedition: null, sessions: [], artifacts: [] };
    save(store);
  }
  return store.users[key];
}

/** Load → mutate → persist. All writes go through here (the "service role"). */
export function updateUser(username: string, mutate: (u: UserData) => void): UserData {
  const store = load();
  const key = username.toLowerCase();
  const user = store.users[key];
  if (!user) throw new Error("Unknown user");
  mutate(user);
  save(store);
  return user;
}

export function allUsers(): UserData[] {
  return Object.values(load().users);
}
