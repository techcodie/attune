import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { browserVoiceProvider } from './browserVoice';
import type { SpeakOptions, VoiceProvider } from './VoiceProvider';

interface UseVoiceOptions {
  /** Finalized transcript + recognition confidence (0–1). */
  onFinal: (text: string, confidence: number) => void;
  onError?: (code: string) => void;
}

/**
 * React binding over a VoiceProvider. Owns listening/speaking state and the live
 * partial transcript, and tears the recogniser down on unmount. The provider is
 * swappable (defaults to the free browser one) and never recreated per render.
 */
export function useVoice(
  { onFinal, onError }: UseVoiceOptions,
  provider: VoiceProvider = browserVoiceProvider,
) {
  const [supported] = useState(() => provider.isSupported());
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [partial, setPartial] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const voices = useMemo(() => provider.getVoices(), [provider]);

  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  onFinalRef.current = onFinal;
  onErrorRef.current = onError;

  useEffect(() => {
    return () => {
      provider.stopListening();
      provider.cancelSpeaking();
    };
  }, [provider]);

  const startListening = useCallback(() => {
    if (!supported) return;
    setPartial('');
    setConfidence(null);
    setListening(true);
    provider.startListening({
      onPartial: (text, conf) => {
        setPartial(text);
        if (conf) setConfidence(conf);
      },
      onFinal: (text, conf) => {
        setPartial('');
        setConfidence(conf || null);
        if (text) onFinalRef.current(text, conf);
      },
      onEnd: () => setListening(false),
      onError: (code) => {
        setListening(false);
        onErrorRef.current?.(code);
      },
    });
  }, [provider, supported]);

  const stopListening = useCallback(() => {
    provider.stopListening();
    setListening(false);
  }, [provider]);

  const speak = useCallback(
    async (text: string, opts?: SpeakOptions) => {
      setSpeaking(true);
      await provider.speak(text, opts);
      setSpeaking(false);
    },
    [provider],
  );

  const cancelSpeaking = useCallback(() => {
    provider.cancelSpeaking();
    setSpeaking(false);
  }, [provider]);

  return {
    supported,
    listening,
    speaking,
    partial,
    confidence,
    voices,
    startListening,
    stopListening,
    speak,
    cancelSpeaking,
  };
}
