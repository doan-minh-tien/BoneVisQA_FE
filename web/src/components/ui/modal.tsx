'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export function Modal({ open, title, children, onClose, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxW =
    size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxW} rounded-2xl border border-border bg-card shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-card-foreground">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            className="!p-2 shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <div className="max-h-[min(70vh,720px)] overflow-y-auto px-6 py-4">{children}</div>
        {footer ? <div className="border-t border-border px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
