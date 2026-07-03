import type { AuthResult, AuthUser, LoginInput, RegisterInput } from '@cadence/types';
import { api } from '@/lib/api';

/** Thin, typed wrappers around the auth endpoints. */
export const authApi = {
  register: (input: RegisterInput) => api.post<AuthResult>('/auth/register', input),
  login: (input: LoginInput) => api.post<AuthResult>('/auth/login', input),
  me: () => api.get<AuthUser>('/auth/me'),
  logout: () => api.post<{ success: boolean }>('/auth/logout'),
  /**
   * Exchange the refresh cookie for a new access token. `skipAuthRefresh`
   * stops the client from trying to refresh *this* call if it 401s.
   */
  refresh: () => api.post<AuthResult>('/auth/refresh', undefined, { skipAuthRefresh: true }),
};
