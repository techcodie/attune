import { useCallback, useEffect, useRef, useState } from 'react';

export type MicPermission = 'unknown' | 'granted' | 'denied' | 'unsupported';

/**
 * Samples the microphone's audio level (0–1) via the Web Audio API to drive the
 * waveform. Independent of speech recognition, and fully graceful — if mic
 * access is denied or unavailable the level simply stays at 0 and the UI falls
 * back to a synthetic animation.
 */
export function useMicLevel() {
  const [level, setLevel] = useState(0);
  const [permission, setPermission] = useState<MicPermission>('unknown');
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastEmitRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      return;
    }
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission('granted');

      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i]! - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        // Throttle React updates to ~20fps to avoid needless re-renders.
        const now = performance.now();
        if (now - lastEmitRef.current > 50) {
          lastEmitRef.current = now;
          setLevel(Math.min(1, rms * 2.2)); // gentle boost so speech reads clearly
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { level, permission, start, stop };
}
