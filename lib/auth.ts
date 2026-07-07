// ─── Cookie session (prototype auth) ────────────────────────────────────────
// Production swaps this for Supabase magic links (see security doc §1).
import { cookies } from "next/headers";
import { getUser } from "./db";
import { UserData } from "./types";

export const AUTH_COOKIE = "cartograph_user";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const BLOCKLIST = ["admin", "moderator", "cartograph"]; // extend before launch

export function validUsername(name: string): string | null {
  if (!USERNAME_RE.test(name)) {
    return "3\u201320 characters: letters, numbers, underscores.";
  }
  if (BLOCKLIST.includes(name.toLowerCase())) {
    return "That name is reserved \u2014 pick another.";
  }
  return null;
}

export function currentUser(): UserData | null {
  const name = cookies().get(AUTH_COOKIE)?.value;
  if (!name) return null;
  return getUser(name);
}
