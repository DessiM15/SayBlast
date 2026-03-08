import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createTransport } from "nodemailer";
import { lookup } from "dns/promises";
import { requireSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

const TestSmtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  secure: z.boolean(),
});

function isPrivateIp(ip: string): boolean {
  // IPv4 private/reserved ranges
  if (ip.startsWith("127.")) return true;        // loopback
  if (ip.startsWith("10.")) return true;          // Class A private
  if (ip.startsWith("192.168.")) return true;     // Class C private
  if (ip.startsWith("169.254.")) return true;     // link-local / cloud metadata
  if (ip.startsWith("0.")) return true;           // "this" network
  if (ip === "255.255.255.255") return true;       // broadcast

  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // IPv6 private/reserved
  if (ip === "::1") return true;                  // loopback
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;  // unique local
  if (ip.startsWith("fe80")) return true;         // link-local
  if (ip === "::") return true;                   // unspecified

  return false;
}

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

    // Resolve hostname and block private/internal IPs to prevent SSRF
    let resolvedIp: string;
    try {
      const result = await lookup(host);
      resolvedIp = result.address;
    } catch {
      return NextResponse.json(
        { error: "Could not resolve hostname. Please check the SMTP host." },
        { status: 400 }
      );
    }

    if (isPrivateIp(resolvedIp)) {
      return NextResponse.json(
        { error: "SMTP host resolves to a private or reserved IP address." },
        { status: 400 }
      );
    }

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
    logger.error("POST /api/auth/test-smtp", err);
    return NextResponse.json(
      { error: "Failed to connect. Please check your SMTP settings." },
      { status: 400 }
    );
  }
}
