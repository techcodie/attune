import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
}

/** Compact metric tile for the dashboard stat row. */
export function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}
