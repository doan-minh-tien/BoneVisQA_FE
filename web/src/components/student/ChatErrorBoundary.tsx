'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
  onReset: () => void;
};

function ChatFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">This chat could not be rendered.</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        A malformed response or rendering error occurred. You can safely reset the chat view and continue.
      </p>
      <p className="mt-2 max-w-md text-xs text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" className="mt-5" onClick={resetErrorBoundary}>
        <RefreshCcw className="h-4 w-4" aria-hidden />
        Reset Chat
      </Button>
    </div>
  );
}

export function ChatErrorBoundary({ children, onReset }: Props) {
  return (
    <ErrorBoundary FallbackComponent={ChatFallback} onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}
