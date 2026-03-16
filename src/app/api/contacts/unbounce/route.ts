import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clearBounce } from "@/lib/email/bounce";
import { logger } from "@/lib/logger";

const unbounceSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = unbounceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify ownership through the audience list relation
    const contact = await db.contact.findFirst({
      where: { id: parsed.data.contactId, deletedAt: null },
      include: {
        audienceList: {
          select: { userId: true },
        },
      },
    });

    if (!contact || contact.audienceList.userId !== session.id) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    await clearBounce(parsed.data.contactId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/contacts/unbounce", error);
    return NextResponse.json(
      { error: "Failed to clear bounce status" },
      { status: 500 }
    );
  }
}
