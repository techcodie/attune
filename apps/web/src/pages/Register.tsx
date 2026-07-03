import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '@cadence/types';
import { AuthShell } from '@/components/AuthShell';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { useZodForm } from '@/hooks/useZodForm';
import { useRegister } from '@/features/auth/useAuthMutations';
import { toast } from '@/features/toast/useToastStore';

export function Register() {
  const navigate = useNavigate();
  const register = useRegister();

  const form = useZodForm({
    schema: registerSchema,
    initial: { fullName: '', email: '', password: '' },
    onSubmit: async (values) => {
      await register.mutateAsync(values);
      toast.success(`Welcome to Cadence, ${values.fullName.split(' ')[0]}!`);
      // New accounts always route into the profile flow next.
      navigate('/profile', { replace: true });
    },
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start practising interviews that actually adapt to you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-400 hover:text-accent-500">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Full name"
          placeholder="Ada Lovelace"
          autoComplete="name"
          value={form.values.fullName}
          onChange={(e) => form.setValue('fullName', e.target.value)}
          error={form.errors.fullName}
        />
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.values.email}
          onChange={(e) => form.setValue('email', e.target.value)}
          error={form.errors.email}
        />
        <PasswordField
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          hint="Use upper & lower case letters and a number."
          value={form.values.password}
          onChange={(e) => form.setValue('password', e.target.value)}
          error={form.errors.password}
        />

        {form.formError && <p className="text-sm text-rose-400">{form.formError}</p>}

        <Button type="submit" fullWidth loading={form.isSubmitting} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
