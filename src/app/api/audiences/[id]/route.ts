import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const parsedLimit = parseInt(searchParams.get("limit") ?? "50", 10) || 50;
    const limit = [25, 50, 100, 500].includes(parsedLimit) ? parsedLimit : 50;
    const skip = (page - 1) * limit;

    const audienceList = await db.audienceList.findFirst({
      where: { id, userId: session.id },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!audienceList) {
      return NextResponse.json(
        { error: "Audience list not found" },
        { status: 404 }
      );
    }

    const contacts = await db.contact.findMany({
      where: { audienceListId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    const totalContacts = audienceList._count.contacts;
    const totalPages = Math.ceil(totalContacts / limit);

    return NextResponse.json({
      audienceList,
      contacts,
      pagination: {
        page,
        limit,
        totalContacts,
        totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Get audience error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audience list" },
      { status: 500 }
    );
  }
}

const updateAudienceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await db.audienceList.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Audience list not found" },
        { status: 404 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateAudienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;

    const audienceList = await db.audienceList.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ audienceList });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Update audience error:", error);
    return NextResponse.json(
      { error: "Failed to update audience list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await db.audienceList.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Audience list not found" },
        { status: 404 }
      );
    }

    await db.audienceList.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Delete audience error:", error);
    return NextResponse.json(
      { error: "Failed to delete audience list" },
      { status: 500 }
    );
  }
}
