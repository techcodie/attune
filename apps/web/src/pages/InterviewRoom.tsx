import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { InterviewStatus } from '@cadence/types';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Transcript } from '@/components/interview/Transcript';
import { Waveform } from '@/components/interview/Waveform';
import { MicButton } from '@/components/interview/MicButton';
import { PhaseBadge } from '@/components/interview/PhaseBadge';
import { LiveStatusPanel } from '@/components/interview/LiveStatusPanel';
import { DebugPanel } from '@/components/interview/DebugPanel';
import { InterviewControls } from '@/components/interview/InterviewControls';
import { VoiceSettingsPanel } from '@/components/interview/VoiceSettingsPanel';
import { useVoiceInterview, type Mode } from '@/features/conversation/useVoiceInterview';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const DEBUG = import.meta.env.VITE_DEBUG_AI === 'true';

export function InterviewRoom() {
  const { id = '' } = useParams();
  const vi = useVoiceInterview(id);
  const { room, voice, mic } = vi;
  const [draft, setDraft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const submitText = () => {
    if (!draft.trim()) return;
    void vi.sendText(draft);
    setDraft('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitText();
    }
  };

  const shortcuts = useMemo(
    () => ({
      m: () => {
        if (vi.mode !== 'voice' || vi.paused) return;
        voice.listening ? vi.stopListening() : vi.startListening();
      },
      p: () => (vi.paused ? vi.resume() : vi.pause()),
      r: () => vi.replayLast(),
    }),
    [vi, voice.listening],
  );
  useKeyboardShortcuts(shortcuts, !room.finished);

  const disabled = room.thinking || room.finished || vi.paused;
  const status: InterviewStatus = room.finished
    ? InterviewStatus.COMPLETED
    : (vi.interview?.status ?? InterviewStatus.IN_PROGRESS);
  const difficulty = room.lastTurn?.decision?.difficulty ?? vi.interview?.difficulty ?? 3;
  const micDenied = mic.permission === 'denied' || mic.permission === 'unsupported';

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/interviews/${id}`}>
            <Logo withWordmark={false} />
          </Link>
          <div>
            <p className="text-sm font-semibold text-white">
              {vi.interview?.targetRole ?? 'Interview'}
            </p>
            <p className="text-xs text-slate-500">
              {room.state ? room.state.currentStage.replaceAll('_', ' ').toLowerCase() : 'loading…'}
            </p>
          </div>
          <PhaseBadge phase={vi.phase} />
        </div>

        <div className="flex items-center gap-3">
          <InterviewControls
            paused={vi.paused}
            finished={room.finished}
            onPause={vi.pause}
            onResume={vi.resume}
            onEnd={vi.endEarly}
            onRestart={vi.restart}
          />
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((s) => !s)}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
              aria-label="Voice settings"
            >
              ⚙
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="glass absolute right-0 z-20 mt-2 rounded-2xl p-5"
                >
                  <VoiceSettingsPanel
                    settings={vi.settings}
                    onChange={vi.updateSettings}
                    voices={voice.voices}
                    onReplay={vi.replayLast}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Mode toggle — both modes drive the exact same engine. */}
          <div className="flex rounded-xl border border-white/10 p-1">
            {(['text', 'voice'] as const).map((m: Mode) => (
              <button
                key={m}
                onClick={() => vi.switchMode(m)}
                disabled={m === 'voice' && !voice.supported}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition disabled:opacity-40 ${
                  vi.mode === m ? 'bg-accent text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={m === 'voice' && !voice.supported ? 'Voice not supported in this browser' : ''}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={`mt-6 grid flex-1 gap-6 ${DEBUG ? 'lg:grid-cols-[1fr_18rem_18rem]' : 'lg:grid-cols-[1fr_18rem]'}`}>
        <div className="flex min-h-[62vh] flex-col">
          <div className="glass relative flex-1 overflow-y-auto rounded-2xl p-6">
            {room.isLoading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-16 w-2/3" />
                <Skeleton className="h-12 w-1/2 self-end" />
              </div>
            ) : (
              <Transcript
                messages={room.messages}
                thinking={room.thinking}
                partial={vi.settings.captionsOn ? voice.partial : ''}
              />
            )}

            {vi.paused && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-950/70 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Paused</p>
                  <Button className="mt-4" onClick={vi.resume}>
                    Resume interview
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Input dock */}
          <div className="mt-4">
            {room.finished ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
              >
                <p className="text-lg font-semibold text-white">Interview complete 🎉</p>
                <p className="text-sm text-slate-400">Here’s your interviewer evaluation.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={vi.restart} className="btn-ghost">
                    Restart
                  </button>
                  <Link to={`/interviews/${id}/report`} className="btn-primary">
                    View report
                  </Link>
                </div>
              </motion.div>
            ) : vi.mode === 'text' ? (
              <div className="glass flex items-end gap-3 rounded-2xl p-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={disabled}
                  rows={2}
                  placeholder="Type your answer… (Enter to send, Shift+Enter for a new line)"
                  className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
                />
                <Button onClick={submitText} disabled={disabled || !draft.trim()} loading={room.thinking}>
                  Send
                </Button>
              </div>
            ) : (
              <div className="glass flex flex-col items-center gap-3 rounded-2xl p-6">
                <Waveform
                  level={mic.level}
                  variant={voice.speaking ? 'speaking' : voice.listening ? 'listening' : 'idle'}
                />
                <MicButton
                  listening={voice.listening}
                  disabled={disabled || voice.speaking}
                  onStart={vi.startListening}
                  onStop={vi.stopListening}
                />
                <p className="text-xs text-slate-500">
                  {voice.speaking
                    ? 'Interviewer is speaking…'
                    : voice.listening
                      ? `Listening${voice.confidence ? ` · ${Math.round(voice.confidence * 100)}% confident` : ''} — tap to stop`
                      : 'Tap the mic (or press M) and answer out loud'}
                </p>
                {micDenied && (
                  <p className="text-xs text-amber-300">
                    Microphone unavailable — text mode is ready anytime.
                  </p>
                )}
              </div>
            )}
            <p className="mt-2 text-center text-[11px] text-slate-600">
              Shortcuts: <kbd>M</kbd> mic · <kbd>P</kbd> pause · <kbd>R</kbd> replay
            </p>
          </div>
        </div>

        {/* Live HUD */}
        <LiveStatusPanel
          state={room.state}
          coverage={room.coverage}
          elapsedMs={vi.elapsedMs}
          difficulty={difficulty}
          status={status}
        />

        {DEBUG && <DebugPanel state={room.state} coverage={room.coverage} lastTurn={room.lastTurn} />}
      </div>
    </div>
  );
}
