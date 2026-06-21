import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

/**
 * Server-side session helpers for route handlers and server components.
 * (Middleware uses iron-session directly with the request — see middleware.ts.)
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session.isLoggedIn);
}
