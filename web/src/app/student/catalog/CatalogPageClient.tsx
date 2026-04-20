'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { StudentCatalogSkeleton } from '@/components/shared/DashboardSkeletons';
import { CaseCatalogCard } from '@/components/student/CaseCatalogCard';
import { CatalogFilter } from '@/components/student/CatalogFilter';
import { fetchCaseCatalog, fetchCaseCatalogFilters } from '@/lib/api/student';
import type { StudentCaseCatalogItem } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';

export function CatalogPageClient() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState('');
  const [lesionType, setLesionType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const query = searchParams.get('q')?.trim().toLowerCase() ?? '';

  const filtersQuery = useQuery({
    queryKey: ['student', 'catalog-filters'],
    queryFn: fetchCaseCatalogFilters,
  });

  const catalogQuery = useQuery({
    queryKey: ['student', 'catalog', location, lesionType, difficulty, query],
    queryFn: () => fetchCaseCatalog({ location, lesionType, difficulty, q: query || undefined }),
    placeholderData: keepPreviousData,
  });

  const items = useMemo<StudentCaseCatalogItem[]>(
    () => catalogQuery.data ?? [],
    [catalogQuery.data],
  );

  useEffect(() => {
    const err = catalogQuery.error;
    if (!err) return;
    toast.error(err instanceof Error ? err.message : 'Failed to load case catalog.');
  }, [catalogQuery.error, toast]);

  const locationOptions = useMemo(() => {
    const fromApi = filtersQuery.data?.locations;
    if (fromApi?.length) return fromApi;
    return Array.from(new Set(items.map((item) => item.location).filter(Boolean))).sort();
  }, [filtersQuery.data?.locations, items]);

  const lesionOptions = useMemo(() => {
    const fromApi = filtersQuery.data?.lesionTypes;
    if (fromApi?.length) return fromApi;
    return Array.from(new Set(items.map((item) => item.lesionType).filter(Boolean))).sort();
  }, [filtersQuery.data?.lesionTypes, items]);

  const difficultyOptions = useMemo(() => {
    const fromApi = filtersQuery.data?.difficulties;
    if (fromApi?.length) return fromApi.map((d) => d.toLowerCase());
    return Array.from(
      new Set(
        items
          .map((item) => item.difficultyTier ?? item.difficulty ?? item.difficultyLabel)
          .filter((v): v is string => Boolean(v && String(v).trim() && String(v) !== '—')),
      ),
    ).sort();
  }, [filtersQuery.data?.difficulties, items]);

  const visibleItems = useMemo(() => {
    if (!query) return items;
    return items.filter((item) => {
      const tagStr = (item.tags ?? []).join(' ');
      const haystack = `${item.title} ${item.location} ${item.lesionType} ${item.categoryDisplay ?? ''} ${item.difficultyLabel} ${tagStr}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, query]);

  const catalogLoading = catalogQuery.isPending && !catalogQuery.data;

  return (
    <div className="min-h-screen">
      <Header
        title="Public Case Catalog"
        subtitle="Browse sample bone cases by location, lesion type, and difficulty before opening them in Visual QA"
      />

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        <CatalogFilter
          location={location}
          lesionType={lesionType}
          difficulty={difficulty}
          locations={locationOptions}
          lesionTypes={lesionOptions}
          difficulties={difficultyOptions}
          onLocationChange={setLocation}
          onLesionTypeChange={setLesionType}
          onDifficultyChange={setDifficulty}
        />

        {catalogLoading ? (
          <StudentCatalogSkeleton />
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-card-foreground">No cases match your filters/search</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try broadening the location, lesion type, or difficulty filters.
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-card-foreground">{visibleItems.length}</span> public case
              {visibleItems.length === 1 ? '' : 's'} from the catalog.
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <CaseCatalogCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
