import { createHash } from "crypto";
import { logger } from "@/lib/logger";

/**
 * Check if a password has appeared in known data breaches
 * using the HaveIBeenPwned Pwned Passwords API (k-anonymity model).
 * Returns the number of times the password was seen in breaches, or 0 if clean.
 */
export async function checkPwnedPassword(password: string): Promise<number> {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  let response: Response;
  try {
    response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "User-Agent": "SayBlast-PasswordCheck",
        },
      }
    );
  } catch {
    // If the API is unreachable, fail open — don't block registration
    logger.error("checkPwnedPassword", "HIBP API unreachable");
    return 0;
  }

  if (!response.ok) {
    // If the API returns an error, fail open
    logger.error("checkPwnedPassword", `API returned ${response.status}`);
    return 0;
  }

  const body = await response.text();
  const lines = body.split("\r\n");

  for (const line of lines) {
    const [hashSuffix, count] = line.split(":");
    if (hashSuffix === suffix) {
      return parseInt(count, 10);
    }
  }

  return 0;
}
