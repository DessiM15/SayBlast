import { NextResponse } from "next/server";

// TODO: Implement Outlook OAuth callback for email sending connection
// This route handles the OAuth callback after user authorizes Mail.Send scope
// It should:
// 1. Exchange the authorization code for access + refresh tokens
// 2. Store tokens on the user record (emailAccessToken, emailRefreshToken, emailTokenExpiry)
// 3. Set emailProvider = "outlook" and emailAddress = user's Outlook address
// 4. Set emailVerified = true
// 5. Redirect back to /register?step=2 or /settings

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // Placeholder: redirect with message that Microsoft OAuth is not yet configured
  return NextResponse.redirect(
    `${origin}/register?error=microsoft_oauth_not_configured`
  );
}
