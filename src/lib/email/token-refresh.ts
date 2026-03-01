import type { User } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Check if the user's OAuth token is expired and refresh it if needed.
 * Returns the user with fresh tokens.
 */
export async function refreshTokenIfNeeded(user: User): Promise<User> {
  if (!user.emailTokenExpiry) return user;

  const now = new Date();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
  const isExpired =
    user.emailTokenExpiry.getTime() - expiryBuffer < now.getTime();

  if (!isExpired) return user;

  switch (user.emailProvider) {
    case "gmail":
      return refreshGmailToken(user);
    case "outlook":
      return refreshOutlookToken(user);
    default:
      return user;
  }
}

async function refreshGmailToken(user: User): Promise<User> {
  if (!user.emailRefreshToken) {
    throw new Error("No refresh token available for Gmail");
  }

  // TODO: Implement when Google OAuth credentials are configured
  // const response = await fetch("https://oauth2.googleapis.com/token", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //   body: new URLSearchParams({
  //     client_id: process.env.GOOGLE_CLIENT_ID!,
  //     client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  //     refresh_token: user.emailRefreshToken,
  //     grant_type: "refresh_token",
  //   }),
  // });
  //
  // const data = await response.json();
  // const updatedUser = await db.user.update({
  //   where: { id: user.id },
  //   data: {
  //     emailAccessToken: data.access_token,
  //     emailTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  //   },
  // });
  // return updatedUser;

  console.warn("Gmail token refresh not yet implemented");
  return user;
}

async function refreshOutlookToken(user: User): Promise<User> {
  if (!user.emailRefreshToken) {
    throw new Error("No refresh token available for Outlook");
  }

  // TODO: Implement when Microsoft OAuth credentials are configured
  // const response = await fetch(
  //   "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  //   {
  //     method: "POST",
  //     headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //     body: new URLSearchParams({
  //       client_id: process.env.MICROSOFT_CLIENT_ID!,
  //       client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
  //       refresh_token: user.emailRefreshToken,
  //       grant_type: "refresh_token",
  //       scope: "https://outlook.office365.com/Mail.Send offline_access",
  //     }),
  //   }
  // );
  //
  // const data = await response.json();
  // const updatedUser = await db.user.update({
  //   where: { id: user.id },
  //   data: {
  //     emailAccessToken: data.access_token,
  //     emailRefreshToken: data.refresh_token ?? user.emailRefreshToken,
  //     emailTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  //   },
  // });
  // return updatedUser;

  console.warn("Outlook token refresh not yet implemented");
  return user;
}
