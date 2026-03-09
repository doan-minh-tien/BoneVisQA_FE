import StudentSidebar from '@/components/StudentSidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
