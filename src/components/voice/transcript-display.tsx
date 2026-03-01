"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
}

export default function TranscriptDisplay({
  transcript,
  interimTranscript,
  isListening,
}: TranscriptDisplayProps) {
  const hasContent = transcript || interimTranscript;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Transcript
          {isListening && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <div className="px-6 pb-6">
        {hasContent ? (
          <div className="min-h-[100px] rounded-md border bg-muted/50 p-4 text-sm leading-relaxed">
            {transcript && <span>{transcript}</span>}
            {interimTranscript && (
              <span className="text-muted-foreground"> {interimTranscript}</span>
            )}
          </div>
        ) : (
          <div className="flex min-h-[100px] items-center justify-center rounded-md border border-dashed bg-muted/30 p-4">
            <p className="text-center text-sm text-muted-foreground">
              {isListening
                ? "Listening... start speaking"
                : "Press the mic button and start speaking..."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
