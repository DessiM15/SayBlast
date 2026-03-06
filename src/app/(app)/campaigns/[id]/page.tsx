"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CampaignStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Pencil,
  Send,
  Mail,
} from "lucide-react";
import SendProgress from "@/components/campaigns/send-progress";
import SendLogTable from "@/components/campaigns/send-log-table";
import SendConfirmDialog from "@/components/campaigns/send-confirm-dialog";
import SaveTemplateDialog from "@/components/campaigns/save-template-dialog";
import CampaignInfoGrid from "@/components/campaigns/campaign-info-grid";
import SkippedWarning from "@/components/campaigns/skipped-warning";
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
  [CampaignStatus.draft]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  [CampaignStatus.scheduled]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [CampaignStatus.sending]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [CampaignStatus.sent]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [CampaignStatus.failed]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = params.id;

  const SEND_LOG_PAGE_SIZE = 50;
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendLogPage, setSendLogPage] = useState(1);
  const [sendLogTotal, setSendLogTotal] = useState(0);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const loadCampaign = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}?page=${sendLogPage}&pageSize=${SEND_LOG_PAGE_SIZE}`
      );
      if (!response.ok) {
        setErrorMessage(
          response.status === 404
            ? "Campaign not found"
            : "Failed to load campaign"
        );
        setPageStatus("error");
        return;
      }
      const data = (await response.json()) as {
        campaign: CampaignDetail;
        sendLogTotal: number;
      };
      setCampaign(data.campaign);
      setSendLogTotal(data.sendLogTotal);
      setPageStatus("ready");
    } catch {
      setErrorMessage("Failed to load campaign");
      setPageStatus("error");
    }
  }, [campaignId, sendLogPage]);

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
        <p className="text-sm text-destructive" role="alert">
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
          {campaign.htmlBody && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
            >
              <FileText className="mr-1 h-4 w-4" />
              Save as Template
            </Button>
          )}
          {canSend && (
            <Button
              size="sm"
              onClick={() => setShowSendConfirm(true)}
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
          <Badge className={STATUS_COLORS[campaign.status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}>
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
          <SkippedWarning skippedCount={campaign.skippedCount} />
        )}

      {/* Details Grid */}
      <CampaignInfoGrid campaign={campaign} />

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
        <SendLogTable
          entries={campaign.sendLog}
          page={sendLogPage}
          pageSize={SEND_LOG_PAGE_SIZE}
          total={sendLogTotal}
          onPageChange={setSendLogPage}
        />
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
                  onClick={() => setShowSendConfirm(true)}
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

      {/* Dialogs */}
      <SendConfirmDialog
        campaign={campaign}
        open={showSendConfirm}
        onOpenChange={setShowSendConfirm}
        isSending={isSending}
        onConfirm={() => {
          setShowSendConfirm(false);
          handleSendNow();
        }}
      />

      {campaign.htmlBody && (
        <SaveTemplateDialog
          open={showSaveTemplate}
          onOpenChange={setShowSaveTemplate}
          defaultName={`${campaign.name} Template`}
          htmlBody={campaign.htmlBody}
        />
      )}
    </div>
  );
}
