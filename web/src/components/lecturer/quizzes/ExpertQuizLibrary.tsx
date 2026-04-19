'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  fetchExpertQuizzesForLecturer,
  fetchExpertQuizQuestions,
  assignExpertQuizToClass,
  type ExpertQuizForLecturer,
  type ExpertQuizQuestion,
} from '@/lib/api/lecturer-expert-quiz';
import { fetchLecturerClasses } from '@/lib/api/lecturer-classes';
import { resolveApiAssetUrl } from '@/lib/api/client';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  Loader2,
  X,
  Image as ImageIcon,
  BookOpen,
  UserCheck,
  AlertCircle,
  Check,
} from 'lucide-react';

// ========== TYPES ==========

interface EnrichedQuiz extends ExpertQuizForLecturer {
  status: 'Active' | 'Draft' | 'Completed';
  formattedCreatedAt: string;
}

// ========== HELPERS ==========

function utcToLocalDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  // Convert UTC to local timezone (UTC+7)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeLocalToIso(local: string): string {
  const t = local.trim();
  if (!t) return '';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function getStatus(openTime: string | null, closeTime: string | null): 'Active' | 'Draft' | 'Completed' {
  const now = new Date();
  const open = openTime ? new Date(openTime) : null;
  const close = closeTime ? new Date(closeTime) : null;

  if (close && now > close) return 'Completed';
  if (open && now < open) return 'Draft';
  return 'Active';
}

// ========== PREVIEW MODAL ==========

