import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from './ui/Logo';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Centered glass card used by the Register and Login pages. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <Link to="/" className="inline-flex">
          <Logo />
        </Link>
        <h1 className="mt-8 text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
      </motion.div>
    </div>
  );
}
