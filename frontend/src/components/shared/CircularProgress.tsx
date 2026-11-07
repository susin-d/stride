import React from 'react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showText?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 48,
  strokeWidth = 4,
  color,
  trackColor,
  showText = false,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor || 'currentColor'}
          strokeWidth={strokeWidth}
          fill="none"
          className={!trackColor ? 'text-neutral-200 dark:text-neutral-800' : ''}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || 'currentColor'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${!color ? 'text-neutral-900 dark:text-neutral-100' : ''}`}
        />
      </svg>
      {showText && (
        <span className="absolute text-[11px] font-semibold text-primary dark:text-neutral-100">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
};
