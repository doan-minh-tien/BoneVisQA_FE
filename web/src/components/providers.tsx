'use client';

import { AuthRedirector } from '@/components/AuthRedirector';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Toaster } from 'sonner';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  'border border-border bg-card text-card-foreground shadow-lg backdrop-blur-sm',
                title: 'text-card-foreground font-semibold',
                description: 'text-muted-foreground text-sm',
                success: 'border-success/40',
                error: 'border-destructive/40',
              },
            }}
          />
          <AuthRedirector />
          {children}
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
