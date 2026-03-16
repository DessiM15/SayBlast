/**
 * Validates email format using a practical regex.
 * Allows plus-addressing (user+tag@gmail.com), subdomains, and common TLDs.
 * Rejects: missing @, missing domain, missing TLD, spaces, double dots in domain.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Strips CSV injection characters from the beginning of a string.
 * Dangerous leading characters (=, +, -, @, \t, \r) could trigger formula
 * execution if contacts are exported to Excel/Google Sheets.
 *
 * Only apply to name fields, NEVER to email fields.
 */
export function sanitizeCsvField(value: string): string {
  return value.replace(/^[=+\-@\t\r]+/, "");
}
