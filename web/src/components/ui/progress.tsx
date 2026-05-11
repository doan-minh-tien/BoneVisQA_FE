'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  /** Visually indicate failure without changing layout (stable height). */
  variant?: 'default' | 'success' | 'destructive';
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant = 'default', ...props }, ref) => {
    const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    const bar =
      variant === 'destructive'
        ? 'bg-destructive'
        : variant === 'success'
          ? 'bg-emerald-500'
          : 'bg-primary';

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-muted ring-1 ring-border/60',
          className,
        )}
        {...props}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300 ease-out', bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';
