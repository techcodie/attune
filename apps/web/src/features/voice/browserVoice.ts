import type {
  SpeakOptions,
  VoiceListenHandlers,
  VoiceOption,
  VoiceProvider,
} from './VoiceProvider';

/**
 * The default, free voice provider: the browser's SpeechRecognition (STT) and
 * SpeechSynthesis (TTS). No paid services, no keys. Everything provider-specific
 * about the browser APIs is contained here — the room never touches them.
 */
export class BrowserVoiceProvider implements VoiceProvider {
  readonly name = 'browser';
  private recognition: SpeechRecognition | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        this.voices = window.speechSynthesis.getVoices();
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  isSupported(): boolean {
    const w = typeof window !== 'undefined' ? window : undefined;
    const hasSTT = Boolean(w?.SpeechRecognition ?? w?.webkitSpeechRecognition);
    const hasTTS = Boolean(w && 'speechSynthesis' in w);
    return hasSTT && hasTTS;
  }

  getVoices(): VoiceOption[] {
    return this.voices
      .filter((v) => v.lang.startsWith('en'))
      .map((v) => ({ id: v.voiceURI, label: `${v.name} (${v.lang})`, lang: v.lang }));
  }

  startListening(handlers: VoiceListenHandlers): void {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      handlers.onError?.('unsupported');
      return;
    }

    this.stopListening();
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = '';
      let interimConf = 0;
      let final = '';
      let finalConf = 0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) {
          final += alt.transcript;
          finalConf = alt.confidence;
        } else {
          interim += alt.transcript;
          interimConf = alt.confidence;
        }
      }
      if (interim) handlers.onPartial?.(interim, interimConf);
      if (final) handlers.onFinal(final.trim(), finalConf);
    };
    rec.onerror = (event) => handlers.onError?.(event.error);
    rec.onend = () => handlers.onEnd?.();

    this.recognition = rec;
    rec.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onend = null;
      this.recognition.onerror = null;
      try {
        this.recognition.stop();
      } catch {
        /* already stopped */
      }
      this.recognition = null;
    }
  }

  speak(text: string, opts: SpeakOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel(); // never overlap
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = opts.rate ?? 1.02;
      utterance.pitch = 1;
      const voice = opts.voiceURI ? this.voices.find((v) => v.voiceURI === opts.voiceURI) : undefined;
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  cancelSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

/** Singleton browser provider — constructed once, never per render. */
export const browserVoiceProvider = new BrowserVoiceProvider();
