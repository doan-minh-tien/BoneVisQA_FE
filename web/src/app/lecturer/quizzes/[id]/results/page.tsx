'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Users,
  FileText,
  X,
  RotateCcw,
} from 'lucide-react';
import { getQuiz } from '@/lib/api/lecturer-quiz';
import { getClassQuizAttempts, getQuizAttemptDetail, allowRetakeForAttempt, allowRetakeAll } from '@/lib/api/lecturer';
import { getApiErrorMessage } from '@/lib/api/client';
import type { QuizDto, StudentQuizAttemptDto, QuizAttemptDetailDto, QuestionWithAnswerDto } from '@/lib/api/types';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

type SortKey = 'studentName' | 'score' | 'submittedAt';
type SortDir = 'asc' | 'desc';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ScoreBadge({ score, maxScore }: { score: number | null; maxScore: number }) {
  if (score === null) return <span className="text-muted-foreground">Ungraded</span>;
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color = pct >= 80 ? 'text-success bg-success/10' : pct >= 60 ? 'text-warning bg-warning/10' : 'text-destructive bg-destructive/10';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Award className="h-3 w-3" />
      {score.toFixed(1)}
    </span>
  );
}

function QuestionReviewCard({ q, index }: { q: QuestionWithAnswerDto; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const options = [
    { key: 'A', value: q.optionA },
    { key: 'B', value: q.optionB },
    { key: 'C', value: q.optionC },
    { key: 'D', value: q.optionD },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium line-clamp-1">{q.questionText}</span>
        {q.isCorrect === true && <CheckCircle className="h-5 w-5 text-success shrink-0" />}
        {q.isCorrect === false && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
        {q.isCorrect === null && <Clock className="h-5 w-5 text-muted-foreground shrink-0" />}
        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((opt) => {
              const isCorrect = opt.key === q.correctAnswer;
              const isStudent = opt.key === q.studentAnswer;
              let cls = 'flex items-center gap-2 p-2 rounded-lg border text-sm';
              if (isCorrect) cls += ' border-success bg-success/10 text-success font-medium';
              else if (isStudent && !isCorrect) cls += ' border-destructive bg-destructive/10 text-destructive';
              else cls += ' border-border bg-muted/50 text-muted-foreground';
              return (
                <div key={opt.key} className={cls}>
                  <span className="font-bold">{opt.key}.</span>
                  <span className="flex-1">{opt.value ?? '—'}</span>
                  {isCorrect && <CheckCircle className="h-4 w-4 shrink-0" />}
                  {isStudent && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              <strong>Correct:</strong> {q.correctAnswer ?? '—'}
            </span>
            <span>
              <strong>Student answered:</strong> {q.studentAnswer ?? '—'}
            </span>
            <span>
              <strong>Status:</strong>{' '}
              {q.isCorrect === true ? (
                <span className="text-success font-medium">Correct</span>
              ) : q.isCorrect === false ? (
                <span className="text-destructive font-medium">Incorrect</span>
              ) : (
                <span className="text-muted-foreground">Not graded</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function AttemptDetailModal({
  detail,
  onClose,
}: {
  detail: QuizAttemptDetailDto | null;
  onClose: () => void;
}) {
  if (!detail) return null;
  const maxScore = detail.passingScore ?? 100;

  return (
    <Modal open={!!detail} onClose={onClose} title={`Quiz Review: ${detail.studentName}`} size="xl">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Quiz:</span>{' '}
            <span className="font-medium">{detail.quizTitle}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Started:</span>{' '}
            <span>{formatDate(detail.startedAt)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Submitted:</span>{' '}
            <span>{formatDate(detail.completedAt)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Score:</span>{' '}
            <ScoreBadge score={detail.score} maxScore={maxScore} />
          </div>
          {detail.passingScore && (
            <div>
              <span className="text-muted-foreground">Passing:</span>{' '}
              <span className="font-medium">{detail.passingScore}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Questions ({detail.questions.length})
          </h4>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {detail.questions.map((q, i) => (
              <QuestionReviewCard key={q.questionId} q={q} index={i} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function QuizResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [quizLoading, setQuizLoading] = useState(true);

  const [attempts, setAttempts] = useState<StudentQuizAttemptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selectedAttempt, setSelectedAttempt] = useState<StudentQuizAttemptDto | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<QuizAttemptDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [retakingId, setRetakingId] = useState<string | null>(null);
  const [retakingAll, setRetakingAll] = useState(false);

  const classId = quiz?.classId ?? '';

  async function handleRetakeSingle(attempt: StudentQuizAttemptDto) {
    if (!classId) return;
    if (!confirm(`Cho phép "${attempt.studentName}" làm lại bài quiz này?`)) return;
    setRetakingId(attempt.attemptId);
    try {
      await allowRetakeForAttempt(classId, quizId, attempt.attemptId);
      toast.success(`Đã cho phép "${attempt.studentName}" làm lại.`);
      const data = await getClassQuizAttempts(classId, quizId);
      setAttempts(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setRetakingId(null);
    }
  }

  async function handleRetakeAll() {
    if (!classId) return;
    if (!confirm('Cho phép TẤT CẢ sinh viên đã nộp làm lại bài quiz này?')) return;
    setRetakingAll(true);
    try {
      await allowRetakeAll(classId, quizId);
      toast.success('Đã cho phép tất cả sinh viên làm lại.');
      const data = await getClassQuizAttempts(classId, quizId);
      setAttempts(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setRetakingAll(false);
    }
  }

  useEffect(() => {
    async function load() {
      setQuizLoading(true);
      try {
        const q = await getQuiz(quizId);
        setQuiz(q);
      } catch {
        setError('Failed to load quiz info.');
      } finally {
        setQuizLoading(false);
      }
    }
    load();
  }, [quizId]);

  useEffect(() => {
    if (!classId) return;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getClassQuizAttempts(classId, quizId);
        setAttempts(data);
      } catch (e) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classId, quizId]);

  async function openAttemptDetail(attempt: StudentQuizAttemptDto) {
    if (!classId) return;
    setSelectedAttempt(attempt);
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const detail = await getQuizAttemptDetail(classId, quizId, attempt.attemptId);
      setAttemptDetail(detail);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = attempts
    .filter((a) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        a.studentName.toLowerCase().includes(s) ||
        a.studentEmail.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'studentName') cmp = a.studentName.localeCompare(b.studentName);
      else if (sortKey === 'score') cmp = (a.score ?? 0) - (b.score ?? 0);
      else if (sortKey === 'submittedAt') {
        const ta = a.completedAt ?? a.startedAt ?? '';
        const tb = b.completedAt ?? b.startedAt ?? '';
        cmp = ta.localeCompare(tb);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const avgScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / attempts.filter(a => a.score !== null).length
    : 0;
  const passCount = attempts.filter((a) => a.score !== null && a.score >= (quiz?.passingScore ?? 0)).length;

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-muted-foreground/30 ml-1">⇅</span>;
    return <span className="text-primary ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-muted-foreground">/</span>
        <Link href="/lecturer/quizzes" className="text-sm text-muted-foreground hover:text-foreground">
          Quizzes
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{quiz?.quizName ?? quizId}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-primary">Results</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Quiz Results</h1>
        {quiz && (
          <p className="text-muted-foreground text-sm mt-1">
            {quiz.quizName} {quiz.className && `· ${quiz.className}`}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users className="h-4 w-4" />
            Total Attempts
          </div>
          <p className="text-2xl font-bold">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Award className="h-4 w-4" />
            Average Score
          </div>
          <p className="text-2xl font-bold">
            {isNaN(avgScore) ? '—' : avgScore.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CheckCircle className="h-4 w-4" />
            Passed
          </div>
          <p className="text-2xl font-bold">
            {passCount}{quiz?.passingScore !== undefined && ` / ${attempts.filter(a => a.score !== null).length}`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <FileText className="h-4 w-4" />
            Questions
          </div>
          <p className="text-2xl font-bold">{quiz?.questionCount ?? '—'}</p>
        </div>
      </div>

      {/* Retake All */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <h3 className="font-semibold text-sm">Quản lý làm lại (Retake)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {attempts.filter(a => a.completedAt).length} sinh viên đã nộp bài
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetakeAll}
          disabled={retakingAll || attempts.filter(a => a.completedAt).length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retakingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Cho phép tất cả làm lại
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or email…"
          className="h-10 w-full rounded-full border border-border bg-muted pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Student</th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('score')}
                >
                  Score <SortIcon k="score" />
                </th>
                <th className="px-4 py-3 font-medium text-center">Correct</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('submittedAt')}
                >
                  Submitted <SortIcon k="submittedAt" />
                </th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading attempts…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {search ? 'No students match your search.' : 'No attempts yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.attemptId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{a.studentName}</p>
                        <p className="text-xs text-muted-foreground">{a.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={a.score} maxScore={quiz?.passingScore ?? 100} />
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {a.totalQuestions > 0
                        ? `${a.correctCount} / ${a.totalQuestions}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.isGraded ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <CheckCircle className="h-3 w-3" />
                          Graded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.completedAt ?? a.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.completedAt && (
                        <button
                          type="button"
                          onClick={() => handleRetakeSingle(a)}
                          disabled={retakingId === a.attemptId}
                          title="Cho phép sinh viên làm lại"
                          className="mr-2 inline-flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {retakingId === a.attemptId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Retake
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAttemptDetail(a)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attempt Detail Modal */}
      {detailModalOpen && (
        <AttemptDetailModal
          detail={detailLoading ? null : attemptDetail}
          onClose={() => {
            setDetailModalOpen(false);
            setAttemptDetail(null);
            setSelectedAttempt(null);
          }}
        />
      )}
    </div>
  );
}
