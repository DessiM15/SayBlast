import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

const ConnectSmtpSchema = z.object({
  userId: z.string().min(1),
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  secure: z.boolean(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ConnectSmtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const { userId, host, port, username, password, secure } = parsed.data;

    // Encrypt the SMTP password
    const encryptedPassword = encrypt(password);

    await db.user.update({
      where: { id: userId },
      data: {
        emailProvider: "smtp",
        emailAddress: username,
        smtpHost: host,
        smtpPort: port,
        smtpUser: username,
        smtpPass: encryptedPassword,
        smtpSecure: secure,
        emailVerified: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/connect-smtp]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
