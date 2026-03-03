"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { WebSpeechProvider } from "@/lib/voice/web-speech-provider";
import type { SpeechProvider } from "@/lib/voice/speech-provider";

interface UseVoiceInputReturn {
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<SpeechProvider | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const provider = new WebSpeechProvider();
    providerRef.current = provider;
    // Check support after mount to avoid SSR mismatch
    setIsSupported(provider.isSupported()); // eslint-disable-line react-hooks/set-state-in-effect -- one-time init, no cascading renders

    return () => {
      provider.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;

    setError(null);
    setInterimTranscript("");

    provider.onResult((text, isFinal) => {
      if (isFinal) {
        setTranscript((prev) => (prev ? prev + " " + text : text));
        setInterimTranscript("");
      } else {
        setInterimTranscript(text);
      }
    });

    provider.onError((err) => {
      setError(err);
      setIsListening(false);
    });

    provider.onEnd(() => {
      setIsListening(false);
      setInterimTranscript("");
    });

    provider.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;

    provider.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    resetTranscript,
  };
}