function PreviewModal({
  quiz,
  onClose,
  onAssign,
}: {
  quiz: EnrichedQuiz;
  onClose: () => void;
  onAssign: () => void;
}) {
  const [questions, setQuestions] = useState<ExpertQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [quiz.id]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpertQuizQuestions(quiz.id);
      setQuestions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">{quiz.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {quiz.questionCount} câu hỏi • Độ khó: {quiz.difficulty ?? '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive py-8">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : questions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Quiz này chưa có câu hỏi nào.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.questionId} className="rounded-xl border border-border bg-input/20 overflow-hidden">
                  {/* Ảnh câu hỏi */}
                  {q.imageUrl && (
                    <div className="bg-muted/50 p-4 border-b border-border">
                      <img
                        src={resolveApiAssetUrl(q.imageUrl)}
                        alt={`Question ${idx + 1}`}
                        className="max-h-64 mx-auto rounded-lg object-contain"
                      />
                    </div>
                  )}

                  {/* Nội dung câu hỏi */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-base font-medium text-card-foreground leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                      {[
                        { key: 'A', value: q.optionA },
                        { key: 'B', value: q.optionB },
                        { key: 'C', value: q.optionC },
                        { key: 'D', value: q.optionD },
                      ].map(
                        (opt) =>
                          opt.value && (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-2 p-3 rounded-lg border ${
                                q.correctAnswer?.toUpperCase() === opt.key
                                  ? 'border-secondary bg-secondary/10'
                                  : 'border-border bg-card'
                              }`}
                            >
                              <span
                                className={`font-bold text-sm w-6 h-6 flex items-center justify-center rounded ${
                                  q.correctAnswer?.toUpperCase() === opt.key
                                    ? 'bg-secondary text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="text-sm text-card-foreground">{opt.value}</span>
                              {q.correctAnswer?.toUpperCase() === opt.key && (
                                <CheckCircle className="h-4 w-4 text-secondary ml-auto" />
                              )}
                            </div>
                          )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={onAssign}
            className="px-6 py-2.5 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Gán vào lớp
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== ASSIGN MODAL ==========

interface AssignModalProps {
  quiz: EnrichedQuiz;
  onClose: () => void;
  onAssigned: () => void;
}

function AssignModal({ quiz, onClose, onAssigned }: AssignModalProps) {
  const toast = useToast();
  const [classes, setClasses] = useState<{ id: string; className: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [openTime, setOpenTime] = useState<string | ''>(
    utcToLocalDatetimeLocal(quiz.openTime)
  );
  const [closeTime, setCloseTime] = useState<string | ''>(
    utcToLocalDatetimeLocal(quiz.closeTime)
  );
  const [timeLimit, setTimeLimit] = useState<number | ''>(quiz.timeLimit ?? '');
  const [passingScore, setPassingScore] = useState<number | ''>(quiz.passingScore ?? '');

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const removeClass = (classId: string) => {
    setSelectedClassIds((prev) => prev.filter((id) => id !== classId));
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await fetchLecturerClasses();
      setClasses(data);
      // Không preset lớp nào, để user tự chọn
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class.');
      return;
    }
    setAssigning(true);

    // ============================================
    // CLAMP LOGIC - Tương tự backend
    // ============================================
    let effectiveTimeLimit = typeof timeLimit === 'number' ? timeLimit : null;
    let effectivePassingScore = typeof passingScore === 'number' ? passingScore : null;
    const warnings: string[] = [];

    if (quiz.timeLimit != null && effectiveTimeLimit != null) {
      const minTimeLimit = Math.max(5, Math.floor(quiz.timeLimit * 0.5));
      const maxTimeLimit = Math.min(180, Math.ceil(quiz.timeLimit * 1.5));

      if (effectiveTimeLimit < minTimeLimit) {
        effectiveTimeLimit = minTimeLimit;
        warnings.push(`Time limit adjusted to ${minTimeLimit} min (min allowed)`);
      } else if (effectiveTimeLimit > maxTimeLimit) {
        effectiveTimeLimit = maxTimeLimit;
        warnings.push(`Time limit adjusted to ${maxTimeLimit} min (max allowed)`);
      }
    } else if (effectiveTimeLimit == null) {
      // Nếu lecturer không nhập → dùng giá trị Expert
      effectiveTimeLimit = quiz.timeLimit ?? 30;
    }

    if (quiz.passingScore != null && effectivePassingScore != null) {
      const minPassingScore = Math.max(0, quiz.passingScore - 10);
      const maxPassingScore = Math.min(100, quiz.passingScore + 10);

      if (effectivePassingScore < minPassingScore) {
        effectivePassingScore = minPassingScore;
        warnings.push(`Passing score adjusted to ${minPassingScore}% (min allowed)`);
      } else if (effectivePassingScore > maxPassingScore) {
        effectivePassingScore = maxPassingScore;
        warnings.push(`Passing score adjusted to ${maxPassingScore}% (max allowed)`);
      }
    } else if (effectivePassingScore == null) {
      // Nếu lecturer không nhập → dùng giá trị Expert
      effectivePassingScore = quiz.passingScore ?? 70;
    }

    try {
      const selectedClassNames = selectedClassIds
        .map((id) => classes.find((c) => c.id === id)?.className)
        .filter(Boolean)
        .join(', ');

      await Promise.all(
        selectedClassIds.map((classId) =>
          assignExpertQuizToClass(classId, quiz.id, {
            openTime: openTime ? localDatetimeLocalToIso(openTime) : null,
            closeTime: closeTime ? localDatetimeLocalToIso(closeTime) : null,
            timeLimitMinutes: effectiveTimeLimit,
            passingScore: effectivePassingScore,
          })
        )
      );

      let successMsg = `Quiz assigned successfully to ${selectedClassIds.length} classes`;
      if (warnings.length > 0) {
        successMsg += ` (${warnings.join('; ')})`;
      }

      toast.success(successMsg);
      onAssigned();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign quiz.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Gán Quiz vào Lớp</h2>
            <p className="text-sm text-muted-foreground mt-1">{quiz.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Chọn lớp học <span className="text-destructive">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <>
                {/* Selected classes tags */}
                {selectedClassIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                    {selectedClassIds.map((classId) => {
                      const cls = classes.find((c) => c.id === classId);
                      if (!cls) return null;
                      return (
                        <span
                          key={classId}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white rounded-full text-xs font-medium"
                        >
                          {cls.className}
                          <button
                            onClick={() => removeClass(classId)}
                            className="hover:bg-primary-foreground/20 rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Class dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring text-left cursor-pointer flex items-center justify-between"
                  >
                    <span className={selectedClassIds.length > 0 ? 'text-card-foreground' : 'text-muted-foreground'}>
                      {selectedClassIds.length === 0
                        ? 'Select classes...'
                        : `${selectedClassIds.length} classes selected`}
                    </span>
                    <span className="text-muted-foreground">▼</span>
                  </button>

                  {showClassDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {classes.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No classes available</p>
                      ) : (
                        classes.map((cls) => {
                          const isSelected = selectedClassIds.includes(cls.id);
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleClass(cls.id);
                              }}
                              className={`w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors flex items-center justify-between ${
                                isSelected
                                  ? 'bg-primary/5 text-primary'
                                  : 'hover:bg-muted/50 text-card-foreground'
                              }`}
                            >
                              <span>{cls.className}</span>
                              {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quiz Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-card-foreground">Quiz Info</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Questions:</span> {quiz.questionCount}
              </div>
              <div>
                <span className="font-medium">Difficulty:</span> {quiz.difficulty ?? '—'}
              </div>
              <div>
                <span className="font-medium">Expert:</span> {quiz.expertName ?? '—'}
              </div>
              <div>
                <span className="font-medium">Topic:</span> {quiz.topic ?? '—'}
              </div>
            </div>
          </div>

          {/* Time Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Open Time</label>
              <input
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Close Time</label>
              <input
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Time Limit (minutes)</label>
              <div className="relative">
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : '')}
                  placeholder={String(quiz.timeLimit ?? 30)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {quiz.timeLimit != null && (
                  <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
                    Expert default: {quiz.timeLimit} min (allowed: {Math.max(5, Math.floor(quiz.timeLimit * 0.5))}-{Math.min(180, Math.ceil(quiz.timeLimit * 1.5))} min)
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Passing Score</label>
              <div className="relative">
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value ? Number(e.target.value) : '')}
                  placeholder={String(quiz.passingScore ?? 70)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {quiz.passingScore != null && (
                  <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
                    Expert default: {quiz.passingScore}% (allowed: {Math.max(0, quiz.passingScore - 10)}-{Math.min(100, quiz.passingScore + 10)}%)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || selectedClassIds.length === 0}
            className="px-6 py-2.5 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
            Assign to {selectedClassIds.length} classes
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========

interface ExpertQuizLibraryProps {
  onAssignSuccess?: () => void;
}

export default function ExpertQuizLibrary({ onAssignSuccess }: ExpertQuizLibraryProps) {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<EnrichedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Modals
  const [previewQuiz, setPreviewQuiz] = useState<EnrichedQuiz | null>(null);
  const [assignQuiz, setAssignQuiz] = useState<EnrichedQuiz | null>(null);

  const PAGE_SIZE = 8;

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpertQuizzesForLecturer(1, 100);
      const enriched: EnrichedQuiz[] = data.items.map((q) => ({
        ...q,
        status: getStatus(q.openTime, q.closeTime),
        formattedCreatedAt: formatDate(q.createdAt),
      }));
      setQuizzes(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quizzes.');
      toast.error(e instanceof Error ? e.message : 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (q.expertName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const difficultyOptions = ['all', 'Easy', 'Medium', 'Hard'];

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              Expert Quiz Library
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Chọn quiz từ thư viện của Expert để gán vào lớp học của bạn.
            </p>
          </div>
          <button
            onClick={loadQuizzes}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Làm mới
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search quizzes, topics, Expert..."
              className="h-10 w-full rounded-full border border-border bg-input pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-full border border-border bg-input px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            {difficultyOptions.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All difficulties' : d}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive py-8">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Không tìm thấy quiz nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paged.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-card-foreground">{quiz.title}</h4>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          quiz.status === 'Active'
                            ? 'bg-secondary/15 text-secondary'
                            : quiz.status === 'Completed'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full bg-current" />
                        {quiz.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {quiz.questionCount} câu
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        {quiz.difficulty ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        {quiz.expertName ?? '—'}
                      </span>
                      {quiz.topic && <span className="text-muted-foreground/70">• {quiz.topic}</span>}
                    </div>

                    {(quiz.openTime || quiz.closeTime) && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {quiz.openTime && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Mở: {formatDateShort(quiz.openTime)}
                          </span>
                        )}
                        {quiz.closeTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Đóng: {formatDateShort(quiz.closeTime)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem trước
                    </button>
                    <button
                      onClick={() => setAssignQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Gán
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-white text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-white text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {previewQuiz && (
        <PreviewModal
          quiz={previewQuiz}
          onClose={() => setPreviewQuiz(null)}
          onAssign={() => {
            setAssignQuiz(previewQuiz);
            setPreviewQuiz(null);
          }}
        />
      )}

      {assignQuiz && (
        <AssignModal
          quiz={assignQuiz}
          onClose={() => setAssignQuiz(null)}
          onAssigned={() => {
            onAssignSuccess?.();
            loadQuizzes();
          }}
        />
      )}
    </>
  );
}
