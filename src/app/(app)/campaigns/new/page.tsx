"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CampaignStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RotateCcw, Keyboard } from "lucide-react";
import MicButton from "@/components/voice/mic-button";
import TranscriptDisplay from "@/components/voice/transcript-display";
import ReviewPanel from "@/components/campaigns/review-panel";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import type { CampaignGeneration } from "@/lib/ai/process-transcript";

type PageState = "recording" | "processing" | "review";

export default function NewCampaignPage() {
  const router = useRouter();
  const {
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error: voiceError,
    resetTranscript,
  } = useVoiceInput();

  const [pageState, setPageState] = useState<PageState>("recording");
  const [textFallback, setTextFallback] = useState("");
  const [campaignData, setCampaignData] = useState<CampaignGeneration | null>(null);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const currentTranscript = isSupported ? transcript : textFallback;
  const hasTranscript = currentTranscript.trim().length > 0;

  function handleMicToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  async function handleProcess() {
    if (!hasTranscript) return;

    setPageState("processing");
    setProcessingError(null);

    try {
      const response = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: currentTranscript }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to process transcript");
      }

      const data = (await response.json()) as {
        campaign: CampaignGeneration;
        campaignId: string;
      };
      setCampaignData(data.campaign);
      setCreatedCampaignId(data.campaignId);
      setPageState("review");
      toast.success("Campaign generated successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setProcessingError(message);
      setPageState("recording");
      toast.error(message);
    }
  }

  async function handleSave(selectedSubjectLine: string) {
    if (!campaignData) return;

    // If campaign was already created by the process endpoint, update it
    if (createdCampaignId) {
      try {
        const response = await fetch(`/api/campaigns/${createdCampaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectLine: selectedSubjectLine,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to save campaign");
        }

        toast.success("Campaign saved as draft!");
        router.push(`/campaigns/${createdCampaignId}/edit`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save campaign";
        toast.error(message);
      }
      return;
    }

    // Fallback: create new campaign
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignData.campaignName,
          subjectLine: selectedSubjectLine,
          htmlBody: campaignData.htmlBody,
          textBody: campaignData.textBody,
          status: CampaignStatus.draft,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save campaign");
      }

      const data = (await response.json()) as { campaign: { id: string } };
      toast.success("Campaign saved as draft!");
      router.push(`/campaigns/${data.campaign.id}/edit`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save campaign";
      toast.error(message);
    }
  }

  function handleStartOver() {
    resetTranscript();
    setTextFallback("");
    setCampaignData(null);
    setProcessingError(null);
    setPageState("recording");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">New Campaign</h1>
        <p className="mt-1 text-muted-foreground">
          Describe your email campaign using your voice or text
        </p>
      </div>

      {/* RECORDING STATE */}
      {pageState === "recording" && (
        <div className="flex flex-col items-center gap-6">
          <MicButton
            isListening={isListening}
            isSupported={isSupported}
            onToggle={handleMicToggle}
          />

          {isSupported && (
            <TranscriptDisplay
              transcript={transcript}
              interimTranscript={interimTranscript}
              isListening={isListening}
            />
          )}

          {/* Text fallback */}
          {!isSupported && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Keyboard className="h-4 w-4" />
                  Describe Your Campaign
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6">
                <textarea
                  value={textFallback}
                  onChange={(e) => setTextFallback(e.target.value)}
                  placeholder="Describe the email campaign you want to create. For example: 'I want to send a promotional email about our spring sale with 20% off all products to our newsletter subscribers...'"
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </Card>
          )}

          {voiceError && (
            <p className="text-sm text-destructive" role="alert">{voiceError}</p>
          )}

          {processingError && (
            <p className="text-sm text-destructive" role="alert">{processingError}</p>
          )}

          <Button
            onClick={handleProcess}
            disabled={!hasTranscript || isListening}
            className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
          >
            Process & Generate Campaign
          </Button>
        </div>
      )}

      {/* PROCESSING STATE */}
      {pageState === "processing" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#F6D365] to-[#FDA085]">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Generating your campaign...</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI is crafting the perfect email based on your description
            </p>
          </div>
        </div>
      )}

      {/* REVIEW STATE */}
      {pageState === "review" && campaignData && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {campaignData.campaignName}
            </h2>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </div>
          <ReviewPanel campaign={campaignData} onSave={handleSave} />
        </div>
      )}
    </div>
  );
}
