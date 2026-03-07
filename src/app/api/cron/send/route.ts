import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCampaign } from "@/lib/email/campaign-sender";
import { CampaignStatus } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  try {
    // Validate CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const headerValue = authHeader ?? "";
    const expectedValue = `Bearer ${expectedToken}`;
    const a = Buffer.from(headerValue);
    const b = Buffer.from(expectedValue);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // 1. Resume an in-progress campaign first (already in "sending" status)
    let campaignId: string | null = null;

    const inProgress = await db.campaign.findFirst({
      where: { status: CampaignStatus.sending },
      select: { id: true },
    });

    if (inProgress) {
      campaignId = inProgress.id;
    } else {
      // 2. No in-progress campaigns — claim a scheduled one atomically
      const due = await db.campaign.findFirst({
        where: {
          status: CampaignStatus.scheduled,
          scheduledAt: { lte: now },
        },
        orderBy: { scheduledAt: "asc" },
        select: { id: true },
      });

      if (due) {
        // Atomic claim: only proceed if status is still "scheduled"
        const claimed = await db.campaign.updateMany({
          where: {
            id: due.id,
            status: CampaignStatus.scheduled,
          },
          data: { status: CampaignStatus.sending },
        });

        if (claimed.count > 0) {
          campaignId = due.id;
        }
      }
    }

    if (!campaignId) {
      return NextResponse.json({
        message: "No campaigns due for sending",
        processed: 0,
      });
    }

    const result = await sendCampaign(campaignId);

    // Log detailed errors server-side only — never expose in response
    if (result.errors.length > 0) {
      console.error(`[cron] Campaign ${campaignId} errors:`, result.errors);
    }

    return NextResponse.json({
      message: result.remaining > 0
        ? `Batch sent — ${result.remaining} contacts remaining`
        : "Campaign complete",
      campaignId: result.campaignId,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      remaining: result.remaining,
    });
  } catch (error) {
    console.error("Cron send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
