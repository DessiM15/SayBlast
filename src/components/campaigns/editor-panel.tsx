"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Mic, Pencil, ShieldAlert } from "lucide-react";
import { CampaignStatus } from "@/generated/prisma/enums";
import { ANTI_SPAM_COOLDOWN_HOURS } from "@/lib/constants";

const TiptapEditor = dynamic(
  () => import("@/components/campaigns/tiptap-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-md border bg-muted" />
    ),
  }
);

export interface CampaignEditorData {
  name: string;
  subjectLine: string;
  htmlBody: string;
  textBody: string;
  status: string;
  audienceListId?: string | null;
  scheduledAt?: string | null;
}

interface EditorPanelProps {
  campaignId: string;
  campaign: CampaignEditorData;
  onChange: (updates: Partial<CampaignEditorData>) => void;
  onRefineWithVoice: () => void;
  isRefining: boolean;
}

interface ScheduleCooldownState {
  status: "idle" | "checking" | "warning" | "error";
  inCooldown: number;
  totalContacts: number;
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getMinDatetime(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditorPanel({
  campaignId,
  campaign,
  onChange,
  onRefineWithVoice,
  isRefining,
}: EditorPanelProps) {
  const [cooldownState, setCooldownState] = useState<ScheduleCooldownState>({
    status: "idle",
    inCooldown: 0,
    totalContacts: 0,
  });

  async function handleScheduleClick() {
    if (!campaign.audienceListId) {
      // No audience — just schedule, backend will validate at send time
      onChange({ scheduledAt: campaign.scheduledAt, status: CampaignStatus.scheduled });
      return;
    }

    setCooldownState({ status: "checking", inCooldown: 0, totalContacts: 0 });

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/cooldown-preview`);
      if (!res.ok) throw new Error("Preview failed");

      const data = (await res.json()) as {
        totalContacts: number;
        inCooldown: number;
        available: number;
      };

      if (data.inCooldown > 0) {
        setCooldownState({
          status: "warning",
          inCooldown: data.inCooldown,
          totalContacts: data.totalContacts,
        });
        return;
      }

      // No cooldown issues — proceed directly
      setCooldownState({ status: "idle", inCooldown: 0, totalContacts: 0 });
      onChange({ scheduledAt: campaign.scheduledAt, status: CampaignStatus.scheduled });
    } catch {
      // Preview failed — don't block scheduling
      setCooldownState({ status: "idle", inCooldown: 0, totalContacts: 0 });
      onChange({ scheduledAt: campaign.scheduledAt, status: CampaignStatus.scheduled });
    }
  }

  function handleScheduleAnyway() {
    setCooldownState({ status: "idle", inCooldown: 0, totalContacts: 0 });
    onChange({ scheduledAt: campaign.scheduledAt, status: CampaignStatus.scheduled });
  }

  function handleCancelSchedule() {
    setCooldownState({ status: "idle", inCooldown: 0, totalContacts: 0 });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4" />
            Campaign Details
          </CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaign.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Enter campaign name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-line">Subject Line</Label>
            <Input
              id="subject-line"
              value={campaign.subjectLine}
              onChange={(e) => onChange({ subjectLine: e.target.value })}
              placeholder="Enter email subject line"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Body (HTML)</Label>
            <TiptapEditor
              content={campaign.htmlBody}
              onChange={(html) => onChange({ htmlBody: html })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-body">Plain Text Version</Label>
            <textarea
              id="text-body"
              value={campaign.textBody}
              onChange={(e) => onChange({ textBody: e.target.value })}
              rows={4}
              placeholder="Plain text version of the email"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </Card>

      {/* Scheduling */}
      {campaign.status === CampaignStatus.sent ||
      campaign.status === CampaignStatus.sending ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              This campaign has already been sent.
            </p>
          </div>
        </Card>
      ) : campaign.status === CampaignStatus.scheduled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Scheduled
              </Badge>
              <span className="text-sm font-medium">
                {campaign.scheduledAt
                  ? new Date(campaign.scheduledAt).toLocaleString()
                  : ""}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                onChange({
                  scheduledAt: null,
                  status: CampaignStatus.draft,
                })
              }
            >
              Unschedule
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="scheduled-at">Send Date &amp; Time</Label>
              <input
                id="scheduled-at"
                type="datetime-local"
                min={getMinDatetime()}
                value={
                  campaign.scheduledAt
                    ? toDatetimeLocal(campaign.scheduledAt)
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  onChange({
                    scheduledAt: value ? new Date(value).toISOString() : null,
                  });
                  // Reset cooldown state when date changes
                  if (cooldownState.status === "warning") {
                    setCooldownState({ status: "idle", inCooldown: 0, totalContacts: 0 });
                  }
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {cooldownState.status === "checking" ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                Checking recipient availability...
              </div>
            ) : cooldownState.status === "warning" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      {cooldownState.inCooldown} of {cooldownState.totalContacts} recipients are currently in the {ANTI_SPAM_COOLDOWN_HOURS}-hour cooldown
                    </p>
                    <p className="mt-0.5 text-yellow-700 dark:text-yellow-300">
                      As of now, these recipients would be skipped. This may change by the scheduled send time.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSchedule}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleScheduleAnyway}
                    className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
                  >
                    Schedule Anyway
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                disabled={
                  !campaign.scheduledAt ||
                  new Date(campaign.scheduledAt) <= new Date()
                }
                onClick={handleScheduleClick}
                className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
              >
                Schedule Campaign
              </Button>
            )}
          </div>
        </Card>
      )}

      <Button
        variant="outline"
        onClick={onRefineWithVoice}
        disabled={isRefining}
        className="w-full"
      >
        {isRefining ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refining...
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Refine with Voice
          </>
        )}
      </Button>
    </div>
  );
}
