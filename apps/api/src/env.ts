import 'dotenv/config';
import { z } from 'zod';

/**
 * Fail fast on misconfiguration. If the environment is invalid we crash at
 * boot with a readable report rather than throwing a cryptic error deep inside
 * a request handler three weeks later.
 *
 * Secrets that are only needed by later milestones are optional now and will be
 * tightened (e.g. `.min(32)` becomes required) when those milestones land.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    // Split on commas, trim whitespace, and strip any trailing slash — browser
    // Origin headers never include one, so a stray slash in the env value would
    // otherwise silently break CORS.
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().url().optional(),

  // M1 — auth. Secrets must be long enough to be meaningful; generate with
  // `openssl rand -base64 48`.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be ≥ 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be ≥ 32 chars'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /** Optional cookie domain for prod (e.g. .cadence.app). */
  COOKIE_DOMAIN: z.string().optional(),

  // M3 — LLM provider (provider-agnostic; nothing else in the app names Groq).
  LLM_PROVIDER: z.enum(['groq', 'gemini', 'openai', 'mock']).default('groq'),
  LLM_MODEL: z.string().default('llama-3.3-70b-versatile'),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // M4
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_AGENT_ID: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n✗ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
