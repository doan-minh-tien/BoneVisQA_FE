'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import useSWR, { useSWRConfig } from 'swr';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import CaseManagementCard from '@/components/expert/CaseManagementCard';
import CaseAssetsDialog from '@/components/expert/cases/CaseAssetsDialog';
import CreateExpertCaseModal from '@/components/expert/cases/CreateExpertCaseModal';
import { Button } from '@/components/ui/button';
import { FolderCog, FolderOpen, Plus, Search, Sparkles } from 'lucide-react';
import {
  EXPERT_DASHBOARD_QUERY_KEY,
  fetchExpertRecentCases,
  type ExpertRecentCase,
} from '@/lib/api/expert-dashboard';
import { getApiProblemDetails } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type StatusTab = 'all' | 'pending' | 'approved' | 'draft';

export default function ExpertCasesPage() {
  const router = useRouter();
  const toast = useToast();
  const toastedErrorRef = useRef<string | null>(null);
  const { mutate } = useSWRConfig();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [assetsCaseId, setAssetsCaseId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = useSWR<ExpertRecentCase[]>('expert-case-library', fetchExpertRecentCases, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 4000,
  });

  const cases = data ?? [];
  const counts = useMemo(() => {
    return {
      all: cases.length,
      pending: cases.filter((c) => c.status === 'pending').length,
      approved: cases.filter((c) => c.status === 'approved').length,
      draft: cases.filter((c) => c.status === 'draft').length,
    };
  }, [cases]);

  const filtered = useMemo(() => {
    const byTab = activeTab === 'all' ? cases : cases.filter((c) => c.status === activeTab);
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((c) => c.title.toLowerCase().includes(q));
  }, [activeTab, cases, query]);

  useEffect(() => {
    if (!error) {
      toastedErrorRef.current = null;
      return;
    }
    const { title: errTitle, detail } = getApiProblemDetails(error);
    const msg = detail ? `${errTitle}: ${detail}` : errTitle;
    if (toastedErrorRef.current === msg) return;
    toastedErrorRef.current = msg;
    toast.error(msg);
  }, [error, toast]);

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

        {isLoading ? (
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
        ) : error ? (
          <EmptyState
            icon={<FolderCog className="h-7 w-7 text-primary" />}
            title="Unable to load case library"
            description={error instanceof Error ? error.message : 'Please try again in a moment.'}
            action={
              <Button
                onClick={() => {
                  toastedErrorRef.current = null;
                  void mutate('expert-case-library');
                  router.refresh();
                }}
              >
                Retry
              </Button>
            }
          />
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filtered.map((item) => (
              <CaseManagementCard
                key={item.id}
                id={item.id}
                title={item.title}
                boneLocation={item.boneLocation}
                lesionType={item.lesionType}
                difficulty={item.difficulty}
                status={item.status}
                addedBy={item.addedBy}
                addedDate={item.addedDate}
                viewCount={item.viewCount}
                usageCount={item.usageCount}
                thumbnailUrl={item.thumbnailUrl}
              />
            ))}
          </div>
        )}
      </div>

      <CreateExpertCaseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newId) => {
          void mutate('expert-case-library');
          void queryClient.invalidateQueries({ queryKey: EXPERT_DASHBOARD_QUERY_KEY });
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
