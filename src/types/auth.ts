import { EmailProvider } from "@/generated/prisma/enums";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  onboardingComplete: boolean;
  emailProvider: EmailProvider | null;
  emailAddress: string | null;
  emailVerified: boolean;
}

export interface AuthSession {
  user: SessionUser;
  supabaseId: string;
}

export type { EmailProvider };

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
}
