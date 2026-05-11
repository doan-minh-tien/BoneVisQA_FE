'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import useSWR from 'swr';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import CaseManagementCard from '@/components/expert/CaseManagementCard';
import CaseListRow from '@/components/expert/cases/CaseListRow';
import CaseAssetsDialog from '@/components/expert/cases/CaseAssetsDialog';
import CreateExpertCaseModal from '@/components/expert/cases/CreateExpertCaseModal';
import { Button } from '@/components/ui/button';
import { FolderCog, FolderOpen, Plus, Search, Sparkles, Filter, X } from 'lucide-react';
import { EXPERT_DASHBOARD_QUERY_KEY } from '@/lib/api/expert-dashboard';
import { fetchExpertCasesPaged, type ExpertCasePagedResponse } from '@/lib/api/expert-cases';
import { getApiProblemDetails } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type StatusTab = 'all' | 'pending' | 'approved' | 'draft';

const PAGE_SIZE = 4;

// Filter options
const LOCATION_OPTIONS = ['All', 'Upper Limb', 'Lower Limb', 'Spine', 'Pelvis', 'Shoulder', 'Elbow', 'Wrist', 'Hand', 'Hip', 'Knee', 'Ankle', 'Foot'];
const LESION_TYPE_OPTIONS = ['All', 'Fracture', 'Arthritis', 'Tumor', 'Infection', 'Congenital', 'Trauma', 'Degenerative', 'Other'];
const DIFFICULTY_OPTIONS = ['All', 'Basic', 'Intermediate', 'Advanced'];
const SEVERITY_OPTIONS = ['All', 'Mild', 'Moderate', 'Severe'];
const AGE_GROUP_OPTIONS = ['All', 'Pediatric', 'Adult', 'Geriatric'];
const BONE_SPECIALTY_OPTIONS = [
  { id: 'upper_limb', name: 'Upper Limb' },
  { id: 'lower_limb', name: 'Lower Limb' },
  { id: 'spine', name: 'Spine' },
  { id: 'pelvis', name: 'Pelvis' },
  { id: 'shoulder', name: 'Shoulder' },
  { id: 'elbow', name: 'Elbow' },
  { id: 'wrist', name: 'Wrist' },
  { id: 'hand', name: 'Hand' },
  { id: 'hip', name: 'Hip' },
  { id: 'knee', name: 'Knee' },
  { id: 'ankle', name: 'Ankle' },
  { id: 'foot', name: 'Foot' },
];
const PATHOLOGY_OPTIONS = [
  { id: 'fracture', name: 'Fracture' },
  { id: 'arthritis', name: 'Arthritis' },
  { id: 'tumor', name: 'Tumor' },
  { id: 'infection', name: 'Infection' },
  { id: 'congenital', name: 'Congenital' },
  { id: 'trauma', name: 'Trauma' },
  { id: 'degenerative', name: 'Degenerative' },
  { id: 'other', name: 'Other' },
];

interface ExpertFilterState {
  location: string;
  lesionType: string;
  difficulty: string;
  boneSpecialty: string;
  pathology: string;
  severity: string;
  patientAgeGroup: string;
}

