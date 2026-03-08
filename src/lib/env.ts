/**
 * Server-only validated environment variables.
 * Uses lazy getters so errors only throw when a var is actually accessed,
 * not at module load time. This allows optional features (OAuth, AI) to
 * not crash the app when their vars aren't configured.
 *
 * DO NOT import this in client components.
 */

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // Supabase — always required
  get NEXT_PUBLIC_SUPABASE_URL() { return requiredEnv("NEXT_PUBLIC_SUPABASE_URL"); },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requiredEnv("SUPABASE_SERVICE_ROLE_KEY"); },

  // Database — always required
  get DATABASE_URL() { return requiredEnv("DATABASE_URL"); },

  // Google OAuth — required when Gmail features are used
  get GOOGLE_CLIENT_ID() { return requiredEnv("GOOGLE_CLIENT_ID"); },
  get GOOGLE_CLIENT_SECRET() { return requiredEnv("GOOGLE_CLIENT_SECRET"); },

  // Microsoft OAuth — required when Outlook features are used
  get MICROSOFT_CLIENT_ID() { return requiredEnv("MICROSOFT_CLIENT_ID"); },
  get MICROSOFT_CLIENT_SECRET() { return requiredEnv("MICROSOFT_CLIENT_SECRET"); },

  // Upstash Redis — required for rate limiting
  get UPSTASH_REDIS_REST_URL() { return requiredEnv("UPSTASH_REDIS_REST_URL"); },
  get UPSTASH_REDIS_REST_TOKEN() { return requiredEnv("UPSTASH_REDIS_REST_TOKEN"); },

  // AI — required when voice features are used
  get ANTHROPIC_API_KEY() { return requiredEnv("ANTHROPIC_API_KEY"); },

  // Encryption — required for token storage
  get ENCRYPTION_KEY() { return requiredEnv("ENCRYPTION_KEY"); },

  // Cron — required for scheduled sending
  get CRON_SECRET() { return requiredEnv("CRON_SECRET"); },
} as const;
