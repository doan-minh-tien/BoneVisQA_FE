import ExpertSidebar from '@/components/ExpertSidebar';

export default function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ExpertSidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
