"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CampaignStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Save,
  Check,
} from "lucide-react";
import EditorPanel from "@/components/campaigns/editor-panel";
import type { CampaignEditorData } from "@/components/campaigns/editor-panel";
import EmailPreview from "@/components/campaigns/email-preview";
import VoiceRefinePanel from "@/components/campaigns/voice-refine-panel";

interface CampaignApiResponse {
  campaign: {
    id: string;
    name: string;
    status: string;
    subjectLine: string | null;
    htmlBody: string | null;
    textBody: string | null;
    audienceListId: string | null;
    scheduledAt: string | null;
  };
}

type PageStatus = "loading" | "ready" | "error";

export default function CampaignEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = params.id;

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignEditorData>({
    name: "",
    subjectLine: "",
    htmlBody: "",
    textBody: "",
    status: CampaignStatus.draft,
    audienceListId: null,
    scheduledAt: null,
  });

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChangesRef = useRef<Partial<CampaignEditorData> | null>(null);

  // Voice refinement state
  const [isRefineMode, setIsRefineMode] = useState(false);

  // Load campaign
  useEffect(() => {
    async function loadCampaign() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setErrorMessage("Campaign not found");
          } else {
            setErrorMessage("Failed to load campaign");
          }
          setPageStatus("error");
          return;
        }
        const data = (await response.json()) as CampaignApiResponse;
        setCampaign({
          name: data.campaign.name,
          subjectLine: data.campaign.subjectLine ?? "",
          htmlBody: data.campaign.htmlBody ?? "",
          textBody: data.campaign.textBody ?? "",
          status: data.campaign.status,
          audienceListId: data.campaign.audienceListId,
          scheduledAt: data.campaign.scheduledAt,
        });
        setPageStatus("ready");
      } catch {
        setErrorMessage("Failed to load campaign");
        setPageStatus("error");
      }
    }

    loadCampaign();
  }, [campaignId]);

  // Auto-save with debounce
  const saveCampaign = useCallback(
    async (updates: Partial<CampaignEditorData>) => {
      setSaveStatus("saving");
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) {
          throw new Error("Save failed");
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
        toast.error("Failed to save changes");
      }
    },
    [campaignId]
  );

  // Flush pending changes on unmount (prevents data loss on navigation)
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (pendingChangesRef.current) {
        saveCampaign(pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    };
  }, [saveCampaign]);

  // Warn on tab close/refresh when there are pending changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (pendingChangesRef.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  function handleChange(updates: Partial<CampaignEditorData>) {
    setCampaign((prev) => ({ ...prev, ...updates }));

    // Accumulate pending changes
    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      ...updates,
    };

    // Debounce save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      if (pendingChangesRef.current) {
        saveCampaign(pendingChangesRef.current);
        pendingChangesRef.current = null;
      }
    }, 1500);
  }

  // Loading state
  if (pageStatus === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  // Error state
  if (pageStatus === "error") {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Campaigns
            </Link>
          </Button>
          <Badge
            variant="secondary"
            className="capitalize"
          >
            {campaign.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1">
              <Save className="h-3.5 w-3.5 animate-pulse" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Voice Refinement Panel */}
      {isRefineMode && (
        <VoiceRefinePanel
          campaignId={campaignId}
          onRefined={(data) => {
            setCampaign((prev) => ({
              ...prev,
              name: data.name,
              subjectLine: data.subjectLine,
              htmlBody: data.htmlBody,
              textBody: data.textBody,
            }));
          }}
          onClose={() => setIsRefineMode(false)}
        />
      )}

      {/* Editor + Preview Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EditorPanel
          campaignId={campaignId}
          campaign={campaign}
          onChange={handleChange}
          onRefineWithVoice={() => setIsRefineMode(true)}
          isRefining={isRefineMode}
        />
        <EmailPreview
          html={campaign.htmlBody}
          subjectLine={campaign.subjectLine}
        />
      </div>
    </div>
  );
}
