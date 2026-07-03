import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ExperienceLevel,
  InterviewType,
  profileSchema,
  type CandidateProfileDto,
  type ProfileInput,
} from '@cadence/types';
import { Logo } from '@/components/ui/Logo';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useZodForm } from '@/hooks/useZodForm';
import { toast } from '@/features/toast/useToastStore';
import { useProfileQuery, useSaveProfile } from '@/features/profile/useProfile';
import { EXPERIENCE_LEVEL_OPTIONS, INTERVIEW_TYPE_OPTIONS } from '@/features/profile/options';

function initialValues(existing: CandidateProfileDto | null): ProfileInput {
  return {
    targetRole: existing?.targetRole ?? '',
    experienceLevel: existing?.experienceLevel ?? ExperienceLevel.MID,
    yearsExperience: existing?.yearsExperience ?? 0,
    preferredType: existing?.preferredType ?? InterviewType.BEHAVIORAL,
    focusSkills: existing?.focusSkills ?? [],
    careerGoal: existing?.careerGoal ?? '',
  };
}

/** The actual form — mounted only once we know whether a profile exists, so
 *  the initial values are correct for both first-time and edit flows. */
function ProfileForm({ existing }: { existing: CandidateProfileDto | null }) {
  const navigate = useNavigate();
  const save = useSaveProfile();
  const isEditing = existing !== null;

  const form = useZodForm({
    schema: profileSchema,
    initial: initialValues(existing),
    onSubmit: async (values) => {
      await save.mutateAsync(values);
      toast.success(isEditing ? 'Profile updated.' : 'Profile complete — you’re all set!');
      navigate('/dashboard', { replace: true });
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Target job role"
        placeholder="Senior Backend Engineer"
        value={form.values.targetRole}
        onChange={(e) => form.setValue('targetRole', e.target.value)}
        error={form.errors.targetRole}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Experience level"
          options={EXPERIENCE_LEVEL_OPTIONS}
          value={form.values.experienceLevel}
          onChange={(e) =>
            form.setValue('experienceLevel', e.target.value as ProfileInput['experienceLevel'])
          }
          error={form.errors.experienceLevel}
        />
        <TextField
          label="Years of experience"
          type="number"
          min={0}
          max={60}
          value={String(form.values.yearsExperience)}
          onChange={(e) => form.setValue('yearsExperience', Number(e.target.value))}
          error={form.errors.yearsExperience}
        />
      </div>

      <Select
        label="Preferred interview type"
        options={INTERVIEW_TYPE_OPTIONS}
        value={form.values.preferredType}
        onChange={(e) =>
          form.setValue('preferredType', e.target.value as ProfileInput['preferredType'])
        }
        error={form.errors.preferredType}
        hint="You can always pick a different type when starting an interview."
      />

      <TagInput
        label="Focus skills"
        value={form.values.focusSkills}
        onChange={(next) => form.setValue('focusSkills', next)}
        error={form.errors.focusSkills}
        hint="The topics you want to be tested on"
      />

      <TextArea
        label="Career goal (optional)"
        rows={3}
        placeholder="e.g. Break into a staff-level role at a product company within a year."
        value={form.values.careerGoal ?? ''}
        onChange={(e) => form.setValue('careerGoal', e.target.value)}
        error={form.errors.careerGoal}
      />

      {form.formError && <p className="text-sm text-rose-400">{form.formError}</p>}

      <div className="flex items-center justify-between pt-2">
        {isEditing ? (
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
        ) : (
          <span className="text-xs text-slate-500">This seeds every interview you start.</span>
        )}
        <Button type="submit" loading={form.isSubmitting}>
          {isEditing ? 'Save changes' : 'Complete profile'}
        </Button>
      </div>
    </form>
  );
}

export function CompleteProfile() {
  const { data, isLoading } = useProfileQuery();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass rounded-3xl p-8"
      >
        <Logo />
        <h1 className="mt-8 text-2xl font-bold text-white">
          {data ? 'Edit your profile' : 'Tell us about you'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          This initialises how the interviewer calibrates difficulty and picks topics.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <ProfileForm existing={data ?? null} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
