'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [items, setItems] = useState<StudentCaseCatalogItem[]>([]);
  const [allItems, setAllItems] = useState<StudentCaseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [lesionType, setLesionType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [lesionOptions, setLesionOptions] = useState<string[]>([]);
  const [difficultyOptions, setDifficultyOptions] = useState<string[]>([]);
  const query = searchParams.get('q')?.trim().toLowerCase() ?? '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchCaseCatalog({ location, lesionType, difficulty });
        if (cancelled) return;
        setItems(data);

        if (!location && !lesionType && !difficulty) {
          setAllItems(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load case catalog.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [difficulty, lesionType, location, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCaseCatalogFilters();
        if (cancelled) return;
        setLocationOptions(data.locations);
        setLesionOptions(data.lesionTypes);
        setDifficultyOptions(data.difficulties.map((d) => d.toLowerCase()));
      } catch {
        if (cancelled) return;
        // Fallback when filter endpoint is unavailable.
        setLocationOptions(Array.from(new Set(allItems.map((item) => item.location).filter(Boolean))).sort());
        setLesionOptions(Array.from(new Set(allItems.map((item) => item.lesionType).filter(Boolean))).sort());
        setDifficultyOptions(Array.from(new Set(allItems.map((item) => item.difficulty).filter(Boolean))).sort());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allItems]);

  const visibleItems = useMemo(() => {
    if (!query) return items;
    return items.filter((item) => {
      const haystack = `${item.title} ${item.location} ${item.lesionType} ${item.difficulty}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, query]);

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

        {loading ? (
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
