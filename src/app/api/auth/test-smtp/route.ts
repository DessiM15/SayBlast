import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createTransport } from "nodemailer";
import { requireSession } from "@/lib/auth/session";

const TestSmtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  secure: z.boolean(),
});

export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = TestSmtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid SMTP configuration" },
      { status: 400 }
    );
  }

  try {
    const { host, port, username, password, secure } = parsed.data;

    const transport = createTransport({
      host,
      port,
      secure,
      auth: {
        user: username,
        pass: password,
      },
    });

    // Verify the connection
    await transport.verify();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/test-smtp]", err);
    return NextResponse.json(
      { error: "Failed to connect. Please check your SMTP settings." },
      { status: 400 }
    );
  }
}
