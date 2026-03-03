import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

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
    const { success, remaining } = rateLimit(ip, 5, 15_000);

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
