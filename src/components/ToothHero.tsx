export function ToothHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 28" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="th-body" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.55" stopColor="#DCEEFA" /><stop offset="1" stopColor="#7FC4EC" />
        </linearGradient>
        <filter id="th-blur"><feGaussianBlur stdDeviation="0.7" /></filter>
      </defs>
      <ellipse cx="12" cy="24.5" rx="6" ry="0.9" fill="#0EA5E9" opacity="0.35" filter="url(#th-blur)" />
      <path d="M12 3c-1.7 0-2.8 1-4 1-1.9 0-3.5 1.6-3.5 4 0 1.6.4 2.7.8 4.2.4 1.5.7 3.3 1.1 5.1.3 1.4.8 2.7 1.9 2.7.9 0 1-2.1 1.2-3.4.2-1.1.6-2 1.5-2s1.3.9 1.5 2c.2 1.3.3 3.4 1.2 3.4 1.1 0 1.6-1.3 1.9-2.7.4-1.8.7-3.6 1.1-5.1.4-1.5.8-2.6.8-4.2 0-2.4-1.6-4-3.5-4-1.2 0-2.3-1-4-1Z" fill="url(#th-body)" />
      <path d="M7.2 6.2c.5-1 1.5-1.5 2.6-1.4" fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}