export default function ExpertCasesPage() {
  const router = useRouter();
  const toast = useToast();
  const toastedErrorRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [assetsCaseId, setAssetsCaseId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<ExpertFilterState>({
    location: 'All',
    lesionType: 'All',
    difficulty: 'All',
    boneSpecialty: '',
    pathology: '',
    severity: 'All',
    patientAgeGroup: 'All',
  });

  const hasActiveFilters = filters.location !== 'All' || filters.lesionType !== 'All' || filters.difficulty !== 'All' ||
    filters.boneSpecialty !== '' || filters.pathology !== '' || filters.severity !== 'All' || filters.patientAgeGroup !== 'All';

  const updateFilter = (key: keyof ExpertFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPageIndex(1);
  };

  const clearAllFilters = () => {
    setFilters({
      location: 'All',
      lesionType: 'All',
      difficulty: 'All',
      boneSpecialty: '',
      pathology: '',
      severity: 'All',
      patientAgeGroup: 'All',
    });
    setPageIndex(1);
  };

  // Fetch all cases for stats counts and display (cached with SWR)
  const { data: allCasesData, isLoading: isFetchingAll } = useSWR<ExpertCasePagedResponse | null>(
    ['expert-case-library-paged'],
    async () => {
      try {
        return await fetchExpertCasesPaged(1, 1000);
      } catch {
        return null;
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const cases = allCasesData?.items ?? [];

  const counts = useMemo(() => {
    const all = cases;
    return {
      all: all.length,
      pending: all.filter((c) => c.status === 'pending').length,
      approved: all.filter((c) => c.status === 'approved').length,
      draft: all.filter((c) => c.status === 'draft').length,
    };
  }, [cases]);

  // Filter cases by tab, search, and advanced filters
  const filtered = useMemo(() => {
    const byTab = activeTab === 'all' ? cases : cases.filter((c) => c.status === activeTab);

    // Apply search filter
    const q = query.trim().toLowerCase();
    let result = q ? byTab.filter((c) => c.title.toLowerCase().includes(q)) : byTab;

    // Apply location filter
    if (filters.location !== 'All') {
      result = result.filter((c) =>
        c.boneLocation.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply lesion type filter (categoryName)
    if (filters.lesionType !== 'All') {
      result = result.filter((c) =>
        c.categoryName?.toLowerCase().includes(filters.lesionType.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (filters.difficulty !== 'All') {
      result = result.filter((c) =>
        c.difficulty?.toLowerCase() === filters.difficulty.toLowerCase()
      );
    }

    return result;
  }, [activeTab, cases, query, filters]);

  // Recalculate total pages based on filtered items
  const filteredTotal = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  // Ensure page index is valid
  useEffect(() => {
    setPageIndex((prev) => {
      if (prev > totalPages) return Math.max(1, totalPages);
      return prev;
    });
  }, [totalPages]);

  // Reset page when tab or search changes
  useEffect(() => {
    setPageIndex(1);
  }, [activeTab, query]);

  const pagedItems = useMemo(() => {
    const start = (pageIndex - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageIndex]);

  // Show error toast
  useEffect(() => {
    if (!allCasesData) {
      toastedErrorRef.current = null;
      return;
    }
    // Data loaded successfully, clear any previous error
    toastedErrorRef.current = null;
  }, [allCasesData]);

  const handleRetry = () => {
    toastedErrorRef.current = null;
    void queryClient.invalidateQueries({ queryKey: ['expert-case-library-paged'] });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title="Teaching case library" subtitle="Author, curate, and publish cases for Visual QA and coursework" />
      <div className="mx-auto max-w-[1240px] space-y-8 px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Expert workspace
              </div>
              <h2 className="text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">Cases you own</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Create cases with optional imaging and ROI. After save, add tags or annotations from the follow-up
                dialog. Escalated student reviews live under{' '}
                <Link href="/expert/reviews" className="font-medium text-primary underline-offset-4 hover:underline">
                  Expert review
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-stretch">
              <Button type="button" className="h-11 gap-2 shadow-md" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New case
              </Button>
              <Link
                href="/expert/reviews"
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium tracking-[0.01em] text-foreground',
                  'cursor-pointer transition-all duration-150 hover:bg-slate-50 active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                Open review queue
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['all', 'All', counts.all],
              ['pending', 'Pending', counts.pending],
              ['approved', 'Approved', counts.approved],
              ['draft', 'Draft', counts.draft],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-colors',
                activeTab === id
                  ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-card-foreground">{count}</p>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            aria-label="Search cases"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                {[
                  filters.location !== 'All',
                  filters.lesionType !== 'All',
                  filters.difficulty !== 'All',
                  filters.boneSpecialty !== '',
                  filters.pathology !== '',
                  filters.severity !== 'All',
                  filters.patientAgeGroup !== 'All',
                ].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
          {hasActiveFilters && (
            <span className="text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Advanced Filters</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Lesion Type</label>
                <select
                  value={filters.lesionType}
                  onChange={(e) => updateFilter('lesionType', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {LESION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => updateFilter('difficulty', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Bone Specialty</label>
                <select
                  value={filters.boneSpecialty}
                  onChange={(e) => updateFilter('boneSpecialty', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">All</option>
                  {BONE_SPECIALTY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Pathology</label>
                <select
                  value={filters.pathology}
                  onChange={(e) => updateFilter('pathology', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">All</option>
                  {PATHOLOGY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => updateFilter('severity', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Age Group</label>
                <select
                  value={filters.patientAgeGroup}
                  onChange={(e) => updateFilter('patientAgeGroup', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                >
                  {AGE_GROUP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {isFetchingAll && !allCasesData ? (
          <PageLoadingSkeleton>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <SkeletonBlock className="h-6 w-36 rounded-full" />
                  <SkeletonBlock className="mt-3 h-6 w-4/5" />
                  <SkeletonBlock className="mt-2 h-4 w-2/3" />
                  <SkeletonBlock className="mt-4 h-24 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </PageLoadingSkeleton>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-7 w-7 text-primary" />}
            title={query.trim() ? 'No matches' : `No ${activeTab === 'all' ? '' : activeTab + ' '}cases`}
            description={
              query.trim()
                ? 'Try another search or clear the filter.'
                : 'Create a case or switch tabs to see other statuses.'
            }
            action={
              query.trim() ? (
                <Button type="button" variant="outline" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={() => setActiveTab('all')}>
                    Show all
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setCreateOpen(true)}>
                    Create case
                  </Button>
                </div>
              )
            }
          />
        ) : (
          <>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {pagedItems.map((item) => (
                <CaseListRow
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  boneLocation={item.boneLocation}
                  lesionType={item.categoryName}
                  difficulty={(item.difficulty ?? 'Easy') as 'Easy' | 'Medium' | 'Hard'}
                  status={item.status}
                  addedBy={item.addedBy}
                  addedDate={item.addedDate}
                  thumbnailUrl={item.thumbnailUrl ?? item.medicalImages?.[0]?.imageUrl ?? null}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(pageIndex - 1) * PAGE_SIZE + 1} to {Math.min(pageIndex * PAGE_SIZE, filteredTotal)} of {filteredTotal} cases
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                    disabled={pageIndex === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {pageIndex} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                    disabled={pageIndex === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateExpertCaseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newId) => {
          void queryClient.invalidateQueries({ queryKey: EXPERT_DASHBOARD_QUERY_KEY });
          void queryClient.invalidateQueries({ queryKey: ['expert-case-library-paged'] });
          if (newId) setAssetsCaseId(newId);
          else
            toast.info(
              'Case was created. If the API did not return an id, refresh the list and use Manage assets on a case when available.',
            );
        }}
      />
      {assetsCaseId ? (
        <CaseAssetsDialog
          caseId={assetsCaseId}
          mode="tags"
          allowModeSwitch
          onClose={() => setAssetsCaseId(null)}
        />
      ) : null}
    </div>
  );
}
