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
} from 'lucide-react';
import { getLecturerQuizzes } from '@/lib/api/lecturer-quiz';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassQuizDto } from '@/lib/api/types';

type QuizStatus = 'Active' | 'Draft' | 'Completed';

interface EnrichedQuiz extends ClassQuizDto {
  status: QuizStatus;
  topicLabel: string;
  formattedAssignedAt: string;
  formattedOpen: string;
  formattedClose: string;
}

const PAGE_SIZE = 10;

function formatQuizInstant(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const lecturerId = getStoredUserId();
      if (!lecturerId) {
        setError('Chưa đăng nhập hoặc thiếu userId. Vui lòng đăng nhập lại.');
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
        return {
          ...q,
          status,
          topicLabel: q.className || 'General',
          formattedAssignedAt: q.assignedAt
            ? new Date(q.assignedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—',
          formattedOpen: formatQuizInstant(q.openTime),
          formattedClose: formatQuizInstant(q.closeTime),
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
    const matchesSearch =
      (quiz.quizName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (quiz.className?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Quiz Title
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Topic
                </th>
                <th className="px-6 py-5 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Questions
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Opens
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Closes
                </th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Assigned
                </th>
                <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <p className="text-muted-foreground">No quizzes match your search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((quiz) => (
                  <tr
                    key={`${quiz.quizId}-${quiz.classId}`}
                    className="group cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-card-foreground">
                            {quiz.quizName || 'Untitled quiz'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quiz.className || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="inline-block rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {quiz.topicLabel}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="font-bold text-card-foreground">
                        {typeof quiz.questionCount === 'number' ? quiz.questionCount : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          quiz.status === 'Active'
                            ? 'bg-secondary/15 text-secondary'
                            : quiz.status === 'Completed'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            quiz.status === 'Active'
                              ? 'bg-secondary'
                              : quiz.status === 'Completed'
                                ? 'bg-muted-foreground'
                                : 'bg-warning'
                          }`}
                        />
                        {quiz.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-xs text-muted-foreground whitespace-nowrap">
                      {quiz.formattedOpen}
                    </td>
                    <td className="px-6 py-6 text-xs text-muted-foreground whitespace-nowrap">
                      {quiz.formattedClose}
                    </td>
                    <td className="px-6 py-6 text-sm text-muted-foreground">
                      {quiz.formattedAssignedAt}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
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
                          onClick={(e) => e.stopPropagation()}
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
    </div>
  );
}
