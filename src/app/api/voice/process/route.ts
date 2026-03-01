import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { processTranscript } from "@/lib/ai/process-transcript";

const requestSchema = z.object({
  transcript: z.string().min(1, "Transcript is required"),
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

    const { transcript } = parsed.data;

    const campaignData = await processTranscript(transcript);

    const voiceTranscript = await db.voiceTranscript.create({
      data: {
        campaign: {
          create: {
            userId: session.id,
            name: campaignData.campaignName,
            status: "draft",
            subjectLine: campaignData.subjectLines[0] ?? "",
            htmlBody: campaignData.htmlBody,
            textBody: campaignData.textBody,
          },
        },
        rawTranscript: transcript,
        parsedData: JSON.parse(JSON.stringify(campaignData)),
        type: "initial",
      },
      select: {
        campaignId: true,
      },
    });

    return NextResponse.json({
      campaign: campaignData,
      campaignId: voiceTranscript.campaignId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Voice processing error:", error);
    return NextResponse.json(
      { error: "Failed to process voice transcript" },
      { status: 500 }
    );
  }
}
