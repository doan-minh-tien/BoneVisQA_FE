'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  type AdminFlaggedChunkRow,
  fetchAdminFlaggedChunks,
  patchAdminChunkFlagResolution,
} from '@/lib/api/admin-flagged-chunks';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

export default function AdminFlaggedChunksPage() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminFlaggedChunkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminFlaggedChunks();
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load flagged chunks.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const markResolved = async (chunkId: string) => {
    setBusyId(chunkId);
    try {
      await patchAdminChunkFlagResolution(chunkId, { resolved: true });
      toast.success('Marked as resolved.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed — API may not be implemented yet.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Flagged RAG chunks"
        subtitle="Review text segments flagged by experts during case review (data quality)."
      />
      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Expert flags are created from{' '}
            <Link href="/expert/reviews" className="font-medium text-primary underline underline-offset-2">
              Expert review
            </Link>
            . This list requires admin API support.
          </p>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
        </div>

        <SectionCard title="Queue">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="space-y-4 py-8">
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div className="space-y-2">
                  <p className="font-medium">No flagged chunks in the queue</p>
                  <p className="leading-relaxed text-amber-950/90">
                    This panel is empty when <code className="rounded bg-amber-100/80 px-1">GET …/chunks/flagged</code> returns an empty array —
                    normally no chunks are flagged in the database yet. If you expected rows, confirm you are signed in as <strong>Admin</strong>{' '}
                    and watch for error toasts (401/403). Rows map <code className="rounded px-1">preview</code> / <code className="rounded px-1">snippet</code>{' '}
                    from the API into the excerpt below.
                  </p>
                  <p className="text-xs text-amber-900/80">
                    Resolve:{' '}
                    <code className="rounded px-1">PATCH …/documents/chunks/&#123;id&#125;/flag</code> or{' '}
                    <code className="rounded px-1">PATCH …/rag/chunks/&#123;id&#125;/flag</code> with{' '}
                    <code className="rounded px-1">&#123; &quot;resolved&quot;: true &#125;</code>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.chunkId} className="py-4 first:pt-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-mono text-muted-foreground">Chunk {row.chunkId}</p>
                      {row.documentTitle ? (
                        <p className="text-sm font-medium text-foreground">{row.documentTitle}</p>
                      ) : null}
                      <p className="text-sm leading-relaxed text-foreground/90">{row.contentPreview}</p>
                      {row.flagReason ? (
                        <p className="text-xs text-destructive">
                          <span className="font-semibold">Flag reason:</span> {row.flagReason}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">
                        {row.flaggedAt ? `Flagged ${row.flaggedAt}` : null}
                        {row.flaggedBy ? ` · ${row.flaggedBy}` : null}
                        {row.flaggedByExpertId ? ` · id ${row.flaggedByExpertId.slice(0, 8)}…` : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === row.chunkId}
                        onClick={() => void markResolved(row.chunkId)}
                      >
                        {busyId === row.chunkId ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          'Mark resolved'
                        )}
                      </Button>
                      {row.documentId ? (
                        <Button type="button" variant="ghost" size="sm" asChild>
                          <Link href={`/admin/documents/${row.documentId}`}>
                            Document
                            <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
