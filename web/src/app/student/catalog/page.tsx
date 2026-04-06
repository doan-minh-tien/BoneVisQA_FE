'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { CaseCatalogCard } from '@/components/student/CaseCatalogCard';
import { fetchCaseCatalog } from '@/lib/api/student';
import type { StudentCaseCatalogItem } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { Filter, Loader2 } from 'lucide-react';

const difficultyOptions = [
  { value: '', label: 'All difficulty levels' },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function StudentCaseCatalogPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<StudentCaseCatalogItem[]>([]);
  const [allItems, setAllItems] = useState<StudentCaseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [lesionType, setLesionType] = useState('');
  const [difficulty, setDifficulty] = useState('');
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

  const locationOptions = useMemo(() => {
    return Array.from(new Set(allItems.map((item) => item.location).filter(Boolean))).sort();
  }, [allItems]);

  const lesionOptions = useMemo(() => {
    return Array.from(new Set(allItems.map((item) => item.lesionType).filter(Boolean))).sort();
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catalog filters</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-card-foreground">
                Location
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All locations</option>
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lesionType" className="block text-sm font-medium text-card-foreground">
                Lesion Type
              </label>
              <select
                id="lesionType"
                value={lesionType}
                onChange={(e) => setLesionType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All lesion types</option>
                {lesionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-card-foreground">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading case catalog...
            </div>
          </div>
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
