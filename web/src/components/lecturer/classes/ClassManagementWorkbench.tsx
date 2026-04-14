'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  UserPlus,
  Link2,
  ArrowRight,
  X,
  Loader2,
  Filter,
  PlusCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import ImportPreviewDialog from '@/components/lecturer/classes/ImportPreviewDialog';
import {
  // getAvailableStudents,    // DISABLED: Lecturer không CRUD student trong lớp
  // enrollManyStudents,       // DISABLED: Lecturer không CRUD student trong lớp
  getLecturerCases,
  assignCasesToClass,
} from '@/lib/api/lecturer';
import type { CaseDto } from '@/lib/api/types';

export interface ClassManagementWorkbenchProps {
  classId: string;
  enrolledCount: number;
  /** Shown as secondary metric (e.g. class stats case views). */
  caseActivityCount: number;
  /** Optional denominator for enrolled display, e.g. mock capacity. */
  enrolledCapacity?: number;
  /** DISABLED: onRosterChanged — Lecturer không CRUD student trong lớp */
  // onRosterChanged?: () => void;
}

export default function ClassManagementWorkbench({
  classId,
  enrolledCount,
  caseActivityCount,
  enrolledCapacity,
}: ClassManagementWorkbenchProps) {
  const [showImport, setShowImport] = useState(false);
  // DISABLED: showBulk — Lecturer không CRUD student trong lớp
  // const [showBulk, setShowBulk] = useState(false);

  const [cases, setCases] = useState<CaseDto[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assigningIds, setAssigningIds] = useState<Set<string>>(new Set());
  const [justAssigned, setJustAssigned] = useState<Set<string>>(new Set());

// DISABLED: Bulk enrollment state — Lecturer không CRUD student trong lớp
// const [bulkList, setBulkList] = useState<StudentEnrollment[]>([]);
// const [bulkLoading, setBulkLoading] = useState(false);
// const [bulkSearch, setBulkSearch] = useState('');
// const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
// const [bulkSubmitting, setBulkSubmitting] = useState(false);
// const [bulkError, setBulkError] = useState('');

  // DISABLED: refreshRoster — Lecturer không CRUD student trong lớp
  // const refreshRoster = useCallback(() => {
  //   onRosterChanged?.();
  // }, [onRosterChanged]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCasesLoading(true);
      try {
        const data = await getLecturerCases();
        if (!cancelled) setCases(data);
      } catch {
        if (!cancelled) setCases([]);
      } finally {
        if (!cancelled) setCasesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => {
      if (c.categoryName) set.add(c.categoryName);
    });
    return Array.from(set).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    if (categoryFilter === 'all') return cases;
    return cases.filter((c) => c.categoryName === categoryFilter);
  }, [cases, categoryFilter]);

  // DISABLED: openBulk — Lecturer không CRUD student trong lớp
  // const openBulk = async () => {
  //   setShowBulk(true);
  //   setBulkError('');
  //   setBulkSearch('');
  //   setBulkSelected(new Set());
  //   setBulkLoading(true);
  //   try {
  //     const data = await getAvailableStudents(classId);
  //     setBulkList(data);
  //   } catch {
  //     setBulkList([]);
  //   } finally {
  //     setBulkLoading(false);
  //   }
  // };

  // DISABLED: toggleBulk — Lecturer không CRUD student trong lớp
  // const toggleBulk = (studentId: string) => {
  //   setBulkSelected((prev) => {
  //     const next = new Set(prev);
  //     if (next.has(studentId)) next.delete(studentId);
  //     else next.add(studentId);
  //     return next;
  //   });
  // };

  // DISABLED: submitBulkEnroll — Lecturer không CRUD student trong lớp
  // const submitBulkEnroll = async () => {
  //   if (bulkSelected.size === 0) return;
  //   setBulkSubmitting(true);
  //   setBulkError('');
  //   try {
  //     await enrollManyStudents(classId, Array.from(bulkSelected));
  //     setShowBulk(false);
  //     refreshRoster();
  //   } catch (e) {
  //     setBulkError(e instanceof Error ? e.message : 'Bulk enroll failed');
  //   } finally {
  //     setBulkSubmitting(false);
  //   }
  // };

  const handleAssignCase = async (caseId: string) => {
    setAssigningIds((prev) => new Set(prev).add(caseId));
    try {
      await assignCasesToClass(classId, {
        caseIds: [caseId],
        isMandatory: true,
      });
      setJustAssigned((prev) => new Set(prev).add(caseId));
    } catch {
      // keep UI unchanged
    } finally {
      setAssigningIds((prev) => {
        const next = new Set(prev);
        next.delete(caseId);
        return next;
      });
    }
  };

  // DISABLED: filteredBulk — Lecturer không CRUD student trong lớp
  // const filteredBulk = bulkList.filter((s) => {
  //   const q = bulkSearch.toLowerCase();
  //   return (
  //     (s.studentName?.toLowerCase().includes(q) ?? false) ||
  //     (s.studentEmail?.toLowerCase().includes(q) ?? false) ||
  //     (s.studentCode?.toLowerCase().includes(q) ?? false)
  //   );
  // });

  const displayCases = filteredCases.slice(0, 9);

  return (
    <div className="mb-10 space-y-8">
      <div className="flex flex-wrap justify-end gap-3">
        {/*
          DISABLED: Import students button — Lecturer không CRUD student trong lớp
          Nếu cần import students, Admin sẽ làm việc đó.
        */}
        {/* <button
          type="button"
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-5 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-muted"
        >
          <Upload className="h-4 w-4" />
          Import students
        </button>
        <button
          type="button"
          onClick={openBulk}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Bulk enroll
        </button> */}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-sm lg:col-span-8">
          <div className="relative z-10">
            <span className="inline-block rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-bold uppercase tracking-tight text-success">
              Active class
            </span>
            <div className="mt-6 flex flex-wrap items-baseline gap-10 md:gap-16">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Enrolled students</p>
                <p className="text-4xl font-black tracking-tight text-card-foreground md:text-5xl">
                  {enrolledCount}
                  {enrolledCapacity != null && enrolledCapacity > 0 ? (
                    <span className="text-2xl font-light text-muted-foreground">
                      /{enrolledCapacity}
                    </span>
                  ) : null}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">Case activity (views)</p>
                <p className="text-4xl font-black tracking-tight text-card-foreground md:text-5xl">
                  {caseActivityCount}
                </p>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-card bg-primary/15 text-xs font-bold text-primary"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {enrolledCount > 3 ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-card bg-muted text-xs font-bold text-muted-foreground">
                    +{enrolledCount - 3}
                  </div>
                ) : null}
              </div>
              <p className="max-w-md text-sm font-medium text-muted-foreground">
                Roster and assignments are managed from this workbench. Use Import or Bulk enroll to add
                students quickly.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/lecturer/cases"
          className="group flex flex-col rounded-3xl border border-border bg-slate-900 p-8 text-slate-50 shadow-sm transition-transform hover:scale-[1.01] dark:bg-slate-950 lg:col-span-4"
        >
          <div className="mb-auto">
            <h3 className="mb-2 text-xl font-bold">Case library</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Link curated cases to this class. Browse the full library or assign from the grid below.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-cyan-300" />
              <span className="font-bold">
                {casesLoading ? '…' : `${cases.length} available cases`}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary transition-colors group-hover:bg-primary/90">
              <ArrowRight className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-[2rem] border border-border/60 bg-muted/20 p-8 md:p-10">
        <div className="relative z-10 mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-card-foreground md:text-3xl">
              Assign cases to class
            </h3>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Cases from your workbench. Assigning adds them to this class curriculum.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border-0 bg-transparent text-sm font-semibold text-card-foreground focus:ring-0"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {casesLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : displayCases.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No cases match this filter.</p>
        ) : (
          <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayCases.map((c) => {
              const assigned = justAssigned.has(c.id);
              const busy = assigningIds.has(c.id);
              const tag = (c.categoryName || c.difficulty || 'Case').slice(0, 12).toUpperCase();
              return (
                <div
                  key={c.id}
                  className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-primary/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <span className="rounded px-2 py-0.5 text-[10px] font-black tracking-tight bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
                        {tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="mb-2 line-clamp-2 text-base font-bold leading-tight text-card-foreground">
                      {c.title || 'Untitled case'}
                    </h4>
                    <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">
                      {c.description || 'No description.'}
                    </p>
                    {assigned ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Assigned
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || !c.isActive}
                        onClick={() => handleAssignCase(c.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlusCircle className="h-4 w-4" />
                        )}
                        Assign to class
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/*
        DISABLED: ImportPreviewDialog — Lecturer không CRUD student trong lớp
        Nếu cần import students, Admin sẽ làm việc đó.
      */}
      {/* <ImportPreviewDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        classId={classId}
        onSuccess={refreshRoster}
      /> */}

      {/*
        DISABLED: Bulk enrollment modal — Lecturer không CRUD student trong lớp
      */}
      {/* {showBulk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => !bulkSubmitting && setShowBulk(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Bulk enroll</h3>
                <p className="text-sm text-muted-foreground">Select students not yet in this class</p>
              </div>
              <button
                type="button"
                disabled={bulkSubmitting}
                onClick={() => setShowBulk(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm"
              />
            </div>

            {bulkError ? (
              <p className="mb-2 text-sm text-destructive">{bulkError}</p>
            ) : null}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {bulkLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredBulk.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No candidates to enroll.</p>
              ) : (
                filteredBulk.map((s) => {
                  const checked = bulkSelected.has(s.studentId);
                  return (
                    <button
                      key={s.studentId}
                      type="button"
                      onClick={() => toggleBulk(s.studentId)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        checked ? 'border-primary/40 bg-primary/5' : 'border-transparent bg-muted/30 hover:border-border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        className="h-4 w-4 rounded border-border text-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          {s.studentName || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[s.studentCode, s.studentEmail].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              disabled={bulkSubmitting || bulkSelected.size === 0}
              onClick={submitBulkEnroll}
              className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enrolling…
                </span>
              ) : (
                `Enroll ${bulkSelected.size} selected`
              )}
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
}
