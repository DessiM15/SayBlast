import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { EmailProvider } from "@/generated/prisma/enums";
import { encrypt } from "@/lib/encryption";

function parseReturnTo(stateParam: string | null): string {
  if (!stateParam) return "/dashboard";
  try {
    const parsed = JSON.parse(stateParam) as { returnTo?: string };
    if (
      typeof parsed.returnTo === "string" &&
      parsed.returnTo.startsWith("/") &&
      !parsed.returnTo.startsWith("//")
    ) {
      return parsed.returnTo;
    }
  } catch {
    // Invalid JSON — ignore
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state");
  const returnTo = parseReturnTo(stateParam);

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
      console.error("Google token exchange failed: status", tokenResponse.status);
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
      console.error("Google did not return a refresh token");
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
      console.error("Failed to fetch Google userinfo");
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
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=gmail_callback_failed`
    );
  }
}
