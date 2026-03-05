import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit auth endpoints to prevent brute-force attacks
  if (pathname.startsWith("/api/auth")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const { success, remaining } = await rateLimit(`auth:${ip}`, 5, 15_000);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "15",
            "X-RateLimit-Remaining": String(remaining),
          },
        },
      );
    }
  }

  // Rate-limit voice processing (Anthropic API costs money)
  if (pathname.startsWith("/api/voice")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const { success, remaining } = await rateLimit(`voice:${ip}`, 10, 60_000);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": String(remaining),
          },
        },
      );
    }
  }

  // Rate-limit campaign sending
  if (pathname.startsWith("/api/campaigns") && pathname.endsWith("/send")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const { success, remaining } = await rateLimit(`send:${ip}`, 3, 60_000);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": String(remaining),
          },
        },
      );
    }
  }

  // Rate-limit CSV uploads
  if (pathname.startsWith("/api/contacts/upload")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    const { success, remaining } = await rateLimit(`upload:${ip}`, 5, 60_000);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": String(remaining),
          },
        },
      );
    }
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Check auth
  const { user, supabaseResponse } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check onboarding — we need to query the DB user
  // For now, we check via a cookie/header set during onboarding completion
  // The actual onboarding check happens via the app layout fetching session data
  // But for the middleware redirect, we use a lightweight approach:
  // After registration step 1, we set a cookie. After onboarding completion, we remove it.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
