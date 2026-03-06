import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCampaign } from "@/lib/email/campaign-sender";
import type { SendResult } from "@/lib/email/campaign-sender";
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

    // Find all scheduled campaigns that are due
    const now = new Date();
    const dueCampaigns = await db.campaign.findMany({
      where: {
        status: CampaignStatus.scheduled,
        scheduledAt: { lte: now },
      },
      select: { id: true, name: true },
    });

    if (dueCampaigns.length === 0) {
      return NextResponse.json({
        message: "No campaigns due for sending",
        processed: 0,
      });
    }

    const results: SendResult[] = [];

    for (const campaign of dueCampaigns) {
      // Set status to "sending" before processing
      await db.campaign.update({
        where: { id: campaign.id },
        data: { status: CampaignStatus.sending },
      });

      const result = await sendCampaign(campaign.id);
      results.push(result);
    }

    return NextResponse.json({
      message: `Processed ${results.length} campaign(s)`,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
