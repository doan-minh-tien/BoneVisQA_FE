'use client';

import { useEffect, useRef } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting?: boolean;
  confirmText?: string;
  cancelText?: string;
  dangerLevel?: 'low' | 'medium' | 'high';
}

export default function DeleteConfirmDialog({
  open,
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  itemName,
  itemType = 'item',
  onConfirm,
  onCancel,
  deleting = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  dangerLevel = 'high',
}: DeleteConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Auto-focus cancel button when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        cancelRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !deleting) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, deleting, onCancel]);

  if (!open) return null;

  const dangerConfig = {
    low: {
      gradient: 'from-amber-400/20 via-amber-500/10 to-transparent',
      border: 'border-amber-200 dark:border-amber-800/40',
      accent: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
      button: 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
      ring: 'ring-amber-500/20',
      pulse: 'bg-amber-500/20',
    },
    medium: {
      gradient: 'from-orange-400/20 via-orange-500/10 to-transparent',
      border: 'border-orange-200 dark:border-orange-800/40',
      accent: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
      button: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      ring: 'ring-orange-500/20',
      pulse: 'bg-orange-500/20',
    },
    high: {
      gradient: 'from-red-400/20 via-red-500/10 to-transparent',
      border: 'border-red-200 dark:border-red-800/40',
      accent: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      ring: 'ring-red-500/20',
      pulse: 'bg-red-500/20',
    },
  };

  const config = dangerConfig[dangerLevel];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={!deleting ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          config.border,
        )}
      >
        {/* Gradient header accent */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', config.gradient)} />

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl',
                  config.accent,
                  config.ring,
                  'ring-4',
                )}
              >
                <Trash2 className={cn('h-7 w-7', config.icon)} />
              </div>
              {/* Pulse animation */}
              <div
                className={cn(
                  'absolute inset-0 rounded-2xl animate-ping opacity-30',
                  config.pulse,
                )}
              />
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0 pt-1">
              <h2
                id="delete-dialog-title"
                className="text-xl font-bold text-card-foreground"
              >
                {title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                'transition-colors cursor-pointer',
                'hover:bg-muted',
                'disabled:opacity-50',
              )}
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Item preview (if provided) */}
          {itemName && (
            <div
              className={cn(
                'rounded-2xl p-4 mb-5 border',
                'bg-muted/50',
                config.border,
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    config.accent,
                  )}
                >
                  <AlertTriangle className={cn('h-5 w-5', config.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                    {itemType}
                  </p>
                  <p className="font-semibold text-card-foreground truncate">
                    {itemName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning message */}
          <div
            className={cn(
              'flex items-start gap-2.5 rounded-xl p-3 mb-6',
              'bg-muted/30 border border-transparent',
            )}
          >
            <AlertTriangle className={cn('h-4 w-4 mt-0.5 shrink-0', config.icon)} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Related data will be permanently deleted and cannot be recovered. Please confirm before proceeding.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:gap-3">
            <button
              type="button"
              ref={cancelRef}
              onClick={onCancel}
              disabled={deleting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'rounded-2xl border border-border bg-card px-5 py-3',
                'text-sm font-bold text-card-foreground',
                'transition-all cursor-pointer',
                'hover:bg-muted hover:border-muted-foreground/20',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'rounded-2xl px-5 py-3',
                'text-sm font-bold text-white',
                'shadow-md transition-all cursor-pointer',
                config.button,
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
