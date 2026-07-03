import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PHASES = [
  'Listening…',
  'Analyzing your answer…',
  'Evaluating communication…',
  'Checking topic coverage…',
  'Preparing a follow-up…',
];

/**
 * The interviewer's "thinking" state. Rather than a generic typing dot, it
 * narrates what the engine is actually doing — mirroring the LangGraph pipeline.
 */
export function ThinkingIndicator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % PHASES.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span className="flex gap-1">
        {[0, 1, 2].map((d) => (
          <motion.span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
          />
        ))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
        >
          {PHASES[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
