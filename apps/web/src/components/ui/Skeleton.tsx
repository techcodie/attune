interface SkeletonProps {
  className?: string;
}

/** A single shimmering placeholder block. Compose these into loading layouts. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}
