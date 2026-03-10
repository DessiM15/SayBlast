import { db } from "@/lib/db";
import { SendLogStatus } from "@/generated/prisma/enums";

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

interface CooldownResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether a contact email is within the 72-hour anti-spam cooldown
 * for a specific user. Only the given user's own send history is checked.
 */
export async function checkCooldown(
  contactEmail: string,
  userId: string
): Promise<CooldownResult> {
  const cutoff = new Date(Date.now() - COOLDOWN_MS);

  // Check SendLog for any successful send to this email by this user within 72 hours
  const recentSend = await db.sendLog.findFirst({
    where: {
      contactEmail,
      status: SendLogStatus.sent,
      sentAt: { gte: cutoff },
      campaign: { userId },
    },
    select: { sentAt: true },
  });

  if (recentSend) {
    return {
      allowed: false,
      reason: `72-hour cooldown active (last sent: ${recentSend.sentAt.toISOString()})`,
    };
  }

  return { allowed: true };
}

export interface CooldownPreview {
  totalContacts: number;
  inCooldown: number;
  available: number;
  cooldownDetails: Array<{
    email: string;
    cooldownExpiresAt: string;
  }>;
}

const MAX_COOLDOWN_DETAILS = 50;

/**
 * Preview how many contacts in an audience list are currently within
 * the 72-hour cooldown for a specific user. Informational only — does not block.
 * Uses a single batched query for performance.
 */
export async function previewCooldown(
  audienceListId: string,
  userId: string
): Promise<CooldownPreview> {
  const cutoff = new Date(Date.now() - COOLDOWN_MS);

  // Fetch all non-deleted contacts for the audience list
  const contacts = await db.contact.findMany({
    where: { audienceListId, deletedAt: null },
    select: { email: true },
  });

  const totalContacts = contacts.length;

  if (totalContacts === 0) {
    return { totalContacts: 0, inCooldown: 0, available: 0, cooldownDetails: [] };
  }

  const emails = contacts.map((c) => c.email);

  // Single batched query: find the most recent successful send for each contact
  const recentSends = await db.sendLog.findMany({
    where: {
      contactEmail: { in: emails },
      status: SendLogStatus.sent,
      sentAt: { gte: cutoff },
      campaign: { userId },
    },
    select: { contactEmail: true, sentAt: true },
    orderBy: { sentAt: "desc" },
  });

  // Deduplicate: keep only the most recent send per contact email
  const latestByEmail = new Map<string, Date>();
  for (const log of recentSends) {
    if (!latestByEmail.has(log.contactEmail)) {
      latestByEmail.set(log.contactEmail, log.sentAt);
    }
  }

  const inCooldown = latestByEmail.size;
  const available = totalContacts - inCooldown;

  // Build details array (capped to avoid huge payloads)
  const cooldownDetails: CooldownPreview["cooldownDetails"] = [];
  for (const [email, sentAt] of latestByEmail) {
    if (cooldownDetails.length >= MAX_COOLDOWN_DETAILS) break;
    const expiresAt = new Date(sentAt.getTime() + COOLDOWN_MS);
    cooldownDetails.push({
      email,
      cooldownExpiresAt: expiresAt.toISOString(),
    });
  }

  return { totalContacts, inCooldown, available, cooldownDetails };
}
