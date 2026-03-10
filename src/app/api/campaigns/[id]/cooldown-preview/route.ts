import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { previewCooldown } from "@/lib/email/anti-spam";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, userId: session.id },
      select: { audienceListId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!campaign.audienceListId) {
      return NextResponse.json(
        { error: "Campaign has no audience list assigned" },
        { status: 400 }
      );
    }

    const preview = await previewCooldown(campaign.audienceListId, session.id);

    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("GET /api/campaigns/[id]/cooldown-preview", error);
    return NextResponse.json(
      { error: "Failed to check cooldown status" },
      { status: 500 }
    );
  }
}
