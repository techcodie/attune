import { isProd } from '../env.js';

/**
 * A tiny dependency-free structured logger.
 * - In production it emits single-line JSON (friendly to log aggregators).
 * - In development it prints compact, coloured, human-readable lines.
 *
 * Deliberately small: we don't need pino's throughput here, and one file we
 * fully understand beats a dependency we half-configure.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: number = isProd ? LEVEL_ORDER.info : LEVEL_ORDER.debug;

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

function emit(level: Level, message: string, context?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;
  const time = new Date().toISOString();

  if (isProd) {
    process.stdout.write(JSON.stringify({ time, level, message, ...context }) + '\n');
    return;
  }

  const tag = `${COLORS[level]}${level.toUpperCase().padEnd(5)}${RESET}`;
  const ctx = context && Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
  process.stdout.write(`${tag} ${message}${ctx}\n`);
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
};
