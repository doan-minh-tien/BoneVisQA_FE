import { AppShell } from '@/components/AppShell';

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="lecturer">{children}</AppShell>
  );
}
