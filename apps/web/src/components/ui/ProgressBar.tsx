import { motion } from 'framer-motion';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
}

/** Thin gradient progress bar with an animated fill. */
export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-accent to-cyanic"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}
