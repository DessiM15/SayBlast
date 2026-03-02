import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();

    const campaigns = await db.campaign.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: "desc" },
      include: {
        audienceList: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("List campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subjectLine: z.string().optional().default(""),
  htmlBody: z.string().optional().default(""),
  textBody: z.string().optional().default(""),
  status: z.enum(["draft", "scheduled"]).default("draft"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        userId: session.id,
        name: parsed.data.name,
        subjectLine: parsed.data.subjectLine,
        htmlBody: parsed.data.htmlBody,
        textBody: parsed.data.textBody,
        status: parsed.data.status,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
