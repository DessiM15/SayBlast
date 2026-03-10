"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Loader2, Send, ShieldAlert, XCircle } from "lucide-react";
import { ANTI_SPAM_COOLDOWN_HOURS } from "@/lib/constants";

interface CooldownPreviewData {
  totalContacts: number;
  inCooldown: number;
  available: number;
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; data: CooldownPreviewData }
  | { status: "error" };

interface SendConfirmDialogProps {
  campaignId: string;
  campaign: {
    name: string;
    subjectLine: string | null;
    audienceList: { name: string } | null;
    totalRecipients: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSending: boolean;
  onConfirm: () => void;
}

export default function SendConfirmDialog({
  campaignId,
  campaign,
  open,
  onOpenChange,
  isSending,
  onConfirm,
}: SendConfirmDialogProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (!open) {
      setPreview({ status: "idle" });
      return;
    }

    let cancelled = false;
    setPreview({ status: "loading" });

    fetch(`/api/campaigns/${campaignId}/cooldown-preview`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error("Preview fetch failed");
        const data = (await res.json()) as CooldownPreviewData;
        setPreview({ status: "loaded", data });
      })
      .catch(() => {
        if (!cancelled) setPreview({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [open, campaignId]);

  const allInCooldown =
    preview.status === "loaded" &&
    preview.data.available === 0 &&
    preview.data.totalContacts > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirm Send
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Emails will be sent immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaign</span>
            <span className="font-medium">{campaign.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subject</span>
            <span className="font-medium">{campaign.subjectLine}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audience</span>
            <span className="font-medium">
              {campaign.audienceList?.name ?? "Unknown"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipients</span>
            <span className="font-medium">{campaign.totalRecipients}</span>
          </div>
        </div>

        {/* Cooldown Preview */}
        <CooldownBanner preview={preview} allInCooldown={allInCooldown} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSending || allInCooldown}
            className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
          >
            <Send className="mr-1 h-4 w-4" />
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CooldownBanner({
  preview,
  allInCooldown,
}: {
  preview: PreviewState;
  allInCooldown: boolean;
}) {
  if (preview.status === "idle") return null;

  if (preview.status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        Checking recipient availability...
      </div>
    );
  }

  if (preview.status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        Could not check cooldown status. You can still proceed.
      </div>
    );
  }

  const { totalContacts, inCooldown, available } = preview.data;

  if (allInCooldown) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <div className="text-sm">
          <p className="font-medium text-red-800 dark:text-red-200">
            All {totalContacts} recipients are in cooldown
          </p>
          <p className="mt-0.5 text-red-700 dark:text-red-300">
            No emails will be delivered. Try again after the {ANTI_SPAM_COOLDOWN_HOURS}-hour cooldown period expires.
          </p>
        </div>
      </div>
    );
  }

  if (inCooldown > 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            {inCooldown} of {totalContacts} recipients are within the {ANTI_SPAM_COOLDOWN_HOURS}-hour cooldown
          </p>
          <p className="mt-0.5 text-yellow-700 dark:text-yellow-300">
            {available} recipient{available !== 1 ? "s" : ""} will receive the email. {inCooldown} will be skipped.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
      <p className="text-sm font-medium text-green-800 dark:text-green-200">
        All {totalContacts} recipients are available.
      </p>
    </div>
  );
}
