interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

/** The Attune mark — an equaliser motif — optionally with the wordmark. */
export function Logo({ className = '', withWordmark = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c6cff" />
            <stop offset="1" stopColor="#37e6d0" />
          </linearGradient>
        </defs>
        <g fill="url(#logo-g)">
          <rect x="4" y="13" width="3.2" height="6" rx="1.6" />
          <rect x="10" y="9" width="3.2" height="14" rx="1.6" />
          <rect x="16" y="5" width="3.2" height="22" rx="1.6" />
          <rect x="22" y="11" width="3.2" height="10" rx="1.6" />
        </g>
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-white">Attune</span>
      )}
    </div>
  );
}
