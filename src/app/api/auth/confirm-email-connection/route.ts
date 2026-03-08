import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { EmailProvider } from "@/generated/prisma/enums";
import { decrypt, encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const MAX_PENDING_AGE_MS = 10 * 60 * 1000; // 10 minutes

interface PendingEmailData {
  provider: EmailProvider;
  emailAddress: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  returnTo: string;
  createdAt: number;
}

export async function POST() {
  try {
    const session = await requireSession();

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { pendingEmailData: true },
    });

    if (!user?.pendingEmailData) {
      return NextResponse.json(
        { error: "No pending email connection" },
        { status: 400 }
      );
    }

    const raw = decrypt(user.pendingEmailData);
    const pending = JSON.parse(raw) as PendingEmailData;

    // Reject expired pending connections
    if (Date.now() - pending.createdAt > MAX_PENDING_AGE_MS) {
      await db.user.update({
        where: { id: session.id },
        data: { pendingEmailData: null },
      });
      return NextResponse.json(
        { error: "Connection request expired. Please try again." },
        { status: 400 }
      );
    }

    // Save the confirmed connection
    await db.user.update({
      where: { id: session.id },
      data: {
        emailProvider: pending.provider,
        emailAddress: pending.emailAddress,
        emailAccessToken: encrypt(pending.accessToken),
        emailRefreshToken: encrypt(pending.refreshToken),
        emailTokenExpiry: new Date(
          Date.now() + pending.expiresIn * 1000
        ),
        emailVerified: true,
        onboardingComplete: true,
        pendingEmailData: null,
        smtpHost: null,
        smtpPort: null,
        smtpUser: null,
        smtpPass: null,
        smtpSecure: true,
      },
    });

    return NextResponse.json({
      success: true,
      returnTo: pending.returnTo,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/auth/confirm-email-connection", error);
    return NextResponse.json(
      { error: "Failed to confirm email connection" },
      { status: 500 }
    );
  }
}
