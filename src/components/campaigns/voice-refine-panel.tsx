"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import MicButton from "@/components/voice/mic-button";
import TranscriptDisplay from "@/components/voice/transcript-display";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface RefineApiResponse {
  campaign: {
    campaignName: string;
    subjectLines: string[];
    htmlBody: string;
    textBody: string;
  };
}

interface VoiceRefinePanelProps {
  campaignId: string;
  onRefined: (data: {
    name: string;
    subjectLine: string;
    htmlBody: string;
    textBody: string;
  }) => void;
  onClose: () => void;
}

export default function VoiceRefinePanel({
  campaignId,
  onRefined,
  onClose,
}: VoiceRefinePanelProps) {
  const [isRefining, setIsRefining] = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const {
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error: voiceError,
  } = useVoiceInput();

  function handleCancel() {
    if (isListening) stopListening();
    onClose();
  }

  async function handleSubmit() {
    const refineText = isSupported ? transcript : fallbackText;
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
      onRefined({
        name: data.campaign.campaignName,
        subjectLine: data.campaign.subjectLines[0] ?? "",
        htmlBody: data.campaign.htmlBody,
        textBody: data.campaign.textBody,
      });
      toast.success("Campaign refined successfully!");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Refinement failed";
      toast.error(message);
    } finally {
      setIsRefining(false);
    }
  }

  const refineText = isSupported ? transcript : fallbackText;

  return (
    <div className="rounded-lg border border-[#FDA085]/30 bg-gradient-to-r from-[#F6D365]/5 to-[#FDA085]/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Refine with Voice</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Describe how you want to change the campaign (e.g., &ldquo;make it
        shorter&rdquo;, &ldquo;change the CTA to sign up&rdquo;)
      </p>

      <div className="flex flex-col items-center gap-3">
        {isSupported ? (
          <>
            <MicButton
              isListening={isListening}
              isSupported={isSupported}
              onToggle={isListening ? stopListening : startListening}
            />
            <TranscriptDisplay
              transcript={transcript}
              interimTranscript={interimTranscript}
              isListening={isListening}
            />
          </>
        ) : (
          <textarea
            value={fallbackText}
            onChange={(e) => setFallbackText(e.target.value)}
            placeholder="Type your refinement instruction..."
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        )}

        {voiceError && (
          <p className="text-sm text-destructive">{voiceError}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isRefining || isListening || !refineText.trim()}
          className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
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
  );
}
