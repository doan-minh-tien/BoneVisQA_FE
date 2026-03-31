import { AppShell } from '@/components/AppShell';

export default function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="expert">{children}</AppShell>
  );
}
