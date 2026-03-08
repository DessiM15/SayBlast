import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const session = await requireSession();

    // Verify user has connected an email account
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { emailProvider: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.emailProvider || !user.emailVerified) {
      return NextResponse.json(
        { error: "You must connect an email account first" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: session.id },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/auth/complete-onboarding", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
