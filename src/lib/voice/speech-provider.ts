export interface SpeechResultCallback {
  (transcript: string, isFinal: boolean): void;
}

export interface SpeechErrorCallback {
  (error: string): void;
}

export interface SpeechEndCallback {
  (): void;
}

export interface SpeechProvider {
  start(): void;
  stop(): void;
  onResult(callback: SpeechResultCallback): void;
  onError(callback: SpeechErrorCallback): void;
  onEnd(callback: SpeechEndCallback): void;
  isSupported(): boolean;
}
