import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { EmailProvider } from "@/generated/prisma/enums";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

interface OAuthState {
  returnTo: string;
  nonce?: string;
}

function parseOAuthState(stateParam: string | null): OAuthState {
  if (!stateParam) return { returnTo: "/dashboard" };
  try {
    const parsed = JSON.parse(stateParam) as { returnTo?: string; nonce?: string };
    const returnTo =
      typeof parsed.returnTo === "string" &&
      parsed.returnTo.startsWith("/") &&
      !parsed.returnTo.startsWith("//")
        ? parsed.returnTo
        : "/dashboard";
    return { returnTo, nonce: typeof parsed.nonce === "string" ? parsed.nonce : undefined };
  } catch {
    return { returnTo: "/dashboard" };
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state");
  const { returnTo, nonce: stateNonce } = parseOAuthState(stateParam);

  const errorRedirect =
    returnTo === "/settings" ? "/settings" : "/register?step=2";

  // Handle user denying consent
  if (error) {
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_no_code`
    );
  }

  // Verify OAuth CSRF nonce
  const cookieStore = await cookies();
  const cookieNonce = cookieStore.get("oauth_nonce")?.value;
  cookieStore.delete("oauth_nonce");

  if (!cookieNonce || !stateNonce || cookieNonce !== stateNonce) {
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=csrf_failed`
    );
  }

  // Verify the user is logged in
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser?.email) {
    return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
  }

  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/callback/google-email`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      logger.error("GET /api/auth/callback/google-email", `Token exchange failed: status ${tokenResponse.status}`);
      return NextResponse.redirect(
        `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_token_failed`
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };

    if (!tokenData.refresh_token) {
      logger.error("GET /api/auth/callback/google-email", "Google did not return a refresh token");
      return NextResponse.redirect(
        `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_no_refresh_token`
      );
    }

    // Get the user's Gmail address from the userinfo endpoint
    const userinfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userinfoResponse.ok) {
      logger.error("GET /api/auth/callback/google-email", "Failed to fetch Google userinfo");
      return NextResponse.redirect(
        `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_userinfo_failed`
      );
    }

    const userinfo = (await userinfoResponse.json()) as { email: string };

    // Store pending connection data — user must confirm before it's saved
    const pendingData = JSON.stringify({
      provider: EmailProvider.gmail,
      emailAddress: userinfo.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      returnTo,
      createdAt: Date.now(),
    });

    await db.user.update({
      where: { email: supabaseUser.email },
      data: { pendingEmailData: encrypt(pendingData) },
    });

    return NextResponse.redirect(
      `${origin}/confirm-email-connection`
    );
  } catch (err) {
    logger.error("GET /api/auth/callback/google-email", err);
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_callback_failed`
    );
  }
}
