import { motion } from 'framer-motion';

interface WaveformProps {
  /** 0–1 live mic level (used while listening). */
  level: number;
  variant: 'listening' | 'speaking' | 'idle';
}

const BARS = 28;
// Static per-bar shape so the waveform looks organic, not uniform.
const SHAPE = Array.from({ length: BARS }, (_, i) => 0.4 + 0.6 * Math.abs(Math.sin((i / BARS) * Math.PI * 2)));

/**
 * The interview waveform. Driven by the real mic level while listening, and by
 * a synthetic animation while the interviewer speaks (mic is off then).
 */
export function Waveform({ level, variant }: WaveformProps) {
  return (
    <div className="flex h-16 items-center justify-center gap-[3px]" aria-hidden>
      {SHAPE.map((shape, i) => {
        if (variant === 'speaking') {
          const peak = 8 + shape * 34;
          return (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-gradient-to-b from-cyanic to-accent"
              animate={{ height: [8, peak, 8] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: (i % 7) * 0.06 }}
            />
          );
        }
        const height =
          variant === 'listening' ? 6 + level * shape * 52 : 5 + shape * 3;
        return (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-[height] duration-75 ${
              variant === 'listening' ? 'bg-gradient-to-b from-accent to-cyanic' : 'bg-white/15'
            }`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}
