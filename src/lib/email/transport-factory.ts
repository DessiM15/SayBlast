import { createTransport, type Transporter } from "nodemailer";
import { EmailProvider } from "@/generated/prisma/enums";
import { decrypt } from "@/lib/encryption";
import { refreshTokenIfNeeded } from "@/lib/email/token-refresh";
import { env } from "@/lib/env";

export interface EmailTransportUser {
  id: string;
  email: string;
  emailProvider: string | null;
  emailAddress: string | null;
  emailAccessToken: string | null;
  emailRefreshToken: string | null;
  emailTokenExpiry: Date | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpSecure: boolean;
}

export async function createEmailTransport(user: EmailTransportUser): Promise<Transporter> {
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

async function createGmailTransport(user: EmailTransportUser): Promise<Transporter> {
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

async function createOutlookTransport(user: EmailTransportUser): Promise<Transporter> {
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

function createSmtpTransport(user: EmailTransportUser): Transporter {
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
