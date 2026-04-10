'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Sparkles,
  ArrowRight,
  List,
  ClipboardList,
  FilePen,
  ClipboardPen,
  TrendingUp,
  Copy,
  Check,
  Trash,
} from 'lucide-react';
import { getLecturerQuizzes, deleteQuiz } from '@/lib/api/lecturer-quiz';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassQuizDto } from '@/lib/api/types';
import { Modal } from '@/components/ui/modal';

type QuizStatus = 'Active' | 'Draft' | 'Completed';

interface EnrichedQuiz extends ClassQuizDto {
  status: QuizStatus;
  topicLabel: string;
  formattedAssignedAt: string;
  formattedOpen: string;
  formattedClose: string;
  compactOpen: string;
  compactClose: string;
  compactAssigned: string;
}

const PAGE_SIZE = 5;

function formatQuizInstant(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Định dạng ngắn để bảng không tràn ngang (dd/MM/yy HH:mm). */
function formatQuizCompact(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function formatAssignedCompact(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** Page numbers and ellipsis for pagination (no hardcoded 1,2,3). */
function buildPageList(totalPages: number, current: number): (number | 'ellipsis')[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  for (const p of [...pages]) {
    if (p < 1 || p > totalPages) pages.delete(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}

export default function QuizListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<EnrichedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedQuiz | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<Set<string> | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (quizId: string) => {
    setSelectedQuizIds((prev) => {
      const next = new Set(prev);
      if (next.has(quizId)) next.delete(quizId);
      else next.add(quizId);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteTarget || bulkDeleteTarget.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = [...bulkDeleteTarget];
      await Promise.allSettled(ids.map((id) => deleteQuiz(id)));
      setQuizzes((prev) => prev.filter((q) => !bulkDeleteTarget.has(q.quizId)));
      setSelectedQuizIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setBulkDeleteTarget(null);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuiz(deleteTarget.quizId);
      setQuizzes((prev) => prev.filter((q) => q.quizId !== deleteTarget.quizId));
      setDeleteTarget(null);
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const lecturerId = getStoredUserId();
      if (!lecturerId) {
        setError('Not logged in or userId is missing. Please log in again.');
        return;
      }

      const data = await getLecturerQuizzes(lecturerId);
      const enriched: EnrichedQuiz[] = data.map((q) => {
        const now = new Date();
        const open = q.openTime ? new Date(q.openTime) : null;
        const close = q.closeTime ? new Date(q.closeTime) : null;
        let status: QuizStatus = 'Draft';
        if (close && now > close) status = 'Completed';
        else if (open && now < open) status = 'Draft';
        else if (!open && !close) status = 'Draft';
        else status = 'Active';
        const topicFromQuiz = (q.topic ?? '').trim();
        return {
          ...q,
          status,
          /** Cột Topic: dùng Quiz.Topic từ BE; không dùng tên lớp. */
          topicLabel: topicFromQuiz || '—',
          formattedAssignedAt: q.assignedAt
            ? new Date(q.assignedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—',
          formattedOpen: formatQuizInstant(q.openTime),
          formattedClose: formatQuizInstant(q.closeTime),
          compactOpen: formatQuizCompact(q.openTime),
          compactClose: formatQuizCompact(q.closeTime),
          compactAssigned: formatAssignedCompact(q.assignedAt ?? null),
        };
      });
      setQuizzes(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const uniqueClasses = Array.from(new Set(quizzes.map((q) => q.className).filter(Boolean))) as string[];

  const filtered = quizzes.filter((quiz) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (quiz.quizName?.toLowerCase().includes(q) ?? false) ||
      (quiz.className?.toLowerCase().includes(q) ?? false) ||
      (quiz.topic?.toLowerCase().includes(q) ?? false) ||
      (quiz.topicLabel?.toLowerCase().includes(q) ?? false);
    const matchesClass = selectedClass === 'all' || quiz.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const totalPages =
    filtered.length === 0 ? 0 : Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const paged =
    totalPages === 0
      ? []
      : filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageItems = buildPageList(totalPages, currentPage);

  const allPageSelected = paged.length > 0 && paged.every((q) => selectedQuizIds.has(q.quizId));
  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedQuizIds((prev) => {
        const next = new Set(prev);
        paged.forEach((q) => next.delete(q.quizId));
        return next;
      });
    } else {
      setSelectedQuizIds((prev) => {
        const next = new Set(prev);
        paged.forEach((q) => next.add(q.quizId));
        return next;
      });
    }
  };

  const totalQuizzes = quizzes.length;
  const activeModules = quizzes.filter((q) => q.status === 'Active').length;
  const pendingDrafts = quizzes.filter((q) => q.status === 'Draft').length;

  const listStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const listEnd =
    filtered.length === 0
      ? 0
      : Math.min(currentPage * PAGE_SIZE, filtered.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Academic Management
          </p>
          <h1 className="font-['Manrope',sans-serif] text-[2.75rem] font-extrabold leading-tight tracking-tight text-card-foreground">
            Quiz Workbench
          </h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Review, manage, and curate diagnostic assessment modules for clinical students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/lecturer/quizzes/create')}
          className="flex items-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container px-8 py-4 font-bold text-white shadow-xl shadow-primary/10 transition-all hover:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Create New Quiz
        </button>
      </div>

      {/* Bento Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-3xl border border-border/10 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold text-secondary">
              +12% vs last month
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">{totalQuizzes}</p>
        </div>

        <div className="rounded-3xl border border-border/10 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <CheckCircle className="h-5 w-5 text-secondary" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Active Modules</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">{activeModules}</p>
        </div>

        <div className="rounded-3xl border border-border/10 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <FilePen className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Pending Drafts</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">{pendingDrafts}</p>
        </div>

        <div className="rounded-3xl border border-border/10 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Avg. Student Score</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">—</p>
        </div>
      </div>

      {/* Quiz Table */}
      <div className="overflow-hidden rounded-3xl border border-border/40 bg-card shadow-sm">
        {/* Table header bar */}
        <div className="flex flex-col gap-4 border-b border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 font-['Manrope',sans-serif] text-lg font-bold text-card-foreground">
            <ClipboardList className="h-5 w-5 text-primary" />
            All Quiz Records
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-full border border-border bg-white px-4 py-2 pr-8 text-xs font-bold text-muted-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Topics</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <select className="appearance-none rounded-full border border-border bg-white px-4 py-2 pr-8 text-xs font-bold text-muted-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option>Sort: Date Created</option>
              <option>Sort: Name</option>
              <option>Sort: Status</option>
            </select>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedQuizIds.size > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-6 py-3">
          <span className="text-sm font-semibold text-primary">
            {selectedQuizIds.size} selected
          </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setBulkDeleteTarget(new Set(selectedQuizIds))}
                className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash className="h-4 w-4" />
                Delete selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuizIds(new Set())}
                className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="border-b border-border px-6 py-3">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search quizzes or topics…"
              className="h-10 w-full rounded-full border border-border bg-muted pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Table — table-fixed + cột gộp để không cần scroll ngang */}
        <div className="min-w-0">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead>
              <tr className="bg-muted/40">
                <th className="px-2 py-3 sm:px-3 sm:py-4">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer accent-primary"
                    title={allPageSelected ? 'Deselect all' : 'Select all'}
                  />
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-4 sm:py-4 sm:text-xs sm:tracking-widest">
                  Quiz Title
                </th>
                <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-4 sm:text-xs sm:tracking-widest">
                  Topic
                </th>
                <th className="px-1 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-2 sm:py-4 sm:text-xs sm:tracking-widest">
                  Q#
                </th>
                <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-4 sm:text-xs sm:tracking-widest">
                  Status
                </th>
                <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-4 sm:text-xs sm:tracking-widest">
                  Opens / Closes
                </th>
                <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted-foreground sm:px-3 sm:py-4 sm:text-xs sm:tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center sm:px-8">
                    <p className="text-muted-foreground">No quizzes match your search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((quiz) => (
                  <tr
                    key={`${quiz.quizId}-${quiz.classId}`}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-2 py-4 sm:px-3 sm:py-5">
                      <input
                        type="checkbox"
                        checked={selectedQuizIds.has(quiz.quizId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(quiz.quizId);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-3 py-4 sm:px-4 sm:py-5">
                        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyId(quiz.quizId);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-9"
                          title="Copy Quiz ID"
                        >
                          {copiedId === quiz.quizId ? (
                            <Check className="h-4 w-4 text-success sm:h-[18px] sm:w-[18px]" />
                          ) : (
                            <Copy className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                          )}
                        </button>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-9 sm:w-9">
                          <BarChart3 className="h-4 w-4 text-muted-foreground sm:h-[18px] sm:w-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="line-clamp-2 break-words text-sm font-bold leading-snug text-card-foreground"
                            title={quiz.quizName || 'Untitled quiz'}
                          >
                            {quiz.quizName || 'Untitled quiz'}
                          </p>
                          <p
                            className="mt-0.5 line-clamp-1 break-words text-[10px] text-muted-foreground sm:text-xs"
                            title={quiz.className || 'Unassigned'}
                          >
                            {quiz.className || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 align-top sm:px-3 sm:py-5">
                      <span
                        className="inline-block max-w-full break-words rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase leading-tight tracking-wide text-muted-foreground sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-wider"
                        title={quiz.topicLabel}
                      >
                        {quiz.topicLabel}
                      </span>
                    </td>
                    <td className="px-1 py-4 text-center align-top sm:py-5">
                      <span className="text-sm font-bold text-card-foreground">
                        {typeof quiz.questionCount === 'number' ? quiz.questionCount : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-4 align-top sm:px-3 sm:py-5">
                      <span
                        className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${
                          quiz.status === 'Active'
                            ? 'bg-secondary/15 text-secondary'
                            : quiz.status === 'Completed'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        <span
                          className={`h-1 w-1 shrink-0 rounded-full sm:h-1.5 sm:w-1.5 ${
                            quiz.status === 'Active'
                              ? 'bg-secondary'
                              : quiz.status === 'Completed'
                                ? 'bg-muted-foreground'
                                : 'bg-warning'
                          }`}
                        />
                        <span className="truncate">{quiz.status}</span>
                      </span>
                    </td>
                    <td className="min-w-0 px-2 py-4 align-top sm:px-3 sm:py-5">
                      <div className="min-w-0 space-y-2 text-[11px] leading-snug">
                        <div title={quiz.formattedOpen}>
                          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Open
                          </span>
                          <span className="block break-words font-semibold text-card-foreground">
                            {quiz.compactOpen}
                          </span>
                        </div>
                        <div title={quiz.formattedClose}>
                          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Close
                          </span>
                          <span className="block break-words font-semibold text-card-foreground">
                            {quiz.compactClose}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 align-top text-right sm:px-3 sm:py-5">
                      <span
                        className="inline-block whitespace-nowrap text-[11px] font-semibold text-card-foreground sm:text-xs"
                        title={quiz.formattedAssignedAt}
                      >
                        {quiz.compactAssigned}
                      </span>
                    </td>
                    <td className="px-2 py-4 align-top sm:px-3 sm:py-5">
                      <div className="flex justify-end gap-1.5 sm:gap-2">
                        {quiz.classId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/lecturer/quizzes/${quiz.quizId}/results`);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-success/10 hover:text-success"
                            title="View Results"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/lecturer/quizzes/${quiz.quizId}`);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(quiz);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {filtered.length === 0
              ? 'No quizzes to show.'
              : `Showing ${listStart} to ${listEnd} of ${filtered.length} quizzes`}
          </p>
          {totalPages > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-white text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageItems.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold transition-colors ${
                      item === currentPage
                        ? 'bg-primary text-white'
                        : 'border border-border/30 bg-white hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-white text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Contextual Insight Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Engagement Insights */}
        <div className="relative col-span-2 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-[#1a2332] p-10">
          <div className="relative z-10">
            <h4 className="font-['Manrope',sans-serif] text-2xl font-bold text-white">
              Quiz Engagement Insights
            </h4>
            <p className="mt-4 max-w-md text-sm text-slate-400">
              Student participation is up 22% this semester. The quiz series is currently the most attempted module.
            </p>
            <div className="mt-8 flex items-center gap-8">
              <div>
                <p className="font-black text-3xl text-primary-fixed-dim">4.8k</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">Total Attempts</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="font-black text-3xl text-secondary-fixed">12m</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">Avg. Time</p>
              </div>
            </div>
          </div>
          {/* Decorative gradient */}
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20">
            <div className="h-full w-full bg-gradient-to-l from-primary/30 to-transparent" />
          </div>
        </div>

        {/* AI Generate Card */}
        <div className="flex flex-col justify-center rounded-[2rem] border border-primary/10 bg-primary/5 p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h5 className="font-['Manrope',sans-serif] text-xl font-bold text-card-foreground">
            Generate with AI
          </h5>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Instantly create a new quiz by uploading a medical case study or diagnostic images.
          </p>
          <button
            type="button"
            onClick={() => router.push('/lecturer/quizzes/create')}
            className="mt-6 flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
          >
            Launch AI Assistant
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-['Manrope',sans-serif] text-lg font-bold text-card-foreground">
            Knowledge Integrity Guarantee
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            All quizzes are validated against the current Board of Radiology standards (v2.0-2024).
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Students Evaluated
            </p>
            <p className="text-2xl font-black text-primary">—</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Avg. Accuracy Rate
            </p>
            <p className="text-2xl font-black text-secondary">—</p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => router.push('/lecturer/quizzes/create')}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-50"
        aria-label="Create new quiz"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Delete confirmation dialog */}
      <Modal
        open={deleteTarget !== null}
        title="Delete Quiz"
        onClose={() => !deleting && setDeleteTarget(null)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <strong className="text-foreground">{deleteTarget.quizName ?? 'this quiz'}</strong>
            ? This will also delete all questions and attempts. This action cannot be undone.
          </p>
        )}
      </Modal>

      {/* Bulk delete confirmation dialog */}
      <Modal
        open={bulkDeleteTarget !== null}
        title="Delete Multiple Quizzes"
        onClose={() => !bulkDeleting && setBulkDeleteTarget(null)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={bulkDeleting}
              onClick={() => setBulkDeleteTarget(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {bulkDeleting ? `Deleting…` : `Delete ${bulkDeleteTarget?.size ?? 0} Quizzes`}
            </button>
          </div>
        }
      >
        {bulkDeleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are about to delete <strong className="text-foreground">{bulkDeleteTarget.size} quiz</strong>(s) from your library.
            </p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/50 p-3">
              <ul className="space-y-1 text-xs text-muted-foreground">
                {[...bulkDeleteTarget].map((id) => {
                  const quiz = quizzes.find((q) => q.quizId === id);
                  return (
                    <li key={id} className="truncate">
                      • {quiz?.quizName ?? id}
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="text-xs text-destructive font-medium">
              This action will delete all related questions and attempt history. Cannot be undone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
