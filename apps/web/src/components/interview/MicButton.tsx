import { motion } from 'framer-motion';

interface MicButtonProps {
  listening: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

/**
 * The voice-mode microphone control. A pulsing ring communicates the live
 * listening state. (The premium waveform visualisation lands in M5.)
 */
export function MicButton({ listening, disabled, onStart, onStop }: MicButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={listening ? onStop : onStart}
      aria-pressed={listening}
      aria-label={listening ? 'Stop speaking' : 'Start speaking'}
      className="relative flex h-16 w-16 items-center justify-center rounded-full transition disabled:opacity-40"
    >
      {listening && (
        <>
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/40" />
          <span
            className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/30"
            style={{ animationDelay: '0.6s' }}
          />
        </>
      )}
      <motion.span
        whileTap={{ scale: 0.92 }}
        className={`relative flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-glow ${
          listening ? 'bg-accent text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15'
        }`}
      >
        {listening ? '■' : '🎙️'}
      </motion.span>
    </button>
  );
}
