'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

interface ToastApi {
  success: (message: string, options?: { action?: ToastAction }) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const kindStyles: Record<ToastKind, string> = {
  success: 'border-success/40 bg-surface text-card-foreground shadow-[0_18px_40px_rgba(16,185,129,0.18)]',
  error: 'border-destructive/50 bg-surface text-destructive shadow-[0_18px_40px_rgba(239,68,68,0.18)]',
  info: 'border-border bg-surface text-card-foreground shadow-[0_18px_40px_rgba(15,23,42,0.14)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string, action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message, action }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, opts) => push('success', m, opts?.action),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-6 top-6 z-[200] flex w-full max-w-md flex-col gap-3"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border px-6 py-5 text-base font-semibold leading-snug shadow-lg backdrop-blur sm:text-lg flex items-center justify-between gap-4 ${kindStyles[t.kind]}`}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                onClick={t.action.onClick}
                className="shrink-0 px-4 py-1.5 rounded-lg bg-success/10 text-success text-sm font-semibold hover:bg-success/20 transition-colors"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
