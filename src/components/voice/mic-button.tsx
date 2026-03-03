"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isListening,
  isSupported,
  onToggle,
  disabled = false,
}: MicButtonProps) {
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <MicOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Voice input is not supported in this browser.
          <br />
          Use the text input below instead.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {isListening && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] opacity-30" />
            <span className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-r from-[#F6D365] to-[#FDA085] opacity-20" />
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          disabled={disabled}
          className={`relative h-20 w-20 rounded-full transition-all duration-200 ${
            isListening
              ? "bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground shadow-lg hover:opacity-90"
              : "bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-80"
          }`}
        >
          {isListening ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {isListening ? "Tap to stop recording" : "Tap to start speaking"}
      </p>
    </div>
  );
}
