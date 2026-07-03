import { useCallback, useEffect, useState } from 'react';

export interface VoiceSettings {
  rate: number;
  voiceURI: string | null;
  captionsOn: boolean;
}

const KEY = 'cadence.voice.settings';
const DEFAULTS: VoiceSettings = { rate: 1.02, voiceURI: null, captionsOn: true };

function load(): VoiceSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<VoiceSettings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** User voice preferences (rate, voice, captions), persisted to localStorage. */
export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — settings stay in-memory */
    }
  }, [settings]);

  const update = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, update };
}
