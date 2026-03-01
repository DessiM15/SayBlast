import type {
  SpeechProvider,
  SpeechResultCallback,
  SpeechErrorCallback,
  SpeechEndCallback,
} from "./speech-provider";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const win = window as unknown as Record<string, unknown>;
  return (
    (win.SpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    (win.webkitSpeechRecognition as SpeechRecognitionConstructor | undefined) ??
    null
  );
}

export class WebSpeechProvider implements SpeechProvider {
  private recognition: SpeechRecognitionInstance | null = null;
  private resultCallback: SpeechResultCallback | null = null;
  private errorCallback: SpeechErrorCallback | null = null;
  private endCallback: SpeechEndCallback | null = null;

  isSupported(): boolean {
    return getSpeechRecognitionConstructor() !== null;
  }

  onResult(callback: SpeechResultCallback): void {
    this.resultCallback = callback;
  }

  onError(callback: SpeechErrorCallback): void {
    this.errorCallback = callback;
  }

  onEnd(callback: SpeechEndCallback): void {
    this.endCallback = callback;
  }

  start(): void {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      this.errorCallback?.("Speech recognition is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognitionCtor();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result === undefined) continue;

        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        this.resultCallback?.(finalTranscript, true);
      }
      if (interimTranscript) {
        this.resultCallback?.(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      this.errorCallback?.(event.error || "Speech recognition error");
    };

    this.recognition.onend = () => {
      this.endCallback?.();
    };

    this.recognition.start();
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
}
