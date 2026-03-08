import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const ALLOWED_LIMITS = [10, 25, 50, 100] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const rawLimit = parseInt(searchParams.get("limit") ?? "25", 10) || 25;
    const limit = ALLOWED_LIMITS.includes(rawLimit as typeof ALLOWED_LIMITS[number])
      ? rawLimit
      : 25;
    const skip = (page - 1) * limit;

    const [audienceLists, total] = await Promise.all([
      db.audienceList.findMany({
        where: { userId: session.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { contacts: { where: { deletedAt: null } } },
          },
        },
        take: limit,
        skip,
      }),
      db.audienceList.count({
        where: { userId: session.id, deletedAt: null },
      }),
    ]);

    return NextResponse.json({
      audienceLists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("GET /api/audiences", error);
    return NextResponse.json(
      { error: "Failed to fetch audience lists" },
      { status: 500 }
    );
  }
}

const createAudienceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = createAudienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const audienceList = await db.audienceList.create({
      data: {
        userId: session.id,
        name: parsed.data.name,
        description: parsed.data.description,
      },
    });

    return NextResponse.json({ audienceList }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/audiences", error);
    return NextResponse.json(
      { error: "Failed to create audience list" },
      { status: 500 }
    );
  }
}
