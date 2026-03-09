import LecturerSidebar from '@/components/LecturerSidebar';

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
