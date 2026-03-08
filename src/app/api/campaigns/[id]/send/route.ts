import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sendCampaign } from "@/lib/email/campaign-sender";
import { CampaignStatus } from "@/generated/prisma/enums";
import { logger } from "@/lib/logger";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Load campaign and verify ownership
    const campaign = await db.campaign.findFirst({
      where: { id, userId: session.id },
      include: {
        audienceList: {
          select: { id: true, name: true, _count: { select: { contacts: true } } },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Validate campaign is ready to send
    if (campaign.status === CampaignStatus.sending) {
      return NextResponse.json(
        { error: "Campaign is already being sent" },
        { status: 409 }
      );
    }

    if (campaign.status === CampaignStatus.sent) {
      return NextResponse.json(
        { error: "Campaign has already been sent" },
        { status: 409 }
      );
    }

    if (!campaign.subjectLine) {
      return NextResponse.json(
        { error: "Campaign is missing a subject line" },
        { status: 400 }
      );
    }

    if (!campaign.htmlBody) {
      return NextResponse.json(
        { error: "Campaign is missing email content" },
        { status: 400 }
      );
    }

    if (!campaign.audienceListId || !campaign.audienceList) {
      return NextResponse.json(
        { error: "Campaign has no audience assigned" },
        { status: 400 }
      );
    }

    if (campaign.audienceList._count.contacts === 0) {
      return NextResponse.json(
        { error: "Audience list has no contacts" },
        { status: 400 }
      );
    }

    // Set campaign to "sending" status
    await db.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.sending,
        scheduledAt: new Date(),
      },
    });

    // Send the campaign
    const result = await sendCampaign(id);

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/campaigns/send", error);
    return NextResponse.json(
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
