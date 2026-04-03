import type { Metadata } from 'next';
import './globals.css';
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
      <body suppressHydrationWarning>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
