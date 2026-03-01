import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();

    const audienceLists = await db.audienceList.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ audienceLists });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("List audiences error:", error);
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

    console.error("Create audience error:", error);
    return NextResponse.json(
      { error: "Failed to create audience list" },
      { status: 500 }
    );
  }
}
