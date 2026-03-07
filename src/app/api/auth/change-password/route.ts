import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { compare, hash } from "bcryptjs";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(72, "Password must be 72 characters or fewer"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: unknown = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { passwordHash: true, email: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Password change is not available for OAuth accounts" },
        { status: 400 }
      );
    }

    const isValid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const newHash = await hash(parsed.data.newPassword, 12);

    await db.user.update({
      where: { id: session.id },
      data: { passwordHash: newHash },
    });

    // Update Supabase Auth to stay in sync
    const supabase = await createServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, {
        password: parsed.data.newPassword,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
