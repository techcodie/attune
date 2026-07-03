import { useEffect } from 'react';

export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Binds keyboard shortcuts, keyed by `event.key` (lowercased). Ignores keystrokes
 * while the user is typing in an input/textarea so text mode is never disrupted.
 */
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const fn = map[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map, enabled]);
}
