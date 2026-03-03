interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

/** Remove all expired entries from the store. */
function cleanup(now: number): void {
  for (const [key, entry] of store) {
    if (now >= entry.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * In-memory rate limiter. Returns whether the request is allowed and how many
 * requests remain in the current window.
 *
 * @param ip      - Client identifier (IP address)
 * @param limit   - Max requests allowed per window (default 5)
 * @param windowMs - Window duration in milliseconds (default 15 000)
 */
export function rateLimit(
  ip: string,
  limit = 5,
  windowMs = 15_000,
): { success: boolean; remaining: number } {
  const now = Date.now();
  cleanup(now);

  const entry = store.get(ip);

  if (!entry || now >= entry.resetTime) {
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
}
