import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  InterviewType,
  InterviewerPersonality,
  createInterviewSchema,
  type CandidateProfileDto,
  type CreateInterviewInput,
  type Difficulty,
} from '@cadence/types';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TagInput } from '@/components/ui/TagInput';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { OptionCard } from '@/components/interview/OptionCard';
import { Stepper } from '@/components/interview/Stepper';
import { DifficultySelector } from '@/components/interview/DifficultySelector';
import { DurationSelector } from '@/components/interview/DurationSelector';
import {
  DIFFICULTY_META,
  DURATION_META,
  INTERVIEW_TYPE_META,
  PERSONALITY_META,
} from '@/features/interview/options';
import { useProfileQuery } from '@/features/profile/useProfile';
import { useCreateInterview } from '@/features/interview/useInterviews';
import { toast } from '@/features/toast/useToastStore';

const STEPS = ['Format', 'Interviewer', 'Focus', 'Review'] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish (future)' },
  { value: 'fr', label: 'French (future)' },
  { value: 'de', label: 'German (future)' },
  { value: 'hi', label: 'Hindi (future)' },
];

const VOICE_OPTIONS = [
  { value: 'default', label: 'Default (balanced)' },
  { value: 'warm', label: 'Warm (future)' },
  { value: 'crisp', label: 'Crisp (future)' },
];

const metaLabel = <T extends string | number>(
  list: readonly { value: T; label: string }[],
  value: T,
): string => list.find((m) => m.value === value)?.label ?? String(value);

function Wizard({ profile }: { profile: CandidateProfileDto | null }) {
  const navigate = useNavigate();
  const create = useCreateInterview();
  const [step, setStep] = useState(0);

  // Seed the draft from the candidate's profile — sensible, editable defaults.
  const [draft, setDraft] = useState<CreateInterviewInput>({
    interviewType: profile?.preferredType ?? InterviewType.BEHAVIORAL,
    interviewerPersonality: InterviewerPersonality.NEUTRAL_PROFESSIONAL,
    targetRole: profile?.targetRole ?? '',
    difficulty: 3,
    durationMinutes: 30,
    focusSkills: profile?.focusSkills ?? [],
    preferredLanguage: 'en',
    voicePreference: 'default',
  });

  const set = <K extends keyof CreateInterviewInput>(key: K, value: CreateInterviewInput[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canAdvance = useMemo(() => {
    if (step === 0) return draft.targetRole.trim().length >= 2;
    return true;
  }, [step, draft.targetRole]);

  const submit = async () => {
    const parsed = createInterviewSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Please review your configuration');
      return;
    }
    try {
      const detail = await create.mutateAsync(parsed.data);
      toast.success('Interview ready.');
      navigate(`/interviews/${detail.interview.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create interview');
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-500 transition hover:text-slate-300"
        >
          Cancel
        </button>
      </div>

      <div className="glass rounded-3xl p-8">
        <Stepper steps={STEPS} current={step} />

        <div className="mt-8 min-h-[22rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">What are we practising?</h2>
                    <p className="mt-1 text-sm text-slate-400">Pick a format and the role you’re targeting.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {INTERVIEW_TYPE_META.map((t) => (
                      <OptionCard
                        key={t.value}
                        icon={t.icon}
                        title={t.label}
                        description={t.description}
                        selected={draft.interviewType === t.value}
                        onSelect={() => set('interviewType', t.value)}
                      />
                    ))}
                  </div>
                  <TextField
                    label="Target role"
                    placeholder="Senior Backend Engineer"
                    value={draft.targetRole}
                    onChange={(e) => set('targetRole', e.target.value)}
                  />
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Who’s interviewing you?</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Personality sets the tone; difficulty and length set the pressure.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PERSONALITY_META.map((p) => (
                      <OptionCard
                        key={p.value}
                        icon={p.icon}
                        title={p.label}
                        description={p.description}
                        selected={draft.interviewerPersonality === p.value}
                        onSelect={() => set('interviewerPersonality', p.value)}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-300">Difficulty</p>
                    <DifficultySelector
                      value={draft.difficulty as Difficulty}
                      onChange={(v) => set('difficulty', v)}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-300">Duration</p>
                    <DurationSelector
                      value={draft.durationMinutes}
                      onChange={(v) => set('durationMinutes', v)}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Dial in the focus</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      These skills become required topics the interviewer will steer toward.
                    </p>
                  </div>
                  <TagInput
                    label="Focus skills"
                    value={draft.focusSkills}
                    onChange={(next) => set('focusSkills', next)}
                    hint="Topics to be tested on"
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Select
                      label="Language"
                      options={LANGUAGE_OPTIONS}
                      value={draft.preferredLanguage}
                      onChange={(e) => set('preferredLanguage', e.target.value)}
                      hint="Voice interviews arrive in M4"
                    />
                    <Select
                      label="Voice"
                      options={VOICE_OPTIONS}
                      value={draft.voicePreference ?? 'default'}
                      onChange={(e) => set('voicePreference', e.target.value)}
                      hint="Preview in M4"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Review &amp; start</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      We’ll initialise the interview state and seed topic coverage from this.
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    {[
                      { k: 'Format', v: metaLabel(INTERVIEW_TYPE_META, draft.interviewType) },
                      { k: 'Target role', v: draft.targetRole },
                      { k: 'Interviewer', v: metaLabel(PERSONALITY_META, draft.interviewerPersonality) },
                      {
                        k: 'Difficulty',
                        v: `${draft.difficulty} · ${metaLabel(DIFFICULTY_META, draft.difficulty as Difficulty)}`,
                      },
                      { k: 'Duration', v: metaLabel(DURATION_META, draft.durationMinutes) },
                      { k: 'Language', v: metaLabel(LANGUAGE_OPTIONS, draft.preferredLanguage) },
                    ].map((row) => (
                      <div key={row.k}>
                        <dt className="text-xs text-slate-500">{row.k}</dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-200">{row.v}</dd>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <dt className="text-xs text-slate-500">Focus skills</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-2">
                        {draft.focusSkills.length ? (
                          draft.focusSkills.map((s) => (
                            <span key={s} className="rounded-lg bg-accent/15 px-2.5 py-1 text-xs text-accent-400">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">None — the format’s core topics apply</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {isLast ? (
            <Button onClick={submit} loading={create.isPending}>
              Start interview
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewInterview() {
  const { data, isLoading } = useProfileQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-[32rem] rounded-3xl" />
      </div>
    );
  }
  return <Wizard profile={data ?? null} />;
}
