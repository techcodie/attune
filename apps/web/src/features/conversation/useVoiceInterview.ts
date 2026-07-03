import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterviewRoom } from './useInterviewRoom';
import { useInterview } from '@/features/interview/useInterviews';
import { useVoice } from '@/features/voice/useVoice';
import { useMicLevel } from '@/features/voice/useMicLevel';
import { useVoiceSettings } from '@/features/voice/useVoiceSettings';
import { useElapsed } from '@/hooks/useElapsed';
import { toast } from '@/features/toast/useToastStore';

export type Phase =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'paused'
  | 'finished';

export type Mode = 'text' | 'voice';

const SILENCE_MS = 9000;

/** Friendly, non-fatal messages for recognition failures. */
function recognitionMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. You can switch to text mode any time.';
    case 'no-speech':
      return "I didn't quite catch that — could you repeat?";
    case 'audio-capture':
      return 'No microphone was found. Check your device or use text mode.';
    case 'network':
      return 'Network hiccup during recognition. Give it another try.';
    case 'unsupported':
      return 'Voice isn’t supported in this browser — text mode is ready.';
    default:
      return 'Something interrupted the mic. Tap to try again.';
  }
}

/**
 * The single brain of the interview room. Composes the server-side engine
 * orchestration (useInterviewRoom) with browser voice I/O, the phase state
 * machine, silence handling, the elapsed timer, and lifecycle controls — so the
 * room component stays purely presentational.
 */
export function useVoiceInterview(interviewId: string) {
  const room = useInterviewRoom(interviewId);
  const interview = useInterview(interviewId);
  const { settings, update: updateSettings } = useVoiceSettings();
  const mic = useMicLevel();

  const [mode, setMode] = useState<Mode>('text');
  const [paused, setPaused] = useState(false);
  const [processing, setProcessing] = useState(false);

  const spokenRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const silenceTimer = useRef<number | null>(null);
  const gotSpeechRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});

  const clearSilence = useCallback(() => {
    if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
  }, []);

  const voice = useVoice({
    onFinal: (text) => {
      gotSpeechRef.current = true;
      clearSilence();
      mic.stop();
      setProcessing(true);
      void room.sendAnswer(text).finally(() => setProcessing(false));
    },
    onError: (code) => {
      clearSilence();
      mic.stop();
      toast.error(recognitionMessage(code));
    },
  });

  const startListening = useCallback(() => {
    if (room.finished || room.thinking || paused) return;
    gotSpeechRef.current = false;
    void mic.start();
    voice.startListening();
    clearSilence();
    silenceTimer.current = window.setTimeout(() => {
      if (!gotSpeechRef.current) toast.info('Take your time — I’m still listening.');
    }, SILENCE_MS);
  }, [voice, mic, room.finished, room.thinking, paused, clearSilence]);
  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    clearSilence();
    voice.stopListening();
    mic.stop();
  }, [voice, mic, clearSilence]);

  // Speak each new interviewer message once, then (voice mode) hand the mic back.
  useEffect(() => {
    if (mode !== 'voice' || paused || room.thinking) return;
    const m = room.lastInterviewerMessage;
    if (!m || m.id === spokenRef.current) return;
    spokenRef.current = m.id;
    void voice
      .speak(m.content, { rate: settingsRef.current.rate, voiceURI: settingsRef.current.voiceURI ?? undefined })
      .then(() => {
        if (mode === 'voice' && !paused && !room.finished) startListeningRef.current();
      });
  }, [room.lastInterviewerMessage, room.thinking, room.finished, mode, paused, voice]);

  const switchMode = useCallback(
    (next: Mode) => {
      stopListening();
      voice.cancelSpeaking();
      spokenRef.current = room.lastInterviewerMessage?.id ?? null; // don't auto-speak the current line
      setMode(next);
    },
    [stopListening, voice, room.lastInterviewerMessage],
  );

  const pause = useCallback(() => {
    setPaused(true);
    stopListening();
    voice.cancelSpeaking();
  }, [stopListening, voice]);

  const resume = useCallback(() => setPaused(false), []);

  const replayLast = useCallback(() => {
    const m = room.lastInterviewerMessage;
    if (m)
      void voice.speak(m.content, {
        rate: settingsRef.current.rate,
        voiceURI: settingsRef.current.voiceURI ?? undefined,
      });
  }, [room.lastInterviewerMessage, voice]);

  const restart = useCallback(async () => {
    stopListening();
    voice.cancelSpeaking();
    spokenRef.current = null;
    setPaused(false);
    await room.restart();
  }, [room, stopListening, voice]);

  const phase: Phase = room.finished
    ? 'finished'
    : paused
      ? 'paused'
      : voice.speaking
        ? 'speaking'
        : room.thinking
          ? 'thinking'
          : processing
            ? 'processing'
            : voice.listening
              ? 'listening'
              : 'idle';

  const startedAt = interview.data?.interview.startedAt
    ? Date.parse(interview.data.interview.startedAt)
    : null;
  const elapsedMs = useElapsed(!room.finished && !paused && Boolean(startedAt), startedAt);

  return {
    room,
    interview: interview.data?.interview ?? null,
    phase,
    mode,
    switchMode,
    paused,
    pause,
    resume,
    mic,
    voice,
    settings,
    updateSettings,
    elapsedMs,
    startListening,
    stopListening,
    replayLast,
    sendText: room.sendAnswer,
    endEarly: room.endEarly,
    restart,
  };
}
