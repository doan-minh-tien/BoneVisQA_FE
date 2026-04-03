import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers';
import I18nProvider from '@/components/providers/I18nProvider';

export const metadata: Metadata = {
  title: 'MedEdu - Medical Course Management',
  description: 'Comprehensive course management system for medical education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Thêm suppressHydrationWarning vào thẻ body */}
      <body suppressHydrationWarning>
        <AppProviders>
          <I18nProvider>{children}</I18nProvider>
        </AppProviders>
      </body>
    </html>
  );
}
