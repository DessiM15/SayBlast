import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { hash } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { checkPwnedPassword } from "@/lib/auth/check-pwned-password";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be 72 characters or fewer"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check if password has been exposed in data breaches
    const breachCount = await checkPwnedPassword(parsed.data.password);
    if (breachCount > 0) {
      return NextResponse.json(
        { error: "This password has appeared in a data breach and is not safe to use. Please choose a different password." },
        { status: 400 }
      );
    }

    // Update Supabase Auth
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
      password: parsed.data.password,
    });

    // Update our DB hash too
    if (supabaseUser.email) {
      const newHash = await hash(parsed.data.password, 12);
      await db.user.update({
        where: { email: supabaseUser.email },
        data: { passwordHash: newHash },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("POST /api/auth/reset-password", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
