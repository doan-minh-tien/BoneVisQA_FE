'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { StudentCatalogSkeleton } from '@/components/shared/DashboardSkeletons';
import { CaseCatalogCard } from '@/components/student/CaseCatalogCard';
import { CatalogFilter } from '@/components/student/CatalogFilter';
import {
  fetchCaseCatalog,
  fetchCaseCatalogFilters,
  fetchBoneSpecialtyOptions,
  fetchPathologyCategoryOptions,
} from '@/lib/api/student';
import type { StudentCaseCatalogItem } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 6;

export function CatalogPageClient() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState('');
  const [lesionType, setLesionType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [boneSpecialtyId, setBoneSpecialtyId] = useState('');
  const [pathologyCategoryId, setPathologyCategoryId] = useState('');
  const [severity, setSeverity] = useState('');
  const [patientAgeGroup, setPatientAgeGroup] = useState('');
  const query = searchParams.get('q')?.trim().toLowerCase() ?? '';

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setPageIndex(1);
  }, [location, lesionType, difficulty, boneSpecialtyId, pathologyCategoryId, severity, patientAgeGroup, query]);

  const filtersQuery = useQuery({
    queryKey: ['student', 'catalog-filters'],
    queryFn: fetchCaseCatalogFilters,
  });

  const boneSpecialtiesQuery = useQuery({
    queryKey: ['common', 'classifications', 'bone-specialties'],
    queryFn: fetchBoneSpecialtyOptions,
  });

  const pathologyCategoriesQuery = useQuery({
    queryKey: ['common', 'classifications', 'pathology-categories'],
    queryFn: fetchPathologyCategoryOptions,
  });

  const catalogQuery = useQuery({
    queryKey: [
      'student',
      'catalog',
      location,
      lesionType,
      difficulty,
      boneSpecialtyId,
      pathologyCategoryId,
      severity,
      patientAgeGroup,
      query,
    ],
    queryFn: () =>
      fetchCaseCatalog({
        location,
        lesionType,
        difficulty,
        boneSpecialtyId: boneSpecialtyId || undefined,
        pathologyCategoryId: pathologyCategoryId || undefined,
        severity: severity || undefined,
        patientAgeGroup: patientAgeGroup || undefined,
        q: query || undefined,
      }),
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

  const severityOptions = useMemo(() => {
    const fromApi = filtersQuery.data?.severities;
    if (fromApi?.length) return fromApi;
    return ['Mild', 'Moderate', 'Severe'];
  }, [filtersQuery.data?.severities]);

  const patientAgeGroupOptions = useMemo(() => {
    const fromApi = filtersQuery.data?.patientAgeGroups;
    if (fromApi?.length) return fromApi;
    return ['Pediatric', 'Adult', 'Geriatric'];
  }, [filtersQuery.data?.patientAgeGroups]);

  const visibleItems = useMemo(() => {
    if (!query) return items;
    return items.filter((item) => {
      const tagStr = (item.tags ?? []).join(' ');
      const haystack = `${item.title} ${item.location} ${item.lesionType} ${item.categoryDisplay ?? ''} ${item.difficultyLabel} ${tagStr}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, query]);

  // Pagination calculations
  const totalItems = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validPage = Math.min(pageIndex, totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const pagedItems = visibleItems.slice(startIndex, endIndex);

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
        boneSpecialtyId={boneSpecialtyId}
        boneSpecialties={boneSpecialtiesQuery.data ?? []}
        pathologyCategoryId={pathologyCategoryId}
        pathologyCategories={pathologyCategoriesQuery.data ?? []}
        severity={severity}
        severities={severityOptions}
        patientAgeGroup={patientAgeGroup}
        patientAgeGroups={patientAgeGroupOptions}
        onLocationChange={setLocation}
        onLesionTypeChange={setLesionType}
        onDifficultyChange={setDifficulty}
        onBoneSpecialtyChange={setBoneSpecialtyId}
        onPathologyCategoryChange={setPathologyCategoryId}
        onSeverityChange={setSeverity}
        onPatientAgeGroupChange={setPatientAgeGroup}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-card-foreground">{startIndex + 1}-{endIndex}</span> of{' '}
                <span className="font-medium text-card-foreground">{totalItems}</span> cases
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={validPage <= 1}
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {validPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={validPage >= totalPages}
                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedItems.map((item) => (
                <CaseCatalogCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
