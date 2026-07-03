import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useHealth } from '@/hooks/useHealth';
import { StatusPill } from '@/components/StatusPill';

/** A few animated bars that hint at the voice waveform to come in M5. */
function WaveformTeaser() {
  const bars = [14, 26, 40, 30, 52, 34, 22, 44, 30, 18];
  return (
    <div className="flex h-16 items-center justify-center gap-1.5">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-b from-accent to-cyanic"
          initial={{ height: 8 }}
          animate={{ height: [8, h, 8] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

export function Landing() {
  const { data, isLoading, isError } = useHealth();

  const apiState = isLoading ? 'loading' : isError ? 'down' : 'ok';
  const dbState = isLoading
    ? 'loading'
    : data?.database === 'up'
      ? 'ok'
      : data?.database === 'down'
        ? 'degraded'
        : 'down';

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyanic" />
          Voice-first · Adaptive · Explainable
        </span>

        <h1 className="mt-6 bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Attune
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
          An AI mock interview that <span className="text-slate-200">listens, adapts, and pushes back</span> —
          like a real interviewer. Not ChatGPT with a microphone.
        </p>
      </motion.div>

      <motion.div
        className="glass mt-12 w-full max-w-md rounded-3xl p-8"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
      >
        <WaveformTeaser />
        <p className="mt-4 text-sm text-slate-500">System status — proving the stack is live</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <StatusPill label="Web" state="ok" />
          <StatusPill label={`API${data ? ` · ${data.uptimeSec}s` : ''}`} state={apiState} />
          <StatusPill label="Database" state={dbState} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/register" className="btn-primary flex-1">
            Get started
          </Link>
          <Link to="/login" className="btn-ghost flex-1">
            Sign in
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
