/**
 * Transport-level contracts shared by the API and the web client.
 * Keeping the response envelope here means the frontend's fetch layer and the
 * backend's response helpers are guaranteed to agree.
 */

/** Uniform success envelope. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

/** Uniform error envelope. `code` is a stable machine-readable string. */
export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    /** Field-level validation issues, when applicable. */
    details?: Array<{ path: string; message: string }>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Health ──────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptimeSec: number;
  /** Whether the API could reach Postgres at request time. */
  database: 'up' | 'down' | 'unknown';
  timestamp: string;
}
