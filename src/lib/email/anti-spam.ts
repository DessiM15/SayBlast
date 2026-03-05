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
