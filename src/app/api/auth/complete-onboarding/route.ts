import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CompleteOnboardingSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CompleteOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const { userId } = parsed.data;

    // Verify user has connected an email account
    const user = await db.user.findUnique({
      where: { id: userId },
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
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/complete-onboarding]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
