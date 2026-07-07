import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser } from "@/lib/db";
import { AUTH_COOKIE, validUsername } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const problem = validUsername(username);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  createUser(username);
  cookies().set(AUTH_COOKIE, username.toLowerCase(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return NextResponse.json({ ok: true });
}
