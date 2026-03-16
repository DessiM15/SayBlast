import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const updatePostalAddressSchema = z.object({
  postalAddress: z
    .string()
    .min(1, "Physical mailing address is required")
    .max(500, "Address is too long"),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = updatePostalAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: session.id },
      data: { postalAddress: parsed.data.postalAddress },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("PUT /api/settings/postal-address", error);
    return NextResponse.json(
      { error: "Failed to update postal address" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await requireSession();

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { postalAddress: true },
    });

    return NextResponse.json({ postalAddress: user?.postalAddress ?? "" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("GET /api/settings/postal-address", error);
    return NextResponse.json(
      { error: "Failed to fetch postal address" },
      { status: 500 }
    );
  }
}
