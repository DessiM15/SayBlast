import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle user denying consent
  if (error) {
    return NextResponse.redirect(
      `${origin}/register?step=2&error=gmail_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/register?step=2&error=gmail_no_code`
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
      const errorData: unknown = await tokenResponse.json();
      console.error("Google token exchange failed:", errorData);
      return NextResponse.redirect(
        `${origin}/register?step=2&error=gmail_token_failed`
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
        `${origin}/register?step=2&error=gmail_no_refresh_token`
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
        `${origin}/register?step=2&error=gmail_userinfo_failed`
      );
    }

    const userinfo = (await userinfoResponse.json()) as { email: string };

    // Store tokens on the user record and complete onboarding
    await db.user.update({
      where: { email: supabaseUser.email },
      data: {
        emailProvider: "gmail",
        emailAddress: userinfo.email,
        emailAccessToken: tokenData.access_token,
        emailRefreshToken: tokenData.refresh_token,
        emailTokenExpiry: new Date(
          Date.now() + tokenData.expires_in * 1000
        ),
        emailVerified: true,
        onboardingComplete: true,
      },
    });

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${origin}/register?step=2&error=gmail_callback_failed`
    );
  }
}
