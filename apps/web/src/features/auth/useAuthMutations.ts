import { useMutation } from '@tanstack/react-query';
import type { AuthResult, LoginInput, RegisterInput } from '@cadence/types';
import { authApi } from './auth.api';
import { useAuthStore } from './useAuthStore';

/** Register → establishes a session on success. */
export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation<AuthResult, Error, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: setSession,
  });
}

/** Login → establishes a session on success. */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation<AuthResult, Error, LoginInput>({
    mutationFn: (input) => authApi.login(input),
    onSuccess: setSession,
  });
}
