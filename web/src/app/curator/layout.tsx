import CuratorSidebar from '@/components/CuratorSidebar';

export default function CuratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <CuratorSidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
