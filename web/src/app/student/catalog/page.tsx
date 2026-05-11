import { Suspense } from 'react';
import Header from '@/components/Header';
import { StudentCatalogSkeleton } from '@/components/shared/DashboardSkeletons';
import { CatalogPageClient } from './CatalogPageClient';

function CatalogSearchParamsFallback() {
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

/** CSR catalog with TanStack Query; Suspense boundary is for `useSearchParams` hydration only (not ISR). */
export default function StudentCaseCatalogPage() {
  return (
    <Suspense fallback={<CatalogSearchParamsFallback />}>
      <CatalogPageClient />
    </Suspense>
  );
}
