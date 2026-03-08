import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CampaignStatus } from "@/generated/prisma/enums";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { logger } from "@/lib/logger";

const ALLOWED_PAGE_SIZES = [25, 50, 100] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const rawPageSize = Number(searchParams.get("pageSize")) || 50;
    const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize as typeof ALLOWED_PAGE_SIZES[number])
      ? rawPageSize
      : 50;

    const [campaign, sendLogTotal] = await Promise.all([
      db.campaign.findFirst({
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
            take: pageSize,
            skip: (page - 1) * pageSize,
          },
        },
      }),
      db.sendLog.count({
        where: { campaignId: id },
      }),
    ]);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign, sendLogTotal });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("GET /api/campaigns/[id]", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

function isValidStatusTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  const allowed: Record<CampaignStatus, CampaignStatus[]> = {
    [CampaignStatus.draft]: [CampaignStatus.scheduled],
    [CampaignStatus.scheduled]: [CampaignStatus.draft],
    [CampaignStatus.sending]: [],
    [CampaignStatus.sent]: [],
    [CampaignStatus.failed]: [CampaignStatus.draft],
  };
  return allowed[from]?.includes(to) ?? false;
}

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200, "Campaign name is too long").optional(),
  subjectLine: z.string().max(998, "Subject line is too long").transform((s) => s.replace(/[\r\n]/g, "")).optional(),
  htmlBody: z.string().max(500000, "Email HTML body is too large").optional(),
  textBody: z.string().max(100000, "Email text body is too large").optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  audienceListId: z.string().nullable().optional(),
  scheduledAt: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (val === null || val === undefined) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid date format" }
    ),
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

    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
      if (!isValidStatusTransition(existing.status, parsed.data.status)) {
        return NextResponse.json(
          { error: `Cannot change status from "${existing.status}" to "${parsed.data.status}"` },
          { status: 400 }
        );
      }

      if (parsed.data.status === CampaignStatus.scheduled) {
        const scheduledAt = parsed.data.scheduledAt ?? (existing.scheduledAt ? existing.scheduledAt.toISOString() : null);
        if (!scheduledAt) {
          return NextResponse.json(
            { error: "Scheduled date is required" },
            { status: 400 }
          );
        }
        const scheduledDate = new Date(scheduledAt);
        const oneMinuteAgo = new Date(Date.now() - 60_000);
        if (scheduledDate < oneMinuteAgo) {
          return NextResponse.json(
            { error: "Scheduled date must be in the future" },
            { status: 400 }
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.subjectLine !== undefined) updateData.subjectLine = parsed.data.subjectLine;
    if (parsed.data.htmlBody !== undefined) updateData.htmlBody = sanitizeHtml(parsed.data.htmlBody);
    if (parsed.data.textBody !== undefined) updateData.textBody = parsed.data.textBody;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.audienceListId !== undefined) updateData.audienceListId = parsed.data.audienceListId;
    if (parsed.data.scheduledAt !== undefined) {
      if (parsed.data.scheduledAt !== null) {
        const newDate = new Date(parsed.data.scheduledAt);
        const effectiveStatus = parsed.data.status ?? existing.status;
        if (effectiveStatus === CampaignStatus.scheduled) {
          const oneMinuteAgo = new Date(Date.now() - 60_000);
          if (newDate < oneMinuteAgo) {
            return NextResponse.json(
              { error: "Scheduled date must be in the future" },
              { status: 400 }
            );
          }
        }
      }
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

    logger.error("PUT /api/campaigns/[id]", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
