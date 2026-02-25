'use client';

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  /** Progress value 0-100 */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom color for the progress ring */
  color?: string;
  /** Background ring color */
  trackColor?: string;
  /** Show percentage text */
  showValue?: boolean;
  /** Label to show inside ring (e.g., "T" for tasks, "C" for checklist) */
  label?: string;
  /** Additional className */
  className?: string;
}

/**
 * Circular progress ring using SVG stroke-dasharray
 */
export function CircularProgress({
  value,
  size = 32,
  strokeWidth = 3,
  color = 'var(--primary)',
  trackColor = 'var(--muted)',
  showValue = false,
  label,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <span
          className="absolute text-[10px] font-medium text-[var(--foreground)]"
          style={{ fontSize: size * 0.28 }}
        >
          {Math.round(value)}%
        </span>
      )}
      {label && (
        <span
          className="absolute font-bold text-[8px]"
          style={{ fontSize: size * 0.35, color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface DualCircularProgressProps {
  /** Task progress value 0-100 */
  tasksValue: number;
  /** Checklist progress value 0-100 */
  checklistValue: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom colors */
  tasksColor?: string;
  checklistColor?: string;
  /** Background ring color */
  trackColor?: string;
  /** Show percentage text */
  showValue?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Dual circular progress rings - outer for tasks, inner for checklist
 */
export function DualCircularProgress({
  tasksValue,
  checklistValue,
  size = 36,
  strokeWidth = 3,
  tasksColor = 'var(--primary)',
  checklistColor = 'var(--color-success)',
  trackColor = 'var(--muted)',
  showValue = false,
  className,
}: DualCircularProgressProps) {
  const outerRadius = (size - strokeWidth) / 2;
  const innerRadius = outerRadius - strokeWidth - 2;
  const circumferenceOuter = outerRadius * 2 * Math.PI;
  const circumferenceInner = innerRadius * 2 * Math.PI;

  const offsetOuter = circumferenceOuter - (tasksValue / 100) * circumferenceOuter;
  const offsetInner = circumferenceInner - (checklistValue / 100) * circumferenceInner;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Outer track - tasks */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Outer progress - tasks */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          fill="none"
          stroke={tasksColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumferenceOuter}
          strokeDashoffset={offsetOuter}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />

        {/* Inner track - checklist */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        {/* Inner progress - checklist */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="none"
          stroke={checklistColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumferenceInner}
          strokeDashoffset={offsetInner}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <span
          className="absolute text-[8px] font-medium text-[var(--foreground)]"
          style={{ fontSize: size * 0.22 }}
        >
          {Math.round((tasksValue + checklistValue) / 2)}%
        </span>
      )}
    </div>
  );
}
