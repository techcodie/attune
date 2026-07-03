import { create } from 'zustand';

/**
 * Global UI-only state. Server/interview state lives in TanStack Query and the
 * (later) interview store; this holds ephemeral view concerns.
 */
interface UiState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
}));
