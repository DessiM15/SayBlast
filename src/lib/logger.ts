/**
 * Server-side logger that sanitizes errors before logging.
 * Strips connection strings, tokens, and long secrets from output.
 * NEVER import this in client components — server-only.
 */

const SENSITIVE_PATTERNS = [
  // Connection strings
  /(?:postgresql|mysql|mongodb|redis|amqp):\/\/[^\s"'`,)}\]]+/gi,
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  // Long hex strings (32+ chars, likely secrets/keys)
  /\b[0-9a-f]{32,}\b/gi,
  // Long base64 strings (32+ chars, likely secrets/tokens)
  /\b[A-Za-z0-9+/]{32,}={0,2}\b/g,
];

function sanitizeString(value: string): string {
  let sanitized = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
}

function sanitizeError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    const result: { message: string; code?: string } = {
      message: sanitizeString(error.message),
    };
    const code = (error as Error & { code?: string }).code;
    if (typeof code === "string") {
      result.code = code;
    }
    return result;
  }

  if (typeof error === "string") {
    return { message: sanitizeString(error) };
  }

  return { message: "Unknown error" };
}

function formatSanitized(sanitized: { message: string; code?: string }): string {
  if (sanitized.code) {
    return `${sanitized.message} (code: ${sanitized.code})`;
  }
  return sanitized.message;
}

export const logger = {
  error(context: string, error: unknown): void {
    const sanitized = sanitizeError(error);
    console.error(`[${context}] ${formatSanitized(sanitized)}`);
  },

  warn(context: string, message: string): void {
    console.warn(`[${context}] ${sanitizeString(message)}`);
  },

  info(context: string, message: string): void {
    console.log(`[${context}] ${sanitizeString(message)}`);
  },
};
