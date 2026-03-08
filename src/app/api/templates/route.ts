import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BUILT_IN_TEMPLATES } from "@/lib/templates/built-in-templates";
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

    const [userTemplates, customTotal] = await Promise.all([
      db.campaignTemplate.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.campaignTemplate.count({
        where: { userId: session.id },
      }),
    ]);

    const builtIn = BUILT_IN_TEMPLATES.map((t, index) => ({
      id: `built-in-${index}`,
      name: t.name,
      description: t.description,
      htmlTemplate: t.htmlTemplate,
      isDefault: true,
      userId: null,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      templates: [...builtIn, ...userTemplates],
      builtInCount: builtIn.length,
      customCount: customTotal,
      pagination: {
        page,
        limit,
        total: customTotal,
        totalPages: Math.ceil(customTotal / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("GET /api/templates", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  htmlTemplate: z.string().min(1, "HTML template is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const template = await db.campaignTemplate.create({
      data: {
        userId: session.id,
        name: parsed.data.name,
        htmlTemplate: parsed.data.htmlTemplate,
        isDefault: false,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/templates", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
