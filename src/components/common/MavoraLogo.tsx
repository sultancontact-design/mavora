'use client';

import { cn } from '@/lib/utils';

export interface MavoraLogoProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show the wordmark text */
  showWordmark?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Icon color (defaults to emerald for icon, navy for text) */
  iconColor?: string;
  /** Text/wordmark color */
  textColor?: string;
}

const sizeConfig = {
  xs: { icon: 24, wordmark: 12, gap: 5, strokeWidth: 2.5 },
  sm: { icon: 32, wordmark: 14, gap: 6, strokeWidth: 3 },
  md: { icon: 40, wordmark: 18, gap: 8, strokeWidth: 3 },
  lg: { icon: 52, wordmark: 24, gap: 10, strokeWidth: 3.5 },
  xl: { icon: 64, wordmark: 30, gap: 12, strokeWidth: 4 },
};

/**
 * MavoraLogo - Geometric M logo with opposing arrows (supply & demand)
 * 
 * The logo represents the marketplace concept:
 * - Left arrow pointing down = Supply
 * - Right arrow pointing up = Demand  
 * - Together they form an "M" shape
 * - Center connection represents the exchange/marketplace
 */
export default function MavoraLogo({
  size = 'md',
  showWordmark = true,
  className,
  iconColor,
  textColor,
}: MavoraLogoProps) {
  const config = sizeConfig[size];
  
  // Default colors based on brand
  const iconStroke = iconColor || 'currentColor';
  const textFill = textColor || 'currentColor';

  return (
    <div 
      className={cn('flex items-center font-bold', className)}
      style={{ gap: `${config.gap}px` }}
      role="img"
      aria-label="MAVORA"
    >
      {/* Geometric M Icon - Two Opposing Arrows */}
      <svg
        width={config.icon}
        height={config.icon}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* 
          Logo Geometry:
          The "M" is formed by two arrows:
          - Left stroke goes from top-left down to center (supply arrow ↓)
          - Right stroke goes from bottom-right up to center (demand arrow ↑)
          - They meet at the center valley point
        */}
        
        {/* Left stroke of M (supply arrow - pointing down) */}
        <path
          d="M10 8L10 38L20 24"
          stroke={iconStroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald"
        />
        
        {/* Left arrowhead (downward) */}
        <path
          d="M15 33L20 24L25 33"
          stroke={iconStroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald"
        />
        
        {/* Right stroke of M (demand arrow - pointing up) */}
        <path
          d="M42 44L42 14L32 28"
          stroke={iconStroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald"
        />
        
        {/* Right arrowhead (upward) */}
        <path
          d="M37 19L32 28L27 19"
          stroke={iconStroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald"
        />
        
        {/* Center valley connection - forms the M middle */}
        <path
          d="M20 24L26 14L32 28"
          stroke={iconStroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        />
      </svg>

      {/* Wordmark Text */}
      {showWordmark && (
        <span
          className="select-none tracking-tight font-extrabold"
          style={{
            fontSize: `${config.wordmark}px`,
            color: textFill,
            letterSpacing: '-0.02em',
          }}
        >
          MAVORA
        </span>
      )}
    </div>
  );
}

/**
 * IconOnlyLogo - Just the geometric M without text
 * Useful for favicons, app icons, small spaces
 */
export function IconOnlyLogo({ 
  size = 'md', 
  className,
  color 
}: Omit<MavoraLogoProps, 'showWordmark'>) {
  return (
    <MavoraLogo 
      size={size} 
      showWordmark={false} 
      className={className}
      iconColor={color}
    />
  );
}

/**
 * WordmarkOnly - Just the text without icon
 */
export function WordmarkOnly({ 
  size = 'md', 
  className,
  color 
}: Omit<MavoraLogoProps, 'showWordmark'>) {
  const config = sizeConfig[size];
  
  return (
    <span
      className={cn('select-none tracking-tight font-extrabold', className)}
      style={{
        fontSize: `${config.wordmark}px`,
        color: color || 'currentColor',
        letterSpacing: '-0.02em',
      }}
      role="img"
      aria-label="MAVORA"
    >
      MAVORA
    </span>
  );
}

export type { MavoraLogoProps };
