'use client';

import { AuthRedirector } from '@/components/AuthRedirector';
import { ToastProvider } from '@/components/ui/toast';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Toaster position="top-right" richColors closeButton />
      <AuthRedirector />
      {children}
    </ToastProvider>
  );
}
