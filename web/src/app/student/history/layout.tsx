import { Suspense, type ReactNode } from 'react';
import Header from '@/components/Header';
import { StudentHistoryPageSkeleton } from '@/components/shared/DashboardSkeletons';

function HistoryFallback() {
  return (
    <div className="min-h-screen">
      <Header title="Learning history" subtitle="Loading your timelines…" />
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <StudentHistoryPageSkeleton />
      </div>
    </div>
  );
}

export default function StudentHistoryLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<HistoryFallback />}>{children}</Suspense>;
}
