import { createTransport, type Transporter } from "nodemailer";
import type { User } from "@/generated/prisma/client";
import { EmailProvider } from "@/generated/prisma/enums";
import { decrypt } from "@/lib/encryption";
import { refreshTokenIfNeeded } from "@/lib/email/token-refresh";
import { env } from "@/lib/env";

export async function createEmailTransport(user: User): Promise<Transporter> {
  switch (user.emailProvider) {
    case EmailProvider.gmail:
      return createGmailTransport(user);
    case EmailProvider.outlook:
      return createOutlookTransport(user);
    case EmailProvider.smtp:
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
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
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
    requireTLS: true,
    tls: { rejectUnauthorized: true },
    auth: {
      type: "OAuth2",
      user: freshUser.emailAddress!,
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
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
    ...(!user.smtpSecure && {
      requireTLS: true,
      tls: { rejectUnauthorized: true },
    }),
    auth: {
      user: user.smtpUser,
      pass: decryptedPassword,
    },
  });
}
