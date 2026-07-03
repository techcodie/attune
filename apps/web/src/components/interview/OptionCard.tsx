import { motion } from 'framer-motion';

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

/** A selectable card used across the setup wizard (types, personalities). */
export function OptionCard({ icon, title, description, selected, onSelect }: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      aria-pressed={selected}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition
        ${
          selected
            ? 'border-accent/70 bg-accent/10 shadow-glow'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
        }`}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-white">{title}</span>
          {selected && <span className="text-xs font-medium text-accent-400">Selected</span>}
        </span>
        <span className="mt-1 block text-sm text-slate-400">{description}</span>
      </span>
    </motion.button>
  );
}
