'use client';

import { useEffect, useMemo, useState } from 'react';
import ExpertHeader from '@/components/expert/ExpertHeader';
import {
  FileText, Search, Plus, CheckCircle, Clock, Trash2, Eye,
  ChevronDown, ChevronRight, Loader2, Calendar, Edit,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getStoredUserId } from '@/lib/getStoredUserId';
import {
  createExpertQuiz,
  deleteExpertQuiz,
  fetchExpertQuizzesPaged,
  updateExpertQuiz,
  type ExpertQuiz,
  type ExpertQuizDifficulty,
} from '@/lib/api/expert-quizzes';
import QuizQuestionsPanel from '@/components/expert/quizzes/QuizQuestionsPanel';
import QuizAssignScorePanel from '@/components/expert/quizzes/QuizAssignScorePanel';

type QuizStatus = 'active' | 'draft' | 'closed';

function isoToLocalInputValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function localInputValueToIso(v: string): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function computeStatus(openTime: string, closeTime: string): QuizStatus {
  const open = Date.parse(openTime);
  const close = Date.parse(closeTime);
  const now = Date.now();
  if (!Number.isFinite(open) || !Number.isFinite(close)) return 'draft';
  if (now < open) return 'draft';
  if (now > close) return 'closed';
  return 'active';
}

const statusConfig: Record<QuizStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Active' },
  draft: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Draft' },
  closed: { icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Closed' },
};

