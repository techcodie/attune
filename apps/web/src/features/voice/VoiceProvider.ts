/**
 * The voice provider contract. The interview room depends only on this — the
 * browser Web Speech implementation is the free default, and a managed provider
 * (e.g. ElevenLabs) can be swapped in without touching the room.
 */
export interface VoiceListenHandlers {
  /** Interim (non-final) transcript, for live captions. */
  onPartial?: (text: string, confidence: number) => void;
  /** A finalized utterance with its recognition confidence (0–1). */
  onFinal: (text: string, confidence: number) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

/** A synthesis voice the user can choose. */
export interface VoiceOption {
  id: string;
  label: string;
  lang: string;
}

export interface SpeakOptions {
  /** 0.5–2. Defaults to ~1. */
  rate?: number;
  /** Voice id from `getVoices()`. */
  voiceURI?: string;
}

export interface VoiceProvider {
  readonly name: string;
  /** Whether this environment can actually do speech I/O. */
  isSupported(): boolean;
  startListening(handlers: VoiceListenHandlers): void;
  stopListening(): void;
  speak(text: string, opts?: SpeakOptions): Promise<void>;
  cancelSpeaking(): void;
  /** Available synthesis voices (may be empty until the engine warms up). */
  getVoices(): VoiceOption[];
}
