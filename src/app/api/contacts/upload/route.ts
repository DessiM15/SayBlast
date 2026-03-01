import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import Papa from "papaparse";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const uploadSchema = z.object({
  audienceListId: z.string().min(1, "Audience list ID is required"),
  csvText: z.string().min(1, "CSV content is required"),
});

interface CsvRow {
  email?: string;
  Email?: string;
  EMAIL?: string;
  firstName?: string;
  first_name?: string;
  FirstName?: string;
  "First Name"?: string;
  lastName?: string;
  last_name?: string;
  LastName?: string;
  "Last Name"?: string;
}

function extractEmail(row: CsvRow): string | null {
  const raw = row.email ?? row.Email ?? row.EMAIL;
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

function extractFirstName(row: CsvRow): string {
  return (
    row.firstName ??
    row.first_name ??
    row.FirstName ??
    row["First Name"] ??
    ""
  ).trim();
}

function extractLastName(row: CsvRow): string {
  return (
    row.lastName ??
    row.last_name ??
    row.LastName ??
    row["Last Name"] ??
    ""
  ).trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { audienceListId, csvText } = parsed.data;

    // Verify ownership
    const audienceList = await db.audienceList.findFirst({
      where: { id: audienceListId, userId: session.id },
    });

    if (!audienceList) {
      return NextResponse.json(
        { error: "Audience list not found" },
        { status: 404 }
      );
    }

    const result = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0 && result.data.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV", details: result.errors },
        { status: 400 }
      );
    }

    let added = 0;
    let skipped = 0;
    let invalid = 0;

    for (const row of result.data) {
      const email = extractEmail(row);
      if (!email) {
        invalid++;
        continue;
      }

      const firstName = extractFirstName(row);
      const lastName = extractLastName(row);

      try {
        await db.contact.create({
          data: {
            audienceListId,
            email,
            firstName: firstName || null,
            lastName: lastName || null,
          },
        });
        added++;
      } catch (error) {
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

    return NextResponse.json(
      {
        added,
        skipped,
        invalid,
        total: result.data.length,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("CSV upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload contacts" },
      { status: 500 }
    );
  }
}
