import * as React from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90',
  destructive: 'border-transparent bg-destructive text-white hover:bg-destructive/90',
  outline: 'border-border bg-background text-foreground',
  muted: 'border-transparent bg-muted text-muted-foreground',
  accent:
    'border border-amber-500/40 bg-amber-500/15 text-amber-950 font-semibold',
} as const;

export type BadgeVariant = keyof typeof variants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
