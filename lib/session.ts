import type { SessionOptions } from "iron-session";

/**
 * Pure session config + types. Intentionally free of `next/headers` imports so
 * this module is safe to import from middleware (edge runtime).
 */
export interface SessionData {
  isLoggedIn: boolean;
}

export const SESSION_COOKIE = "pump_session";

export const sessionOptions: SessionOptions = {
  // iron-session requires a password of at least 32 characters.
  password: process.env.SESSION_SECRET || "dev-insecure-secret-change-me-please-32",
  cookieName: SESSION_COOKIE,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};
