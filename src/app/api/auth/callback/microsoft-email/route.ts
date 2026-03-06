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
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=outlook_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=outlook_no_code`
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
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          redirect_uri: `${origin}/api/auth/callback/microsoft-email`,
          grant_type: "authorization_code",
          scope: "https://outlook.office365.com/Mail.Send offline_access openid email",
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("Microsoft token exchange failed: status", tokenResponse.status);
      return NextResponse.redirect(
        `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=outlook_token_failed`
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };

    if (!tokenData.refresh_token) {
      console.error("Microsoft did not return a refresh token");
      return NextResponse.redirect(
        `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=outlook_no_refresh_token`
      );
    }

    // Get the user's email from Microsoft Graph
    const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let emailAddress = supabaseUser.email;
    if (meResponse.ok) {
      const profile = (await meResponse.json()) as {
        mail?: string;
        userPrincipalName?: string;
      };
      emailAddress =
        profile.mail ?? profile.userPrincipalName ?? supabaseUser.email;
    }

    // Store pending connection data — user must confirm before it's saved
    const pendingData = JSON.stringify({
      provider: EmailProvider.outlook,
      emailAddress,
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
    console.error("Microsoft OAuth callback error:", err);
    return NextResponse.redirect(
      `${origin}${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=outlook_callback_failed`
    );
  }
}
