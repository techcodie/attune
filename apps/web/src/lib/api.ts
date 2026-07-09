import type { ApiResponse } from '@cadence/types';

// When VITE_API_URL is unset/empty we use same-origin relative calls so the app
// works behind a reverse proxy (the Vercel rewrite forwards /api → the backend),
// which avoids CORS and cross-origin caching issues. Dev sets VITE_API_URL to the
// local API. Trailing slashes are trimmed so `${BASE}/api/v1` never doubles up.
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API = `${BASE_URL}/api/v1`;

/** Thrown on any non-ok API response; carries the stable server error code. */
export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Access token lives in memory only (never localStorage) so it isn't readable
 * by XSS. The long-lived refresh token is an httpOnly cookie the browser sends
 * automatically. On a cold load, `bootstrap()` trades that cookie for a token.
 */
let accessToken: string | null = null;
export const tokenStore = {
  get: (): string | null => accessToken,
  set: (t: string | null): void => {
    accessToken = t;
  },
};

/**
 * A refresh handler registered by the auth store. Keeping it as a callback
 * breaks what would otherwise be a store → api → store import cycle.
 */
type RefreshHandler = () => Promise<boolean>;
let refreshHandler: RefreshHandler | null = null;
export function registerRefreshHandler(fn: RefreshHandler): void {
  refreshHandler = fn;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Internal: prevents infinite refresh loops. */
  _retry?: boolean;
  /** Skip the automatic refresh-on-401 (used by the refresh call itself). */
  skipAuthRefresh?: boolean;
  /**
   * Per-request abort timeout. Defaults to {@link REQUEST_TIMEOUT_MS}. Cold-start
   * calls (health probe, demo login) raise this so they survive the free-tier
   * backend waking up (~50s) instead of aborting and reporting the API as down.
   */
  timeoutMs?: number;
}

/** Requests abort after this long so a hung network never freezes the UI. */
const REQUEST_TIMEOUT_MS = 45_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, _retry, skipAuthRefresh, headers, timeoutMs, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...rest,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    // Distinguish an abort (timeout) from a genuine network failure.
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError('TIMEOUT', 'The request timed out. Please try again.', 0);
    }
    throw new ApiClientError('NETWORK', 'Network error — check your connection and try again.', 0);
  } finally {
    clearTimeout(timeout);
  }

  // 204 / empty body
  if (res.status === 204) return undefined as T;

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError('BAD_RESPONSE', `Unexpected response (${res.status})`, res.status);
  }

  if (payload.ok) return payload.data;

  // Access token expired → try one transparent refresh, then replay the request.
  if (
    res.status === 401 &&
    !skipAuthRefresh &&
    !_retry &&
    refreshHandler &&
    (await refreshHandler())
  ) {
    return request<T>(path, { ...options, _retry: true });
  }

  throw new ApiClientError(payload.error.code, payload.error.message, res.status);
}

/** Typed verb helpers — every feature module builds on these. */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
