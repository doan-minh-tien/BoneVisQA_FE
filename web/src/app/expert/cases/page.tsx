'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import CaseManagementCard from '@/components/expert/CaseManagementCard';
import CaseAssetsDialog from '@/components/expert/cases/CaseAssetsDialog';
import CreateExpertCaseModal from '@/components/expert/cases/CreateExpertCaseModal';
import { Button } from '@/components/ui/button';
import { FolderCog, FolderOpen, Plus } from 'lucide-react';
import { fetchExpertRecentCases, type ExpertRecentCase } from '@/lib/api/expert-dashboard';
import { useToast } from '@/components/ui/toast';

type StatusTab = 'all' | 'pending' | 'approved' | 'draft';

export default function ExpertCasesPage() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [assetsCaseId, setAssetsCaseId] = useState<string | null>(null);
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
    if (activeTab === 'all') return cases;
    return cases.filter((c) => c.status === activeTab);
  }, [activeTab, cases]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title="Case Library"
        subtitle="Review and manage your expert case inventory."
      />
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6">
        <header className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Expert Library</p>
            <h1 className="mt-1 font-['Manrope',sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
              Case workbench
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Curate high-value teaching cases and track approval status at a glance.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full gap-2 shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Case
            </Button>
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Library overview</p>
              <p className="mt-2 text-3xl font-bold text-card-foreground">{counts.all}</p>
              <p className="text-sm text-muted-foreground">total cases visible</p>
            </div>
          </div>
        </header>

        <div
          className="mb-2 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1"
          role="tablist"
          aria-label="Case status tabs"
        >
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
              role="tab"
              aria-selected={activeTab === id}
              className={`flex min-w-[calc(50%-4px)] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:min-w-0 ${
                activeTab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(id)}
            >
              {label} ({count})
            </button>
          ))}
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
            action={<Button onClick={() => window.location.reload()}>Retry</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-7 w-7 text-primary" />}
            title={`No ${activeTab === 'all' ? '' : activeTab + ' '}cases yet`}
            description="Publish or review more cases to populate this workspace."
            action={<Button onClick={() => setActiveTab('all')}>Show all cases</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
