import { db } from "@/lib/db";
import { SendLogStatus } from "@/generated/prisma/client";

const COOLDOWN_HOURS = 72;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

interface CooldownResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether a contact email is within the 72-hour anti-spam cooldown.
 * Looks at SendLog entries with status "sent" across ALL campaigns.
 */
export async function checkCooldown(
  contactEmail: string
): Promise<CooldownResult> {
  const cutoff = new Date(Date.now() - COOLDOWN_MS);

  // Check SendLog for any successful send to this email within 72 hours
  const recentSend = await db.sendLog.findFirst({
    where: {
      contactEmail,
      status: SendLogStatus.sent,
      sentAt: { gte: cutoff },
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
