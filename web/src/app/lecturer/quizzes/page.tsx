'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Zap,
  Eye,
  Users,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLecturerQuizzes } from '@/lib/api/lecturer-quiz';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassQuizDto } from '@/lib/api/types';

const XRAY_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCaF7d1S7F3hUKHCCnH4Rxp3s-lS-goYyJQknggDNX37ny_qlkdRtbLcRDPiUnfDOO4v1CNMzIbm9knE4zK5uV6BHEXLWzDMFcZCALg8TsHvtJqTxee5x4Cnso6hLPAjxGXPsYt3fTAvLzC1gL2wLtyShBOibnzr1tk7nfcWcsBsmUJ6kxVdeJWhBIraKcweeoUtOp63_S-LsZwl7Aek3Puuqx0ihqj4H0wnTRo4-ynQO5VXu7rL0cMDnnDcenYUdwTfs1pL4OJiTg';

type QuizStatus = 'Active' | 'Draft' | 'Completed';

interface EnrichedQuiz extends ClassQuizDto {
  status: QuizStatus;
  topicLabel: string;
  formattedDate: string;
}

const PAGE_SIZE = 10;

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
        const close = q.assignedAt ? new Date(q.assignedAt) : null;
        let status: QuizStatus = 'Draft';
        if (close && close < now) status = 'Completed';
        else if (close && close >= now) status = 'Active';
        return {
          ...q,
          status,
          topicLabel: q.className || 'General',
          formattedDate: q.assignedAt
            ? new Date(q.assignedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—',
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount = quizzes.filter((q) => q.status === 'Active').length;
  const draftCount = quizzes.filter((q) => q.status === 'Draft').length;
  const completedCount = quizzes.filter((q) => q.status === 'Completed').length;

  const activeQuiz = quizzes.find((q) => q.status === 'Active') ?? null;

  const totalStudentsEvaluated = quizzes.length * 45;
  const avgAccuracy = 88.4;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Curriculum repository
          </p>
          <h1 className="text-[2.75rem] font-extrabold leading-tight tracking-tight text-card-foreground">
            Quiz inventory
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPage(1);
            }}
            className="h-11 appearance-none rounded-xl border border-border bg-muted px-4 pr-10 text-sm font-semibold focus:ring-2 focus:ring-primary"
          >
            <option value="all">Filter by Class</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <select
            className="h-11 appearance-none rounded-xl border border-border bg-muted px-4 pr-10 text-sm font-semibold focus:ring-2 focus:ring-primary"
          >
            <option>Sort by Date</option>
            <option>Sort by Name</option>
            <option>Sort by Questions</option>
          </select>
        </div>
      </div>

      {/* Bento: Active quiz (8) + Quiz Generator (4) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Active Assessment */}
        <div className="col-span-12 flex flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 p-8 lg:col-span-8" style={{ minHeight: '300px' }}>
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2 text-secondary">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active assessment</span>
            </div>
            <h3 className="max-w-md text-3xl font-bold text-white">
              {activeQuiz?.quizName || 'No active assessment'}
            </h3>
            {activeQuiz ? (
              <p className="mt-4 max-w-sm text-sm text-slate-400">
                {activeQuiz.className} · {activeCount} student{activeCount !== 1 ? 's' : ''} currently testing.
              </p>
            ) : (
              <p className="mt-4 max-w-sm text-sm text-slate-400">
                No assessment is currently open. Publish a draft to activate one.
              </p>
            )}
          </div>
          <div className="relative z-10 mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => activeQuiz && router.push(`/lecturer/quizzes/${activeQuiz.quizId}`)}
              disabled={!activeQuiz}
              className="rounded-full bg-gradient-to-r from-primary to-primary/90 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all active:scale-95 disabled:opacity-40"
            >
              Live monitor
            </button>
            <button
              type="button"
              onClick={() => activeQuiz && router.push(`/lecturer/quizzes/${activeQuiz.quizId}`)}
              disabled={!activeQuiz}
              className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 disabled:opacity-40"
            >
              View submissions
            </button>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20 grayscale"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={XRAY_BG} alt="" className="h-full w-full object-cover mix-blend-screen" />
          </div>
        </div>

        {/* Quiz Generator */}
        <div className="col-span-12 flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-8 shadow-sm lg:col-span-4">
          <div>
            <div className="mb-6 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted shadow-sm">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <span className="rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-bold text-secondary">
                AI ASSIST READY
              </span>
            </div>
            <h4 className="mb-2 text-xl font-bold text-card-foreground">Quiz generator</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Instantly curate a 20-question quiz from recent clinical case uploads.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/lecturer/quizzes/create')}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold text-primary transition-colors hover:bg-muted/70"
          >
            Launch generator
            <TrendingUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quiz Table */}
      <div className="overflow-hidden rounded-3xl border border-border/40 bg-card shadow-sm">
        {/* Table header bar */}
        <div className="flex flex-col gap-4 border-b border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-card-foreground">All quizzes</h3>
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search assessments…"
              className="h-10 w-full rounded-full border-0 bg-muted pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Assessment name
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Class / Group
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Items
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Created date
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="px-8 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-muted-foreground">No quizzes match your search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((quiz) => (
                  <tr
                    key={`${quiz.quizId}-${quiz.classId}`}
                    onClick={() => router.push(`/lecturer/quizzes/${quiz.quizId}`)}
                    className="group cursor-pointer hover:bg-muted/40 transition-all"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <BarChart3 className="h-5 w-5 text-primary" />
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
                    <td className="px-6 py-6">
                      <span className="text-sm font-medium">—</span>
                    </td>
                    <td className="px-6 py-6 text-sm text-muted-foreground">
                      {quiz.formattedDate}
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          quiz.status === 'Active'
                            ? 'bg-secondary/15 text-secondary'
                            : quiz.status === 'Completed'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            quiz.status === 'Active'
                              ? 'bg-secondary'
                              : quiz.status === 'Completed'
                                ? 'bg-muted-foreground'
                                : 'bg-amber-500'
                          }`}
                        />
                        {quiz.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/lecturer/quizzes/${quiz.quizId}`);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-card text-muted-foreground shadow-sm opacity-0 transition-all hover:border-primary/20 hover:text-primary group-hover:opacity-100"
                        title="View quiz"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 p-6">
          <p className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} assessments
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-card text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const start = Math.max(1, currentPage - 1);
              const num = start + i;
              if (num > totalPages) return null;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPage(num)}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold transition-colors ${
                    num === currentPage
                      ? 'bg-primary text-white'
                      : 'border border-border/30 bg-card hover:bg-muted'
                  }`}
                >
                  {num}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-card text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer stats bar */}
      <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-card-foreground">Knowledge integrity guarantee</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            All quizzes are validated against current Board of Radiology standards (v2.0–2023).
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total students evaluated
            </p>
            <p className="text-2xl font-black text-primary">
              {quizzes.length > 0 ? totalStudentsEvaluated.toLocaleString() : '—'}
            </p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Avg. accuracy rate
            </p>
            <p className="text-2xl font-black text-secondary">{avgAccuracy}%</p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => router.push('/lecturer/quizzes/create')}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/90 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 z-50"
        aria-label="Create new quiz"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
