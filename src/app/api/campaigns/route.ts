import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CampaignStatus } from "@/generated/prisma/enums";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const parsedPageSize = parseInt(searchParams.get("pageSize") ?? "25", 10) || 25;
    const pageSize = [25, 50, 100].includes(parsedPageSize) ? parsedPageSize : 25;
    const skip = (page - 1) * pageSize;

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where: { userId: session.id },
        orderBy: { updatedAt: "desc" },
        include: {
          audienceList: {
            select: { name: true },
          },
        },
        take: pageSize,
        skip,
      }),
      db.campaign.count({
        where: { userId: session.id },
      }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("GET /api/campaigns", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subjectLine: z.string().transform((s) => s.replace(/[\r\n]/g, "")).optional().default(""),
  htmlBody: z.string().max(500000, "Email HTML body is too large").optional().default(""),
  textBody: z.string().max(100000, "Email text body is too large").optional().default(""),
  status: z.enum([CampaignStatus.draft, CampaignStatus.scheduled]).default(CampaignStatus.draft),
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
        htmlBody: sanitizeHtml(parsed.data.htmlBody),
        textBody: parsed.data.textBody,
        status: parsed.data.status,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/campaigns", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
