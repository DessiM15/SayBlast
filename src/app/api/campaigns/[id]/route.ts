import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, userId: session.id },
      include: {
        transcripts: {
          orderBy: { createdAt: "desc" },
        },
        audienceList: {
          select: { id: true, name: true },
        },
        sendLog: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get campaign error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  subjectLine: z.string().optional(),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
  audienceListId: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await db.campaign.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.subjectLine !== undefined) updateData.subjectLine = parsed.data.subjectLine;
    if (parsed.data.htmlBody !== undefined) updateData.htmlBody = parsed.data.htmlBody;
    if (parsed.data.textBody !== undefined) updateData.textBody = parsed.data.textBody;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.audienceListId !== undefined) updateData.audienceListId = parsed.data.audienceListId;
    if (parsed.data.scheduledAt !== undefined) {
      updateData.scheduledAt = parsed.data.scheduledAt
        ? new Date(parsed.data.scheduledAt)
        : null;
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Update campaign error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
