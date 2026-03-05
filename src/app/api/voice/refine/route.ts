import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { refineCampaign } from "@/lib/ai/refine-campaign";
import { TranscriptType } from "@/generated/prisma/enums";

const requestSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
  transcript: z.string().min(1, "Refinement transcript is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { campaignId, transcript } = parsed.data;

    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, userId: session.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const refinedData = await refineCampaign(
      {
        name: campaign.name,
        subjectLine: campaign.subjectLine ?? "",
        htmlBody: campaign.htmlBody ?? "",
        textBody: campaign.textBody ?? "",
      },
      transcript
    );

    await db.voiceTranscript.create({
      data: {
        campaignId,
        rawTranscript: transcript,
        parsedData: JSON.parse(JSON.stringify(refinedData)),
        type: TranscriptType.refinement,
      },
    });

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        name: refinedData.campaignName,
        subjectLine: refinedData.subjectLines[0] ?? campaign.subjectLine,
        htmlBody: refinedData.htmlBody,
        textBody: refinedData.textBody,
      },
    });

    return NextResponse.json({ campaign: refinedData });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Voice refinement error:", error);
    return NextResponse.json(
      { error: "Failed to refine campaign" },
      { status: 500 }
    );
  }
}
