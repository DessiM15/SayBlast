import { db } from "@/lib/db";
import { createEmailTransport } from "@/lib/email/transport-factory";
import { checkCooldown } from "@/lib/email/anti-spam";
import { CampaignStatus, SendLogStatus } from "@/generated/prisma/enums";

export interface SendResult {
  campaignId: string;
  sent: number;
  skipped: number;
  failed: number;
  remaining: number;
  errors: string[];
}

const BATCH_SIZE = 5;
const RATE_LIMIT_MS = 1000; // 1 email per second

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a batch of emails for a campaign.
 * Processes up to BATCH_SIZE contacts that haven't been sent yet.
 * Writes send logs immediately after each email so progress survives timeouts.
 * Returns remaining count — caller should re-invoke on next cron tick if > 0.
 */
export async function sendCampaign(campaignId: string): Promise<SendResult> {
  const result: SendResult = {
    campaignId,
    sent: 0,
    skipped: 0,
    failed: 0,
    remaining: 0,
    errors: [],
  };

  // Load campaign with user, audience list, and contacts
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      user: {
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
        },
      },
      audienceList: {
        include: {
          contacts: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!campaign) {
    result.errors.push("Campaign not found");
    return result;
  }

  if (campaign.status !== CampaignStatus.sending) {
    result.errors.push(`Campaign is not in "sending" status (current: ${campaign.status})`);
    return result;
  }

  if (!campaign.htmlBody) {
    result.errors.push("Campaign has no HTML body");
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.failed },
    });
    return result;
  }

  if (!campaign.audienceList || campaign.audienceList.contacts.length === 0) {
    result.errors.push("Campaign has no audience or audience has no contacts");
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.failed },
    });
    return result;
  }

  const contacts = campaign.audienceList.contacts;

  // Find already-processed contacts from previous batches
  const processedLogs = await db.sendLog.findMany({
    where: { campaignId },
    select: { contactEmail: true },
  });
  const processedEmails = new Set(processedLogs.map((l) => l.contactEmail));

  // Filter to unprocessed contacts and take one batch
  const remainingContacts = contacts.filter((c) => !processedEmails.has(c.email));

  if (remainingContacts.length === 0) {
    // All contacts already processed — finalize
    await finalizeCampaign(campaignId, contacts.length);
    return result;
  }

  const batch = remainingContacts.slice(0, BATCH_SIZE);
  result.remaining = remainingContacts.length - batch.length;

  // Create email transport for the user
  let transport;
  try {
    transport = await createEmailTransport(campaign.user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transport creation failed";
    result.errors.push(message);
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.failed },
    });
    return result;
  }

  // Process each contact in the batch
  for (let i = 0; i < batch.length; i++) {
    const contact = batch[i];

    // Check anti-spam cooldown
    const cooldown = await checkCooldown(contact.email, campaign.userId);

    if (!cooldown.allowed) {
      // Write send log immediately — survives timeouts
      await db.sendLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: SendLogStatus.skipped_cooldown,
          error: cooldown.reason ?? null,
        },
      });
      result.skipped++;
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

      // Write send log and update contact immediately
      await db.sendLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: SendLogStatus.sent,
          error: null,
        },
      });
      await db.contact.update({
        where: { id: contact.id },
        data: { lastEmailedAt: new Date() },
      });
      result.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";

      await db.sendLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: SendLogStatus.failed,
          error: message,
        },
      });
      result.failed++;
      result.errors.push(`${contact.email}: ${message}`);
    }

    // Rate limit: 1 email per second (skip delay after last contact in batch)
    if (i < batch.length - 1) {
      await delay(RATE_LIMIT_MS);
    }
  }

  // If no more contacts remain after this batch, finalize the campaign
  if (result.remaining === 0) {
    await finalizeCampaign(campaignId, contacts.length);
  }

  return result;
}

/**
 * Compute final stats from send logs and set campaign to sent/failed.
 */
async function finalizeCampaign(campaignId: string, totalContacts: number): Promise<void> {
  const [sentCount, failedCount] = await Promise.all([
    db.sendLog.count({ where: { campaignId, status: SendLogStatus.sent } }),
    db.sendLog.count({ where: { campaignId, status: SendLogStatus.failed } }),
  ]);
  const skippedCount = totalContacts - sentCount - failedCount;

  const finalStatus = sentCount === 0 && failedCount > 0
    ? CampaignStatus.failed
    : CampaignStatus.sent;

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      totalRecipients: totalContacts,
      sentCount,
      skippedCount,
    },
  });
}