export default function ExpertQuizzesPage() {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<ExpertQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 10;
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuizStatus | 'All'>('All');
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<ExpertQuiz | null>(null);

  const [dialog, setDialog] = useState<{ q: ExpertQuiz; action: 'delete' } | null>(null);

  const [form, setForm] = useState<{
    title: string;
    topic: string;
    openTime: string;
    closeTime: string;
    timeLimit: number;
    passingScore: number;
    isAiGenerated: boolean;
    difficulty: ExpertQuizDifficulty;
    classification: string;
  }>({
    title: '',
    topic: '',
    openTime: '',
    closeTime: '',
    timeLimit: 30,
    passingScore: 70,
    isAiGenerated: false,
    difficulty: 'Easy',
    classification: '',
  });

  const loadQuizzes = async () => {
    try {
      setError(null);
      const res = await fetchExpertQuizzesPaged(pageIndex, PAGE_SIZE);
      setQuizzes(res.items);
      setTotalCount(res.totalCount);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load quizzes.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    setExpandedQuiz(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      const s = search.trim().toLowerCase();
      const match =
        q.title.toLowerCase().includes(s) ||
        (q.topic ?? '').toLowerCase().includes(s) ||
        (q.classification ?? '').toLowerCase().includes(s) ||
        String(q.difficulty).toLowerCase().includes(s);
      const qStatus = computeStatus(q.openTime, q.closeTime);
      const matchStatus = filterStatus === 'All' || qStatus === filterStatus;
      return match && matchStatus;
    });
  }, [quizzes, search, filterStatus]);

  const openCreateForm = () => {
    setEditingQuiz(null);
    setForm({
      title: '',
      topic: '',
      openTime: '',
      closeTime: '',
      timeLimit: 30,
      passingScore: 70,
      isAiGenerated: false,
      difficulty: 'Easy',
      classification: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (q: ExpertQuiz) => {
    setEditingQuiz(q);
    setForm({
      title: q.title,
      topic: q.topic ?? '',
      openTime: isoToLocalInputValue(q.openTime),
      closeTime: isoToLocalInputValue(q.closeTime),
      timeLimit: q.timeLimit ?? 0,
      passingScore: q.passingScore ?? 0,
      isAiGenerated: q.isAiGenerated ?? false,
      difficulty: (q.difficulty === 'Hard' || q.difficulty === 'Medium' || q.difficulty === 'Easy'
        ? q.difficulty
        : 'Easy') as ExpertQuizDifficulty,
      classification: q.classification ?? '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required.');
    const openIso = localInputValueToIso(form.openTime);
    const closeIso = localInputValueToIso(form.closeTime);
    if (!openIso || !closeIso) return toast.error('Open time and close time are required.');
    if (Date.parse(openIso) > Date.parse(closeIso)) {
      return toast.error('Open time must be before or equal to close time.');
    }

    const payload = {
      title: form.title.trim(),
      topic: form.topic.trim() ? form.topic.trim() : null,
      openTime: openIso,
      closeTime: closeIso,
      timeLimit: Number(form.timeLimit),
      passingScore: Number(form.passingScore),
      isAiGenerated: Boolean(form.isAiGenerated),
      difficulty: form.difficulty,
      classification: form.classification.trim() ? form.classification.trim() : null,
      createdByExpertId: getStoredUserId() || undefined,
    };

    try {
      setIsMutating(true);
      if (editingQuiz) {
        await updateExpertQuiz(editingQuiz.id, payload);
        toast.success('Quiz updated successfully.');
      } else {
        await createExpertQuiz(payload);
        toast.success('Quiz created successfully.');
      }
      setIsFormOpen(false);
      await loadQuizzes();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed.';
      toast.error(msg);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsMutating(true);
      await deleteExpertQuiz(id);
      toast.success('Quiz deleted successfully.');
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      setDialog(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed.';
      toast.error(msg);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <ExpertHeader
        title="Quiz Management"
        subtitle={`${totalCount} quizzes · Page ${pageIndex}/${totalPages}`}
      />
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium">
            <Plus className="w-4 h-4" />Create Quiz
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as QuizStatus | 'All')}
            className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Global Assign & Score tools */}
        <div className="mb-6">
          <QuizAssignScorePanel />
        </div>

        {dialog && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDialog(null)} />
            <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">Delete Quiz</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Delete <strong className="text-card-foreground">{dialog.q.title}</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDialog(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
                <button
                  disabled={isMutating}
                  onClick={() => handleDelete(dialog.q.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-destructive hover:bg-destructive/90`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsFormOpen(false)} />
            <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                {editingQuiz ? 'Edit Expert Quiz' : 'Create Expert Quiz'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Quiz title..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Topic</label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                    placeholder="e.g., Femoral Neck Fracture"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value as ExpertQuizDifficulty }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Classification</label>
                  <input
                    type="text"
                    value={form.classification}
                    onChange={(e) => setForm((p) => ({ ...p, classification: e.target.value }))}
                    placeholder="e.g., year 2"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Open Time</label>
                  <input
                    type="datetime-local"
                    value={form.openTime}
                    onChange={(e) => setForm((p) => ({ ...p, openTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Close Time</label>
                  <input
                    type="datetime-local"
                    value={form.closeTime}
                    onChange={(e) => setForm((p) => ({ ...p, closeTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={form.timeLimit}
                    onChange={(e) => setForm((p) => ({ ...p, timeLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1.5">Passing Score (%)</label>
                  <input
                    type="number"
                    value={form.passingScore}
                    onChange={(e) => setForm((p) => ({ ...p, passingScore: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isAiGenerated}
                    onChange={(e) => setForm((p) => ({ ...p, isAiGenerated: e.target.checked }))}
                  />
                  AI Generated
                </label>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  disabled={isMutating}
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isMutating}
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {editingQuiz ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quizzes List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-card-foreground">Quiz Management</span>
              {!isLoading && <span className="text-xs text-muted-foreground font-normal">({totalCount} total)</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={openCreateForm} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-xs font-medium">
                <Plus className="w-3.5 h-3.5" />Create Quiz
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-lg font-medium text-card-foreground">Loading quizzes...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-lg font-medium text-destructive">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium text-card-foreground">No quizzes found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((quiz) => {
                const qStatus = computeStatus(quiz.openTime, quiz.closeTime);
                const st = statusConfig[qStatus];
                const StIcon = st.icon;
                const isExp = expandedQuiz === quiz.id;
                return (
                  <div key={quiz.id} className="px-5 py-4 hover:bg-input/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => setExpandedQuiz(isExp ? null : quiz.id)} className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0">
                        {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground">{quiz.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">{quiz.topic ?? 'General'}</span>
                            <span>&middot;</span>
                            <span>{quiz.difficulty}</span>
                            {quiz.classification ? (
                              <>
                                <span>&middot;</span>
                                <span>{quiz.classification}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </button>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.color}`}><StIcon className="w-3.5 h-3.5" />{st.label}</span>
                    </div>

                    {isExp && (
                      <div className="mt-3 ml-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isMutating}
                            onClick={() => openEditForm(quiz)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            disabled={isMutating}
                            onClick={() => setDialog({ q: quiz, action: 'delete' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-input/30 text-center">
                            <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">Open</p>
                            <p className="text-sm font-bold text-card-foreground">{quiz.openTime ? String(new Date(quiz.openTime).toLocaleString()) : '-'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-input/30 text-center">
                            <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">Close</p>
                            <p className="text-sm font-bold text-card-foreground">{quiz.closeTime ? String(new Date(quiz.closeTime).toLocaleString()) : '-'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-input/30 text-center">
                            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">Time Limit</p>
                            <p className="text-sm font-bold text-card-foreground">{quiz.timeLimit} min</p>
                            <p className="text-xs text-muted-foreground mt-1">Passing: {quiz.passingScore}%</p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Created: <span className="text-card-foreground font-medium">{quiz.createdAt ? String(new Date(quiz.createdAt).toLocaleString()) : '-'}</span>
                          {quiz.expertName ? (
                            <>
                              {' '}
                              · By <span className="text-card-foreground font-medium">{quiz.expertName}</span>
                            </>
                          ) : null}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          AI Generated: <span className="text-card-foreground font-medium">{quiz.isAiGenerated ? 'Yes' : 'No'}</span>
                        </div>
                        <QuizQuestionsPanel quizId={quiz.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            disabled={isLoading || pageIndex <= 1}
            onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50 cursor-pointer transition-colors"
          >
            Prev
          </button>
          <div className="text-sm text-muted-foreground">
            Page {pageIndex} / {totalPages}
          </div>
          <button
            disabled={isLoading || pageIndex >= totalPages}
            onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50 cursor-pointer transition-colors"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
