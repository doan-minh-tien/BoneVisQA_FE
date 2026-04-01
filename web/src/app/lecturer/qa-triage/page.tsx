'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  escalateToExpert,
  fetchLecturerClasses,
  fetchLecturerTriageList,
} from '@/lib/api/lecturer-triage';
import type { ClassItem, LecturerTriageRow } from '@/lib/api/types';
import { AlertTriangle, ArrowUpRight, Loader2 } from 'lucide-react';

function similarityRatio(raw: number): number {
  if (Number.isNaN(raw)) return 0;
  if (raw > 1) return Math.min(1, Math.max(0, raw / 100));
  return Math.min(1, Math.max(0, raw));
}

export default function LecturerQaTriagePage() {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState<LecturerTriageRow[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userId) {
      setLoadingClasses(false);
      toast.error('Missing user session. Please sign in again.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchLecturerClasses(userId);
        if (cancelled) return;
        setClasses(list);
        if (list.length === 1) setClassId(list[0].id);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load classes');
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const loadTriage = useCallback(async () => {
    if (!classId) return;
    setLoadingRows(true);
    try {
      const data = await fetchLecturerTriageList(classId);
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load triage queue');
    } finally {
      setLoadingRows(false);
    }
  }, [classId, toast]);

  useEffect(() => {
    if (classId) void loadTriage();
  }, [classId, loadTriage]);

  const onEscalate = async (id: string) => {
    setEscalatingId(id);
    try {
      await escalateToExpert(id);
      toast.success('Escalated to clinical expert for review.');
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, escalated: true } : r)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Escalation failed');
    } finally {
      setEscalatingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Diagnostic request triage"
        subtitle="Review AI similarity scores and escalate selected cases to your assigned clinical expert"
      />
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md flex-1">
            <label htmlFor="class" className="text-sm font-medium text-card-foreground">
              Class scope
            </label>
            <select
              id="class"
              disabled={loadingClasses}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} ({c.semester})
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadTriage()}
            disabled={!classId || loadingRows}
          >
            {loadingRows && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-card-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Lecturers cannot edit AI output here. Use <strong>Escalate to Expert</strong> to route
            cases that need clinical validation for your class cohort.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-input/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Similarity</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!classId ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Select a class to load diagnostic requests.
                    </td>
                  </tr>
                ) : loadingRows ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No diagnostic requests for this class.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const sim = similarityRatio(r.similarityScore);
                    const simClass =
                      sim < 0.55
                        ? 'bg-destructive/15 text-destructive'
                        : sim < 0.72
                          ? 'bg-warning/15 text-warning'
                          : 'bg-success/15 text-success';
                    return (
                    <tr key={r.id} className="hover:bg-input/20">
                      <td className="px-4 py-3 font-medium text-card-foreground">{r.studentName}</td>
                      <td className="max-w-xs px-4 py-3 text-muted-foreground">
                        <span className="line-clamp-2">{r.questionSnippet}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative h-14 w-20 overflow-hidden rounded-md border border-border bg-input">
                          {r.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                              —
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {r.askedAt}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${simClass}`}
                        >
                          {(sim * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          className="!inline-flex !gap-1.5 !py-2 !text-xs"
                          variant="secondary"
                          disabled={r.escalated || escalatingId === r.id}
                          isLoading={escalatingId === r.id}
                          onClick={() => void onEscalate(r.id)}
                        >
                          {r.escalated ? 'Escalated' : <><ArrowUpRight className="h-4 w-4" /> Escalate to Expert</>}
                        </Button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
