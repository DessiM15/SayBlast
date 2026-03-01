import { db } from "@/lib/db";
import { createEmailTransport } from "@/lib/email/transport-factory";
import { checkCooldown } from "@/lib/email/anti-spam";

export interface SendResult {
  campaignId: string;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const RATE_LIMIT_MS = 1000; // 1 email per second

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a campaign to all contacts in its audience list.
 * Campaign must already be in "sending" status before calling this.
 */
export async function sendCampaign(campaignId: string): Promise<SendResult> {
  const result: SendResult = {
    campaignId,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Load campaign with user, audience list, and contacts
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      user: true,
      audienceList: {
        include: {
          contacts: true,
        },
      },
    },
  });

  if (!campaign) {
    result.errors.push("Campaign not found");
    return result;
  }

  if (campaign.status !== "sending") {
    result.errors.push(`Campaign is not in "sending" status (current: ${campaign.status})`);
    return result;
  }

  if (!campaign.htmlBody) {
    result.errors.push("Campaign has no HTML body");
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "failed" },
    });
    return result;
  }

  if (!campaign.audienceList || campaign.audienceList.contacts.length === 0) {
    result.errors.push("Campaign has no audience or audience has no contacts");
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "failed" },
    });
    return result;
  }

  const contacts = campaign.audienceList.contacts;
  const totalRecipients = contacts.length;

  // Create email transport for the user
  let transport;
  try {
    transport = await createEmailTransport(campaign.user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transport creation failed";
    result.errors.push(message);
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "failed" },
    });
    return result;
  }

  // Process each contact sequentially
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    // Check anti-spam cooldown
    const cooldown = await checkCooldown(contact.email);

    if (!cooldown.allowed) {
      // Skipped due to cooldown
      await db.sendLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: "skipped_cooldown",
          error: cooldown.reason ?? null,
        },
      });
      result.skipped++;

      await db.campaign.update({
        where: { id: campaignId },
        data: { skippedCount: { increment: 1 } },
      });

      continue;
    }

    // Send the email
    try {
      await transport.sendMail({
        from: campaign.user.emailAddress ?? campaign.user.email,
        to: contact.email,
        subject: campaign.subjectLine ?? "(No Subject)",
        html: campaign.htmlBody,
        text: campaign.textBody ?? undefined,
      });

      // Log success
      await db.sendLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: "sent",
        },
      });

      // Update contact's lastEmailedAt
      await db.contact.update({
        where: { id: contact.id },
        data: { lastEmailedAt: new Date() },
      });

      // Increment sent count
      await db.campaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      });

      result.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";

      await db.sendLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: "failed",
          error: message,
        },
      });

      result.failed++;
      result.errors.push(`${contact.email}: ${message}`);
    }

    // Rate limit: 1 email per second (skip delay after last contact)
    if (i < contacts.length - 1) {
      await delay(RATE_LIMIT_MS);
    }
  }

  // Update campaign final status
  const finalStatus = result.sent === 0 && result.failed > 0 ? "failed" : "sent";

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      totalRecipients,
    },
  });

  return result;
}
