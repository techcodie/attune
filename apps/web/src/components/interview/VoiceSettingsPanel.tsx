import { Slider } from '@/components/ui/Slider';
import type { VoiceOption } from '@/features/voice/VoiceProvider';
import type { VoiceSettings } from '@/features/voice/useVoiceSettings';

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  onChange: (patch: Partial<VoiceSettings>) => void;
  voices: VoiceOption[];
  onReplay: () => void;
}

/** Accessibility + voice controls: captions, speech rate, voice, replay. */
export function VoiceSettingsPanel({ settings, onChange, voices, onReplay }: VoiceSettingsPanelProps) {
  return (
    <div className="flex w-72 flex-col gap-4">
      <label className="flex items-center justify-between text-sm text-slate-300">
        Captions
        <button
          role="switch"
          aria-checked={settings.captionsOn}
          onClick={() => onChange({ captionsOn: !settings.captionsOn })}
          className={`relative h-5 w-9 rounded-full transition ${settings.captionsOn ? 'bg-accent' : 'bg-white/15'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
              settings.captionsOn ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </label>

      <Slider
        label="Speech rate"
        min={0.6}
        max={1.6}
        step={0.05}
        value={settings.rate}
        onChange={(rate) => onChange({ rate })}
        format={(v) => `${v.toFixed(2)}×`}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300" htmlFor="voice-select">
          Voice
        </label>
        <select
          id="voice-select"
          value={settings.voiceURI ?? ''}
          onChange={(e) => onChange({ voiceURI: e.target.value || null })}
          className="w-full rounded-xl border border-white/10 bg-ink-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <option value="">System default</option>
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <button onClick={onReplay} className="btn-ghost w-full text-sm">
        ↻ Replay last response
      </button>
    </div>
  );
}
