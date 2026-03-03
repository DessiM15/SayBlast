"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CampaignStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Save,
  Check,
  X,
} from "lucide-react";
import EditorPanel from "@/components/campaigns/editor-panel";
import type { CampaignEditorData } from "@/components/campaigns/editor-panel";
import EmailPreview from "@/components/campaigns/email-preview";
import MicButton from "@/components/voice/mic-button";
import TranscriptDisplay from "@/components/voice/transcript-display";
import { useVoiceInput } from "@/hooks/useVoiceInput";

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

interface RefineApiResponse {
  campaign: {
    campaignName: string;
    subjectLines: string[];
    htmlBody: string;
    textBody: string;
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
  const [isRefining, setIsRefining] = useState(false);
  const {
    startListening,
    stopListening,
    transcript: voiceTranscript,
    interimTranscript,
    isListening,
    isSupported: voiceSupported,
    error: voiceError,
    resetTranscript,
  } = useVoiceInput();
  const [refineFallbackText, setRefineFallbackText] = useState("");

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

  // Voice refinement
  function handleRefineWithVoice() {
    setIsRefineMode(true);
    resetTranscript();
    setRefineFallbackText("");
  }

  function handleCancelRefine() {
    setIsRefineMode(false);
    if (isListening) stopListening();
    resetTranscript();
    setRefineFallbackText("");
  }

  async function handleSubmitRefinement() {
    const refineText = voiceSupported ? voiceTranscript : refineFallbackText;
    if (!refineText.trim()) {
      toast.error("Please provide a refinement instruction");
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch("/api/voice/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          transcript: refineText,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Refinement failed");
      }

      const data = (await response.json()) as RefineApiResponse;
      setCampaign((prev) => ({
        ...prev,
        name: data.campaign.campaignName,
        subjectLine: data.campaign.subjectLines[0] ?? prev.subjectLine,
        htmlBody: data.campaign.htmlBody,
        textBody: data.campaign.textBody,
      }));

      setIsRefineMode(false);
      resetTranscript();
      setRefineFallbackText("");
      toast.success("Campaign refined successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Refinement failed";
      toast.error(message);
    } finally {
      setIsRefining(false);
    }
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
        <p className="text-sm text-destructive">
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
        <div className="rounded-lg border border-[#FDA085]/30 bg-gradient-to-r from-[#F6D365]/5 to-[#FDA085]/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Refine with Voice</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelRefine}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Describe how you want to change the campaign (e.g., &ldquo;make it shorter&rdquo;, &ldquo;change the CTA to sign up&rdquo;)
          </p>

          <div className="flex flex-col items-center gap-3">
            {voiceSupported ? (
              <>
                <MicButton
                  isListening={isListening}
                  isSupported={voiceSupported}
                  onToggle={isListening ? stopListening : startListening}
                />
                <TranscriptDisplay
                  transcript={voiceTranscript}
                  interimTranscript={interimTranscript}
                  isListening={isListening}
                />
              </>
            ) : (
              <textarea
                value={refineFallbackText}
                onChange={(e) => setRefineFallbackText(e.target.value)}
                placeholder="Type your refinement instruction..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            )}

            {voiceError && (
              <p className="text-sm text-destructive">{voiceError}</p>
            )}

            <Button
              onClick={handleSubmitRefinement}
              disabled={
                isRefining ||
                isListening ||
                !(voiceSupported ? voiceTranscript : refineFallbackText).trim()
              }
              className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-white hover:opacity-90"
            >
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refining...
                </>
              ) : (
                "Apply Refinement"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Editor + Preview Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EditorPanel
          campaign={campaign}
          onChange={handleChange}
          onRefineWithVoice={handleRefineWithVoice}
          isRefining={isRefining}
        />
        <EmailPreview
          html={campaign.htmlBody}
          subjectLine={campaign.subjectLine}
        />
      </div>
    </div>
  );
}
