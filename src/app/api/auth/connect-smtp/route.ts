import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { EmailProvider } from "@/generated/prisma/enums";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const ConnectSmtpSchema = z.object({
  host: z.string().min(1, "SMTP host is required").max(253, "SMTP host is too long"),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, "Username is required").max(200, "Username is too long"),
  password: z.string().min(1, "Password is required").max(500, "Password is too long"),
  secure: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = ConnectSmtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { host, port, username, password, secure } = parsed.data;

    // Encrypt the SMTP password
    const encryptedPassword = encrypt(password);

    await db.user.update({
      where: { id: session.id },
      data: {
        emailProvider: EmailProvider.smtp,
        emailAddress: username,
        smtpHost: host,
        smtpPort: port,
        smtpUser: username,
        smtpPass: encryptedPassword,
        smtpSecure: secure,
        emailVerified: true,
        // Clear any stale OAuth fields from a previous provider
        emailAccessToken: null,
        emailRefreshToken: null,
        emailTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/auth/connect-smtp", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
