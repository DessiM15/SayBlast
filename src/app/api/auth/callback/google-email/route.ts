import { NextResponse } from "next/server";

// TODO: Implement Gmail OAuth callback for email sending connection
// This route handles the OAuth callback after user authorizes gmail.send scope
// It should:
// 1. Exchange the authorization code for access + refresh tokens
// 2. Store tokens on the user record (emailAccessToken, emailRefreshToken, emailTokenExpiry)
// 3. Set emailProvider = "gmail" and emailAddress = user's Gmail address
// 4. Set emailVerified = true
// 5. Redirect back to /register?step=2 or /settings

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // Placeholder: redirect with message that Google OAuth is not yet configured
  return NextResponse.redirect(
    `${origin}/register?error=google_oauth_not_configured`
  );
}
