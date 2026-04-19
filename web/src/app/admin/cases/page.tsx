'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { fetchAdminCasesPaged } from '@/lib/api/admin-cases';
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Loader2, Search } from 'lucide-react';

const PAGE_SIZE = 20;

function statusClass(statusRaw: string): string {
  const s = statusRaw.trim().toLowerCase();
  if (s === 'approved' || s === 'completed') return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  if (s === 'pending') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (s === 'hidden') return 'border-slate-300 bg-slate-100 text-slate-700';
  if (s === 'rejected' || s === 'failed') return 'border-red-300 bg-red-50 text-red-700';
  return 'border-border bg-muted text-muted-foreground';
}

export default function AdminCasesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(1);

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    ['admin-cases', pageIndex, PAGE_SIZE],
    () => fetchAdminCasesPaged(pageIndex, PAGE_SIZE),
    {
      revalidateOnFocus: true,
      keepPreviousData: true,
      onSuccess: (res) => {
        const tc = res?.totalCount ?? 0;
        const tp = Math.max(1, Math.ceil(tc / PAGE_SIZE));
        setPageIndex((p) => (p > tp ? tp : p));
      },
    },
  );

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const displayPage = Math.min(pageIndex, totalPages);

  const rows = useMemo(() => data?.items ?? [], [data]);
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        row.title.toLowerCase().includes(q) ||
        row.boneLocation.toLowerCase().includes(q) ||
        row.lesionType.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  useEffect(() => {
    if (!error) return;
    toast.error(error.message || 'Unable to load medical cases.');
  }, [error, toast]);

  return (
    <div className="min-h-screen">
      <Header
        title="Medical Cases"
        subtitle="Review medical cases, monitor status, and open case management details."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <SectionCard
          title="Case Management"
          description="View all medical cases and manage moderation status."
          actions={
            <Button type="button" variant="outline" onClick={() => void mutate()}>
              Refresh
            </Button>
          }
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0
                ? `Showing page ${displayPage} of ${totalPages} · ${totalCount} case${totalCount === 1 ? '' : 's'} total`
                : null}
              {rows.length > 0 ? ' · Search filters this page only.' : ''}
            </p>
          </div>

          {isLoading && !data ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading medical cases...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
              <p className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Failed to load medical cases.
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No medical cases found for the current filters.
            </div>
          ) : (
            <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-border">
              {isValidating && data ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="Refreshing" />
                </div>
              ) : null}
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Case</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Location</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Lesion</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Difficulty</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-card-foreground">{row.title}</p>
                        <p className="text-xs text-muted-foreground">{row.id}</p>
                      </td>
                      <td className="px-4 py-3 text-card-foreground">{row.boneLocation}</td>
                      <td className="px-4 py-3 text-card-foreground">{row.lesionType}</td>
                      <td className="px-4 py-3 text-card-foreground">{row.difficulty}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                            row.status,
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/cases/${row.id}`}>
                          <Button type="button" variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5" />
                            Open
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={displayPage <= 1 || isValidating}
                onClick={() =>
                  setPageIndex((p) => Math.max(1, Math.min(p, totalPages) - 1))
                }
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {displayPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={displayPage >= totalPages || isValidating}
                onClick={() =>
                  setPageIndex((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
