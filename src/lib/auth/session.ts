import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { SessionUser } from "@/types/auth";

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const dbUser = await db.user.findUnique({
    where: { email: supabaseUser.email! },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      onboardingComplete: true,
      emailProvider: true,
      emailAddress: true,
      emailVerified: true,
    },
  });

  if (!dbUser) return null;

  return dbUser;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
