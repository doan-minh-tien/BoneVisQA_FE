'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  clearPendingProcessingData,
  fetchPendingProcessingData,
  getAdminDocumentById,
  type PendingProcessingDataRow,
} from '@/lib/api/admin-documents';
import { AlertTriangle, CheckCircle2, Loader2, Trash2, X } from 'lucide-react';

export default function AdminLogsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<PendingProcessingDataRow[]>([]);
  const [titleById, setTitleById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);

  const loadPendingData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPendingProcessingData();
      setRows(data);
      if (data.length > 0) {
        const titleEntries = await Promise.all(
          data.map(async (item) => {
            try {
              const doc = await getAdminDocumentById(item.documentId);
              return [item.documentId, doc.title] as const;
            } catch {
              return [item.documentId, 'Unknown document'] as const;
            }
          }),
        );
        setTitleById(Object.fromEntries(titleEntries));
      } else {
        setTitleById({});
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load system logs.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPendingData();
  }, [loadPendingData]);

  const totalRows = rows.length;
  const totalStuckRecords = useMemo(
    () => rows.reduce((acc, row) => acc + (row.pendingChunkCount || 0), 0),
    [rows],
  );

  const handleCleanup = async () => {
    setCleanupRunning(true);
    try {
      const result = await clearPendingProcessingData();
      toast.success(`Cleanup complete. Removed ${result.deletedRows} temporary records.`);
      setConfirmOpen(false);
      await loadPendingData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cleanup failed.');
    } finally {
      setCleanupRunning(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="System Logs"
        subtitle="View indexing logs and safely resolve interrupted processing data."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <SectionCard
          title="Stuck AI Processing Data"
          description="Review and clear temporary leftovers from interrupted document indexing."
          actions={
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={loading || cleanupRunning || rows.length === 0}
            >
              {cleanupRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear Stuck Data
            </Button>
          }
        >
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Checking system logs...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                System is clean. No stuck processing data found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                <p className="flex items-start gap-2 text-sm font-semibold">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Warning: Found temporary data from {totalRows} interrupted document updates (
                  {totalStuckRecords} records) taking up system space.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Document</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">
                        Stuck Data Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.documentId}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-card-foreground">
                            {titleById[row.documentId] ?? 'Loading document...'}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">{row.documentId}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-card-foreground">
                          {row.pendingChunkCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            aria-label="Close confirmation"
            onClick={() => {
              if (cleanupRunning) return;
              setConfirmOpen(false);
            }}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/70 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Confirm Cleanup</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will permanently delete temporary processing data from failed or interrupted
                  uploads. It will not affect active documents. Proceed?
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                onClick={() => {
                  if (cleanupRunning) return;
                  setConfirmOpen(false);
                }}
                disabled={cleanupRunning}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={cleanupRunning}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleCleanup()} disabled={cleanupRunning}>
                {cleanupRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clean Up System Trash
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
