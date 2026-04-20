'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  fetchExpertQuizzesForLecturer,
  fetchExpertQuizQuestions,
  assignExpertQuizToClass,
  copyExpertQuiz,
  updateQuizQuestion,
  deleteQuiz,
  type ExpertQuizForLecturer,
  type ExpertQuizQuestion,
  type UpdateQuestionRequest,
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
  Pencil,
  Copy,
  Trash2,
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
  return d.toLocaleString('en-GB', {
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
  return d.toLocaleDateString('en-GB', {
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

// ========== QUESTION EDIT MODAL ==========

interface QuestionEditModalProps {
  question: ExpertQuizQuestion;
  onClose: () => void;
  onSave: (updated: ExpertQuizQuestion) => void;
}

function QuestionEditModal({ question, onClose, onSave }: QuestionEditModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    questionText: question.questionText,
    optionA: question.optionA ?? '',
    optionB: question.optionB ?? '',
    optionC: question.optionC ?? '',
    optionD: question.optionD ?? '',
    correctAnswer: question.correctAnswer ?? 'A',
  });

  const handleSave = async () => {
    if (!form.questionText.trim()) {
      toast.error('Please enter question content.');
      return;
    }
    if (!form.optionA.trim() || !form.optionB.trim()) {
      toast.error('Please enter at least 2 answer options.');
      return;
    }

    setSaving(true);
    try {
      const request: UpdateQuestionRequest = {
        questionText: form.questionText,
        type: 'MultipleChoice',
        correctAnswer: form.correctAnswer,
        optionA: form.optionA,
        optionB: form.optionB,
        optionC: form.optionC || null,
        optionD: form.optionD || null,
      };

      await updateQuizQuestion(question.questionId, request);

      const updated: ExpertQuizQuestion = {
        ...question,
        questionText: form.questionText,
        optionA: form.optionA,
        optionB: form.optionB,
        optionC: form.optionC || null,
        optionD: form.optionD || null,
        correctAnswer: form.correctAnswer,
      };

      toast.success('Question updated successfully!');
      onSave(updated);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error updating question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Edit question</h2>
            <p className="text-sm text-muted-foreground mt-1">Update question information</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Question content <span className="text-destructive">*</span>
            </label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Enter question content..."
            />
          </div>

          {question.imageUrl && (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Image</label>
              <img
                src={resolveApiAssetUrl(question.imageUrl)}
                alt="Question image"
                className="max-h-40 rounded-lg object-contain border border-border"
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-card-foreground">Answer options</label>
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, correctAnswer: key })}
                  className={`w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center transition-colors cursor-pointer ${
                    form.correctAnswer === key
                      ? 'bg-secondary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {key}
                </button>
                <input
                  type="text"
                  value={key === 'A' ? form.optionA : key === 'B' ? form.optionB : key === 'C' ? form.optionC : form.optionD}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (key === 'A') setForm({ ...form, optionA: value });
                    else if (key === 'B') setForm({ ...form, optionB: value });
                    else if (key === 'C') setForm({ ...form, optionC: value });
                    else setForm({ ...form, optionD: value });
                  }}
                  placeholder={`Option ${key}`}
                  className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Click on the letter (A, B, C, D) to select the correct answer</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== PREVIEW MODAL ==========

function PreviewModal({
  quiz,
  onClose,
  onAssign,
  onCopied,
}: {
  quiz: EnrichedQuiz;
  onClose: () => void;
  onAssign: () => void;
  onCopied?: (newQuizId: string, newQuizTitle: string) => void;
}) {
  const toast = useToast();
  const [questions, setQuestions] = useState<ExpertQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExpertQuizQuestion | null>(null);

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

  const handleCopyQuiz = async () => {
    const newTitle = window.prompt(
      'Enter a title for the copy of this quiz:',
      `Copy of ${quiz.title}`
    );
    if (newTitle === null) return;

    setCopying(true);
    try {
      const result = await copyExpertQuiz(quiz.id, { title: newTitle || undefined });
      toast.success(`Created a copy: "${result.newQuizTitle}" with ${result.questionCount} questions.`);
      onCopied?.(result.newQuizId, result.newQuizTitle);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error copying quiz.');
    } finally {
      setCopying(false);
    }
  };

  const handleQuestionSaved = (updated: ExpertQuizQuestion) => {
    setQuestions((prev) =>
      prev.map((q) => (q.questionId === updated.questionId ? updated : q))
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{quiz.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {quiz.questionCount} questions • Difficulty: {quiz.difficulty ?? '—'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

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
              <p className="text-center text-muted-foreground py-8">This quiz has no questions yet.</p>
            ) : (
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.questionId} className="rounded-xl border border-border bg-input/20 overflow-hidden">
                    {q.imageUrl && (
                      <div className="bg-muted/50 p-4 border-b border-border">
                        <img
                          src={resolveApiAssetUrl(q.imageUrl)}
                          alt={`Question ${idx + 1}`}
                          className="max-h-64 mx-auto rounded-lg object-contain"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-base font-medium text-card-foreground leading-relaxed flex-1">
                          {q.questionText}
                        </p>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>

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

          <div className="flex items-center justify-end gap-3 p-6 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleCopyQuiz}
              disabled={copying}
              className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {copying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy quiz
                </>
              )}
            </button>
            <button
              onClick={onAssign}
              className="px-6 py-2.5 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Assign to class
            </button>
          </div>
        </div>
      </div>

      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleQuestionSaved}
        />
      )}
    </>
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

    const warnings: string[] = [];
    if (openTime && closeTime && new Date(openTime) >= new Date(closeTime)) {
      warnings.push('Open time must be before close time.');
    }

    if (warnings.length > 0) {
      const confirmed = window.confirm(
        'There are some warnings:\n\n' + warnings.join('\n') + '\n\nDo you still want to continue?'
      );
      if (!confirmed) return;
    }

    setAssigning(true);
    try {
      const isoOpen = openTime ? localDatetimeLocalToIso(openTime) : null;
      const isoClose = closeTime ? localDatetimeLocalToIso(closeTime) : null;

      const results = await Promise.all(
        selectedClassIds.map(async (classId) => {
          try {
            const result = await assignExpertQuizToClass(classId, quiz.id, {
              openTime: isoOpen,
              closeTime: isoClose,
              timeLimitMinutes: timeLimit === '' ? null : (typeof timeLimit === 'number' ? timeLimit : null),
              passingScore: passingScore === '' ? null : (typeof passingScore === 'number' ? passingScore : null),
            });
            return { classId, success: true, alreadyAssigned: result.result.isAlreadyAssigned };
          } catch (e) {
            return { classId, success: false, error: e instanceof Error ? e.message : 'Unknown error' };
          }
        })
      );

      const successResults = results.filter(r => r.success);
      const alreadyAssignedCount = successResults.filter(r => r.alreadyAssigned).length;
      const newlyAssignedCount = successResults.filter(r => !r.alreadyAssigned).length;
      const failedResults = results.filter(r => !r.success);

      if (alreadyAssignedCount > 0 && newlyAssignedCount > 0) {
        toast.success(`Successfully assigned quiz to ${newlyAssignedCount} class(es). ${alreadyAssignedCount} class(es) already had this quiz.`);
      } else if (alreadyAssignedCount > 0 && newlyAssignedCount === 0 && failedResults.length === 0) {
        toast.info(`This quiz is already assigned to all ${alreadyAssignedCount} selected class(es).`);
      } else if (newlyAssignedCount > 0 && alreadyAssignedCount === 0 && failedResults.length === 0) {
        toast.success(`Successfully assigned quiz to ${newlyAssignedCount} class(es)!`);
      } else if (newlyAssignedCount === 0 && alreadyAssignedCount === 0 && failedResults.length > 0) {
        toast.error(`Failed to assign quiz: ${failedResults[0].error}`);
      } else {
        toast.success(`Assignment results: ${newlyAssignedCount} succeeded, ${alreadyAssignedCount} already had it, ${failedResults.length} failed.`);
      }

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
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">Assign Quiz to Class</h2>
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
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Select class <span className="text-destructive">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading classes...
              </div>
            ) : (
              <>
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

                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClass(cls.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-muted text-card-foreground hover:bg-muted/80'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        {cls.className}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

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

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Open time (optional)
            </label>
            <input
              type="datetime-local"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Close time (optional)
            </label>
            <input
              type="datetime-local"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Time limit (minutes, optional)
            </label>
            <input
              type="number"
              min="5"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={quiz.timeLimit?.toString() || ''}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {quiz.timeLimit != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Original quiz: {quiz.timeLimit} minutes
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Passing score (optional)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={quiz.passingScore?.toString() || ''}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {quiz.passingScore != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Original quiz: {quiz.passingScore} points
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border shrink-0">
          <button
            type="button"
            disabled={assigning}
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={assigning || selectedClassIds.length === 0}
            onClick={handleAssign}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign to class'
              )}
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

  const [previewQuiz, setPreviewQuiz] = useState<EnrichedQuiz | null>(null);
  const [assignQuiz, setAssignQuiz] = useState<EnrichedQuiz | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedQuiz | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuiz(deleteTarget.id);
      toast.success('Quiz deleted successfully.');
      setDeleteTarget(null);
      loadQuizzes();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = quizzes.filter((q) => {
    if (!q.expertName) return false;

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              Quiz Library
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select quizzes from the library to assign to your classes.
            </p>
          </div>
          <button
            onClick={loadQuizzes}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Refresh
          </button>
        </div>

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
            <p className="text-muted-foreground">No quizzes found.</p>
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
                        {quiz.questionCount} questions
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
                            Opens: {formatDateShort(quiz.openTime)}
                          </span>
                        )}
                        {quiz.closeTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Closes: {formatDateShort(quiz.closeTime)}
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
                      Preview
                    </button>
                    <button
                      onClick={() => setAssignQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            ))}

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

      {previewQuiz && (
        <PreviewModal
          quiz={previewQuiz}
          onClose={() => setPreviewQuiz(null)}
          onAssign={() => {
            setAssignQuiz(previewQuiz);
            setPreviewQuiz(null);
          }}
          onCopied={(newQuizId, newQuizTitle) => {
            toast.success(`Created a copy: "${newQuizTitle}". Please edit questions in your quiz.`);
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

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header with gradient accent */}
            <div className="relative px-6 pt-6 pb-5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/50 via-destructive to-destructive/50" />
              
              <div className="flex items-start gap-4">
                {/* Icon with pulsing animation */}
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-4 ring-destructive/10">
                    <Trash2 className="h-7 w-7 text-destructive" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-destructive/20 animate-ping opacity-50" />
                </div>
                
                <div className="flex-1 pt-1">
                  <h2 className="text-xl font-bold text-card-foreground">Delete Quiz</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">This action cannot be undone</p>
                </div>
                
                <button
                  onClick={() => !deleting && setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-5">
              {/* Quiz info card */}
              <div className="bg-muted/40 rounded-xl p-4 mb-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground truncate">{deleteTarget.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {deleteTarget.questionCount} questions
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {deleteTarget.difficulty ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Warning message */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Are you sure you want to delete this quiz?
                  </p>
                  <p className="mt-2 font-medium text-foreground/80">
                    The quiz and all its questions will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground transition-all hover:bg-muted hover:border-muted-foreground/30 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
