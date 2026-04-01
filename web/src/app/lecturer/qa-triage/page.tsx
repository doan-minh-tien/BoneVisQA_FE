'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import { TriageQueueTable } from '@/components/lecturer/TriageQueueTable';
import { SectionCard } from '@/components/shared/SectionCard';
import { ToolbarField } from '@/components/shared/ToolbarField';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  escalateToExpert,
  fetchLecturerClasses,
  fetchLecturerTriageList,
} from '@/lib/api/lecturer-triage';
import type { ClassItem, LecturerTriageRow } from '@/lib/api/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
        <SectionCard
          className="!p-4"
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadTriage()}
              disabled={!classId || loadingRows}
            >
              {loadingRows && <Loader2 className="h-4 w-4 animate-spin" />}
              Refresh
            </Button>
          }
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <ToolbarField label="Class scope">
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
            </ToolbarField>
          </div>
        </SectionCard>

        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-card-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Lecturers cannot edit AI output here. Use <strong>Escalate to Expert</strong> to route
            cases that need clinical validation for your class cohort.
          </p>
        </div>

        <TriageQueueTable
          classId={classId}
          rows={rows}
          loadingRows={loadingRows}
          escalatingId={escalatingId}
          onEscalate={(id) => void onEscalate(id)}
        />
      </div>
    </div>
  );
}
