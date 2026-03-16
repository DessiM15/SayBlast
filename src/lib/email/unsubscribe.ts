import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Generate a per-recipient unsubscribe URL. Reuses existing token if one exists
 * for this (userId, email) pair; otherwise creates a new one.
 */
export async function generateUnsubscribeUrl(
  userId: string,
  contactEmail: string
): Promise<string> {
  const existing = await db.unsubscribe.findUnique({
    where: { userId_email: { userId, email: contactEmail } },
    select: { token: true },
  });

  if (existing) {
    return `${env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${existing.token}`;
  }

  const token = randomBytes(32).toString("hex");

  const record = await db.unsubscribe.create({
    data: { userId, email: contactEmail, token },
  });

  return `${env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${record.token}`;
}

/**
 * Process an unsubscribe request by token. Soft-deletes the contact from
 * ALL of the sender's audience lists and returns success.
 */
export async function processUnsubscribe(
  token: string
): Promise<{ success: boolean; email?: string }> {
  const record = await db.unsubscribe.findUnique({
    where: { token },
    select: { userId: true, email: true },
  });

  if (!record) {
    return { success: false };
  }

  // Soft-delete this email from all of the sender's audience lists
  const audienceLists = await db.audienceList.findMany({
    where: { userId: record.userId, deletedAt: null },
    select: { id: true },
  });

  const listIds = audienceLists.map((l) => l.id);

  if (listIds.length > 0) {
    await db.contact.updateMany({
      where: {
        audienceListId: { in: listIds },
        email: record.email,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  return { success: true, email: record.email };
}

/**
 * Check whether an email has unsubscribed from a specific sender.
 */
export async function isUnsubscribed(
  userId: string,
  contactEmail: string
): Promise<boolean> {
  const record = await db.unsubscribe.findUnique({
    where: { userId_email: { userId, email: contactEmail } },
    select: { id: true },
  });

  return record !== null;
}
