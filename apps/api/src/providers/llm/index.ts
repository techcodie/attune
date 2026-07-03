import { env, isProd } from '../../env.js';
import { logger } from '../../lib/logger.js';
import type { LLMProvider } from './types.js';
import { GroqProvider } from './groq.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { MockProvider } from './mock.provider.js';

export type { LLMProvider } from './types.js';

let cached: LLMProvider | null = null;

/**
 * Resolve the active LLM provider from the environment. This factory is the
 * ONLY place that knows the concrete providers exist — the rest of the app
 * depends solely on the `LLMProvider` interface.
 *
 * Groq is the functional default. If it's selected without a key we fall back
 * to the deterministic mock so local dev and CI never hard-fail.
 */
export function getLLMProvider(): LLMProvider {
  if (cached) return cached;

  switch (env.LLM_PROVIDER) {
    case 'groq': {
      if (!env.GROQ_API_KEY) {
        // In production a missing key is a misconfiguration — fail loudly rather
        // than silently degrading to the mock. In dev, fall back so the app runs.
        if (isProd) {
          throw new Error('LLM_PROVIDER=groq requires GROQ_API_KEY in production.');
        }
        logger.warn('LLM_PROVIDER=groq but GROQ_API_KEY is missing — using mock provider (dev only).');
        cached = new MockProvider();
      } else {
        cached = new GroqProvider(env.GROQ_API_KEY, env.LLM_MODEL);
      }
      break;
    }
    case 'gemini':
      cached = new GeminiProvider(env.GEMINI_API_KEY ?? '', env.LLM_MODEL);
      break;
    case 'openai':
      cached = new OpenAIProvider(env.OPENAI_API_KEY ?? '', env.LLM_MODEL);
      break;
    case 'mock':
      cached = new MockProvider();
      break;
  }

  logger.info(`LLM provider ready: ${cached.name}`, { model: env.LLM_MODEL });
  return cached;
}

/** Test seam: override the cached provider (used by node/engine tests). */
export function __setLLMProvider(provider: LLMProvider | null): void {
  cached = provider;
}
