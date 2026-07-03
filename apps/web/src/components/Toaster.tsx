import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore, type ToastType } from '@/features/toast/useToastStore';

const ACCENTS: Record<ToastType, { bar: string; icon: string }> = {
  success: { bar: 'bg-emerald-400', icon: '✓' },
  error: { bar: 'bg-rose-500', icon: '!' },
  info: { bar: 'bg-accent', icon: 'i' },
};

/** Fixed, stacked, animated toasts. Mounted once at the app root. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const accent = ACCENTS[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="glass pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl p-3 pl-0"
            >
              <span className={`h-9 w-1 rounded-full ${accent.bar}`} />
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${accent.bar}`}
              >
                {accent.icon}
              </span>
              <p className="flex-1 text-sm text-slate-200">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md px-2 text-slate-500 transition hover:text-slate-200"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
