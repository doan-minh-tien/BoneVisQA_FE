'use client';

import { useEffect, useMemo, useState } from 'react';

type DeterminateProps = {
  mode: 'determinate';
  progressPercentage: number;
  message: string;
  label?: string;
  className?: string;
};

type IndeterminateProps = {
  mode: 'indeterminate';
  messages: string[];
  label?: string;
  className?: string;
};

type DynamicProgressTrackerProps = DeterminateProps | IndeterminateProps;

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function DynamicProgressTracker(props: DynamicProgressTrackerProps) {
  const [messageIdx, setMessageIdx] = useState(0);

  const indeterminateMessages = useMemo(
    () =>
      props.mode === 'indeterminate' && props.messages.length > 0
        ? props.messages
        : ['Processing...'],
    [props],
  );

  useEffect(() => {
    if (props.mode !== 'indeterminate') return;
    const timer = window.setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % indeterminateMessages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [props.mode, indeterminateMessages.length]);

  return (
    <div
      className={`rounded-xl border border-border-color bg-background/55 p-4 ${props.className ?? ''}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {props.mode === 'determinate' ? (
        <>
          <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.12em] text-text-muted">
            <span>{props.label ?? 'Progress'}</span>
            <span>{Math.round(clampProgress(props.progressPercentage))}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${clampProgress(props.progressPercentage)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">{props.message}</p>
        </>
      ) : (
        <>
          <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.12em] text-text-muted">
            <span>{props.label ?? 'Processing'}</span>
            <span>In progress</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-accent/80" />
          </div>
          <p className="mt-2 text-xs text-text-muted">{indeterminateMessages[messageIdx]}</p>
        </>
      )}
    </div>
  );
}
