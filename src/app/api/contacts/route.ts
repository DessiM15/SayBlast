import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const addContactSchema = z.object({
  audienceListId: z.string().min(1, "Audience list ID is required"),
  contacts: z.array(
    z.object({
      email: z.email("Invalid email address"),
      firstName: z.string().optional().default(""),
      lastName: z.string().optional().default(""),
    })
  ).min(1, "At least one contact is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = addContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { audienceListId, contacts } = parsed.data;

    // Verify ownership
    const audienceList = await db.audienceList.findFirst({
      where: { id: audienceListId, userId: session.id, deletedAt: null },
    });

    if (!audienceList) {
      return NextResponse.json(
        { error: "Audience list not found" },
        { status: 404 }
      );
    }

    let added = 0;
    let skipped = 0;

    for (const contact of contacts) {
      try {
        await db.contact.create({
          data: {
            audienceListId,
            email: contact.email.toLowerCase(),
            firstName: contact.firstName,
            lastName: contact.lastName,
          },
        });
        added++;
      } catch (error) {
        // Unique constraint violation — duplicate email in list
        if (
          error instanceof Error &&
          error.message.includes("Unique constraint")
        ) {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({ added, skipped }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Add contacts error:", error);
    return NextResponse.json(
      { error: "Failed to add contacts" },
      { status: 500 }
    );
  }
}

const deleteContactSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = deleteContactSchema.safeParse(body);

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

    await db.contact.update({
      where: { id: parsed.data.contactId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Delete contact error:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
