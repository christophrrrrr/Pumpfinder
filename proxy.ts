import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

/**
 * Gate the whole app behind the single-password login. (Next.js 16 "proxy"
 * convention, formerly "middleware".)
 * - Unauthenticated page requests redirect to /login.
 * - Unauthenticated API requests get 401 (except the auth endpoint).
 * - Authenticated users hitting /login bounce to /dashboard.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const loggedIn = Boolean(session.isLoggedIn);

  const isLogin = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");

  if (loggedIn) {
    if (isLogin) return NextResponse.redirect(new URL("/dashboard", req.url));
    return res;
  }

  if (isLogin || isAuthApi) return res;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
