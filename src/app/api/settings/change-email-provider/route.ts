import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.update({
    where: { id: session.id },
    data: {
      emailProvider: null,
      emailAddress: null,
      emailVerified: false,
      emailAccessToken: null,
      emailRefreshToken: null,
      emailTokenExpiry: null,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPass: null,
      smtpSecure: true,
    },
  });

  return NextResponse.json({ success: true });
}
