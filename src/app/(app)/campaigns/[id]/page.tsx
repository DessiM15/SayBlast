"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CampaignStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Send,
  Mail,
  ShieldOff,
  Users,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import SendProgress from "@/components/campaigns/send-progress";
import SendLogTable from "@/components/campaigns/send-log-table";
import type { SendLogEntry } from "@/components/campaigns/send-log-table";

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  subjectLine: string | null;
  htmlBody: string | null;
  textBody: string | null;
  audienceListId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  sentCount: number;
  skippedCount: number;
  audienceList: {
    id: string;
    name: string;
  } | null;
  sendLog: SendLogEntry[];
  createdAt: string;
  updatedAt: string;
}

type PageStatus = "loading" | "ready" | "error";

const STATUS_COLORS: Record<string, string> = {
  [CampaignStatus.draft]: "bg-gray-100 text-gray-800",
  [CampaignStatus.scheduled]: "bg-blue-100 text-blue-800",
  [CampaignStatus.sending]: "bg-yellow-100 text-yellow-800",
  [CampaignStatus.sent]: "bg-green-100 text-green-800",
  [CampaignStatus.failed]: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = params.id;

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isSending, setIsSending] = useState(false);

  const loadCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        setErrorMessage(
          response.status === 404
            ? "Campaign not found"
            : "Failed to load campaign"
        );
        setPageStatus("error");
        return;
      }
      const data = (await response.json()) as { campaign: CampaignDetail };
      setCampaign(data.campaign);
      setPageStatus("ready");
    } catch {
      setErrorMessage("Failed to load campaign");
      setPageStatus("error");
    }
  }, [campaignId]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  async function handleSendNow() {
    if (!campaign) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Send failed");
      }

      const data = (await response.json()) as {
        result: { sent: number; skipped: number; failed: number };
      };

      // Warn if all recipients were skipped due to cooldown
      if (
        data.result.sent === 0 &&
        data.result.skipped > 0 &&
        data.result.failed === 0
      ) {
        toast.warning(
          `All ${data.result.skipped} recipient(s) were skipped due to the 72-hour anti-spam cooldown. No emails were sent.`
        );
      } else if (data.result.sent > 0 && data.result.skipped > 0) {
        toast.success(
          `Sent to ${data.result.sent} recipient(s). ${data.result.skipped} skipped (cooldown).`
        );
      } else if (data.result.sent > 0) {
        toast.success(`Campaign sent to ${data.result.sent} recipient(s)!`);
      } else {
        toast.error("Campaign sending failed for all recipients.");
      }

      // Reload to get updated stats
      await loadCampaign();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }

  if (pageStatus === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (pageStatus === "error" || !campaign) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">
          {errorMessage ?? "Something went wrong"}
        </p>
        <Button variant="outline" onClick={() => router.push("/campaigns")}>
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const canSend =
    (campaign.status === CampaignStatus.draft || campaign.status === CampaignStatus.scheduled) &&
    campaign.subjectLine &&
    campaign.htmlBody &&
    campaign.audienceListId;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Campaigns
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/campaigns/${campaignId}/edit`}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {canSend && (
            <Button
              size="sm"
              onClick={handleSendNow}
              disabled={isSending}
              className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" />
                  Send Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <Badge className={STATUS_COLORS[campaign.status] ?? "bg-gray-100 text-gray-800"}>
            {campaign.status}
          </Badge>
        </div>
        {campaign.subjectLine && (
          <p className="mt-1 text-muted-foreground">
            Subject: {campaign.subjectLine}
          </p>
        )}
      </div>

      {/* Warning: all recipients skipped */}
      {campaign.status === CampaignStatus.sent &&
        campaign.sentCount === 0 &&
        campaign.skippedCount > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                All recipients were skipped
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                All {campaign.skippedCount} recipient(s) were within the 72-hour
                anti-spam cooldown. No emails were delivered. Try again after the
                cooldown period expires.
              </p>
            </div>
          </div>
        )}

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {campaign.audienceList?.name ?? "No audience"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {campaign.sentAt ? "Sent At" : "Scheduled For"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {campaign.sentAt
                ? formatDate(campaign.sentAt)
                : campaign.scheduledAt
                  ? formatDate(campaign.scheduledAt)
                  : "Not scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {campaign.totalRecipients}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {formatDate(campaign.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Send Stats */}
      {campaign.totalRecipients > 0 && (
        <SendProgress
          sentCount={campaign.sentCount}
          skippedCount={campaign.skippedCount}
          totalRecipients={campaign.totalRecipients}
        />
      )}

      {/* Send Log */}
      {campaign.sendLog.length > 0 && (
        <SendLogTable entries={campaign.sendLog} />
      )}

      {/* Empty state for unsent campaigns */}
      {campaign.totalRecipients === 0 &&
        campaign.sendLog.length === 0 &&
        campaign.status !== CampaignStatus.sending && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Mail className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                This campaign hasn&apos;t been sent yet.
              </p>
              {canSend && (
                <Button
                  onClick={handleSendNow}
                  disabled={isSending}
                  className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
                >
                  <Send className="mr-1 h-4 w-4" />
                  Send Now
                </Button>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
