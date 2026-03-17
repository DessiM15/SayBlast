import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createEmailTransport } from "@/lib/email/transport-factory";
import { generateUnsubscribeUrl } from "@/lib/email/unsubscribe";
import {
  injectComplianceFooter,
  injectComplianceFooterText,
} from "@/lib/email/compliance-footer";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const testSendSchema = z.object({
  testEmail: z.email("Invalid email address").max(254),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Rate limit: 5 test sends per campaign per user per hour
    const { success } = await rateLimit(`testSend:${session.id}:${id}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many test sends. Maximum 5 per campaign per hour." },
        { status: 429 }
      );
    }

    const body: unknown = await request.json();
    const parsed = testSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Load campaign and verify ownership
    const campaign = await db.campaign.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        subjectLine: true,
        htmlBody: true,
        textBody: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!campaign.htmlBody) {
      return NextResponse.json(
        { error: "Campaign has no email content. Save your campaign first." },
        { status: 400 }
      );
    }

    // Load full user for transport creation
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        emailProvider: true,
        emailAddress: true,
        emailAccessToken: true,
        emailRefreshToken: true,
        emailTokenExpiry: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpSecure: true,
        postalAddress: true,
      },
    });

    if (!user?.emailProvider) {
      return NextResponse.json(
        { error: "No email account connected. Go to Settings to connect one." },
        { status: 400 }
      );
    }

    if (!user.postalAddress) {
      return NextResponse.json(
        { error: "Physical mailing address required. Go to Settings to add it." },
        { status: 400 }
      );
    }

    // Create transport
    let transport;
    try {
      transport = await createEmailTransport(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transport creation failed";
      return NextResponse.json(
        { error: `Failed to connect to email account: ${message}` },
        { status: 500 }
      );
    }

    // Generate unsubscribe URL and inject compliance footer
    const unsubscribeUrl = await generateUnsubscribeUrl(
      session.id,
      parsed.data.testEmail
    );
    const htmlWithFooter = injectComplianceFooter(
      campaign.htmlBody,
      user.postalAddress,
      unsubscribeUrl
    );
    const textWithFooter = campaign.textBody
      ? injectComplianceFooterText(
          campaign.textBody,
          user.postalAddress,
          unsubscribeUrl
        )
      : undefined;

    const subject = `[TEST] ${campaign.subjectLine ?? "(No Subject)"}`;

    // Send the test email
    await transport.sendMail({
      from: user.emailAddress ?? user.email,
      to: parsed.data.testEmail,
      subject,
      html: htmlWithFooter,
      text: textWithFooter,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.error("POST /api/campaigns/[id]/test-send", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
