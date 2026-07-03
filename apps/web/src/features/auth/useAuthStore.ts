import { create } from 'zustand';
import type { AuthResult, AuthUser } from '@cadence/types';
import { registerRefreshHandler, tokenStore } from '@/lib/api';
import { authApi } from './auth.api';

/**
 * `idle`    — before the first bootstrap attempt.
 * `loading` — bootstrapping (trading the refresh cookie for a token).
 * Route guards wait out these two so there's no auth "flash".
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (result: AuthResult) => void;
  patchUser: (patch: Partial<AuthUser>) => void;
  clear: () => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  setSession: (result) => {
    tokenStore.set(result.accessToken);
    set({ user: result.user, status: 'authenticated' });
  },

  patchUser: (patch) => {
    const user = get().user;
    if (user) set({ user: { ...user, ...patch } });
  },

  clear: () => {
    tokenStore.set(null);
    set({ user: null, status: 'unauthenticated' });
  },

  /** On cold load, try to restore a session from the httpOnly refresh cookie. */
  bootstrap: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const result = await authApi.refresh();
      get().setSession(result);
    } catch {
      get().clear();
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clear();
    }
  },
}));

/**
 * Register the transparent-refresh handler the API client calls on a 401.
 * Returns whether a valid session was restored.
 */
registerRefreshHandler(async () => {
  try {
    const result = await authApi.refresh();
    useAuthStore.getState().setSession(result);
    return true;
  } catch {
    useAuthStore.getState().clear();
    return false;
  }
});
