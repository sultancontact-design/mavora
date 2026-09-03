'use client';

import { cn } from '@/lib/utils';

interface MavoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, wordmark: 16, gap: 6 },
  md: { icon: 36, wordmark: 20, gap: 8 },
  lg: { icon: 52, wordmark: 28, gap: 10 },
};

export default function MavoraLogo({
  size = 'md',
  showWordmark = true,
  className,
}: MavoraLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center', className)} style={{ gap: s.gap }}>
      {/* Geometric M icon — two opposing arrows (supply & demand) */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MAVORA logo"
        className="shrink-0"
      >
        {/* Left stroke of M (pointing down-left — supply arrow) */}
        <path
          d="M8 44V10L18 26"
          stroke="#0E9F6E"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left arrowhead */}
        <path
          d="M14 30L18 26L22 30"
          stroke="#0E9F6E"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right stroke of M (pointing up-right — demand arrow) */}
        <path
          d="M44 8V42L34 26"
          stroke="#0E9F6E"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right arrowhead */}
        <path
          d="M30 22L34 26L38 22"
          stroke="#0E9F6E"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center valley connection */}
        <path
          d="M18 26L26 14L34 26"
          stroke="#102A43"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className="font-bold tracking-tight select-none"
          style={{
            fontSize: s.wordmark,
            color: '#102A43',
            letterSpacing: '-0.02em',
          }}
        >
          MAVORA
        </span>
      )}
    </div>
  );
}
