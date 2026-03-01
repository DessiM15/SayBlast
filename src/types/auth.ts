export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  onboardingComplete: boolean;
  emailProvider: string | null;
  emailAddress: string | null;
  emailVerified: boolean;
}

export interface AuthSession {
  user: SessionUser;
  supabaseId: string;
}

export type EmailProvider = "gmail" | "outlook" | "smtp";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
}
