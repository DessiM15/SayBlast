import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BUILT_IN_TEMPLATES } from "@/lib/templates/built-in-templates";

export async function GET() {
  try {
    const session = await requireSession();

    const userTemplates = await db.campaignTemplate.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

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
      customCount: userTemplates.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("List templates error:", error);
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

    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
