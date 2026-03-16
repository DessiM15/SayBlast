import { db } from "@/lib/db";

const BOUNCE_THRESHOLD = 2;

const HARD_BOUNCE_PATTERNS = [
  /mailbox not found/i,
  /user unknown/i,
  /no such user/i,
  /address rejected/i,
  /does not exist/i,
  /invalid recipient/i,
  /undeliverable/i,
  /recipient rejected/i,
  /account disabled/i,
  /account has been disabled/i,
  /mailbox unavailable/i,
  /mailbox disabled/i,
  /\b550\b/,
  /\b551\b/,
  /\b552\b/,
  /\b553\b/,
  /\b554\b/,
];

const SOFT_BOUNCE_PATTERNS = [
  /mailbox full/i,
  /over quota/i,
  /try again/i,
  /temporarily/i,
  /too many connections/i,
  /rate limit/i,
  /\b421\b/,
  /\b450\b/,
  /\b451\b/,
  /\b452\b/,
  /timeout/i,
  /connection refused/i,
  /connection reset/i,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
];

/**
 * Classify a send error as hard bounce, soft bounce, or unknown.
 * Soft bounces are checked first — if a message matches both (unlikely),
 * we err on the side of not penalizing the contact.
 */
export function classifyBounce(
  errorMessage: string
): "hard" | "soft" | "unknown" {
  if (SOFT_BOUNCE_PATTERNS.some((p) => p.test(errorMessage))) {
    return "soft";
  }
  if (HARD_BOUNCE_PATTERNS.some((p) => p.test(errorMessage))) {
    return "hard";
  }
  return "unknown";
}

/**
 * Record a hard bounce for a contact. Increments bounceCount and sets bouncedAt.
 */
export async function recordHardBounce(contactId: string): Promise<void> {
  await db.contact.update({
    where: { id: contactId },
    data: {
      bounceCount: { increment: 1 },
      bouncedAt: new Date(),
    },
  });
}

/**
 * Check if a contact has exceeded the bounce threshold.
 * Returns true if the contact should be skipped.
 */
export function isHardBounced(bounceCount: number): boolean {
  return bounceCount >= BOUNCE_THRESHOLD;
}

/**
 * Reset bounce status for a contact (manual un-bounce by user).
 */
export async function clearBounce(contactId: string): Promise<void> {
  await db.contact.update({
    where: { id: contactId },
    data: {
      bounceCount: 0,
      bouncedAt: null,
    },
  });
}
