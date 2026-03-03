import { createTransport, type Transporter } from "nodemailer";
import type { User } from "@/generated/prisma/client";
import { decrypt } from "@/lib/encryption";
import { refreshTokenIfNeeded } from "@/lib/email/token-refresh";

export async function createEmailTransport(user: User): Promise<Transporter> {
  switch (user.emailProvider) {
    case "gmail":
      return createGmailTransport(user);
    case "outlook":
      return createOutlookTransport(user);
    case "smtp":
      return createSmtpTransport(user);
    default:
      throw new Error(`Unknown email provider: ${user.emailProvider}`);
  }
}

async function createGmailTransport(user: User): Promise<Transporter> {
  // Refresh token if expired
  const freshUser = await refreshTokenIfNeeded(user);

  return createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: freshUser.emailAddress!,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: decrypt(freshUser.emailRefreshToken!),
      accessToken: decrypt(freshUser.emailAccessToken!),
    },
  });
}

async function createOutlookTransport(user: User): Promise<Transporter> {
  // Refresh token if expired
  const freshUser = await refreshTokenIfNeeded(user);

  return createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      type: "OAuth2",
      user: freshUser.emailAddress!,
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      refreshToken: decrypt(freshUser.emailRefreshToken!),
      accessToken: decrypt(freshUser.emailAccessToken!),
    },
  });
}

function createSmtpTransport(user: User): Transporter {
  if (!user.smtpHost || !user.smtpPort || !user.smtpUser || !user.smtpPass) {
    throw new Error("Incomplete SMTP configuration");
  }

  const decryptedPassword = decrypt(user.smtpPass);

  return createTransport({
    host: user.smtpHost,
    port: user.smtpPort,
    secure: user.smtpSecure,
    auth: {
      user: user.smtpUser,
      pass: decryptedPassword,
    },
  });
}
