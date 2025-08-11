import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = new URL(request.url);
  const sessionCookie = getSessionCookie(request);

  // Protect /admin
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check active status via API (edge-compatible)
    try {
      const res = await fetch(`${origin}/api/auth/active`, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        // Important: don't cache this check
        cache: "no-store",
      });
      const data = (await res.json()) as { active: boolean };
      if (!data.active) {
        // Optionally: append a flag to show a message on login page
        return NextResponse.redirect(new URL("/login?inactive=1", request.url));
      }
    } catch {
      // If the check fails, fail closed (deny) or open (allow). Safer = closed:
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Prevent active users from seeing /login
  if (pathname === "/login" && sessionCookie) {
    // Only redirect if user is active; inactive users should stay on /login
    try {
      const res = await fetch(`${origin}/api/auth/active`, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
      });
      const data = (await res.json()) as { active: boolean };
      if (data.active) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // ignore and let them continue to /login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
