import { Suspense } from 'react';
import Header from '@/components/Header';
import { StudentCatalogSkeleton } from '@/components/shared/DashboardSkeletons';
import { CatalogPageClient } from './CatalogPageClient';

/**
 * Hybrid rendering: ISR shell (rebuilt hourly). Catalog rows still load on the client with the user’s
 * session (axios + token). To cache catalog JSON on the server too, add a server `fetch` with
 * `next: { revalidate: 3600 }` and pass `initialItems` into `CatalogPageClient` when the API allows it.
 */
export const revalidate = 3600;

function CatalogFallback() {
  return (
    <div className="min-h-screen">
      <Header
        title="Public Case Catalog"
        subtitle="Browse sample bone cases by location, lesion type, and difficulty before opening them in Visual QA"
      />
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <StudentCatalogSkeleton />
      </div>
    </div>
  );
}

export default function StudentCaseCatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogPageClient />
    </Suspense>
  );
}
