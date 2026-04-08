'use client';

import { AuthRedirector } from '@/components/AuthRedirector';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Toaster position="top-right" richColors closeButton />
        <AuthRedirector />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
