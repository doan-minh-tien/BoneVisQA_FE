'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FileCheck,
  Edit3,
  Bolt,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ThumbsUp,
  BookOpen,
  BotMessageSquare,
  ImageOff,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStudentQuestions } from '@/lib/api/lecturer';
import { escalateToExpert, approveAnswer, respondToQuestion } from '@/lib/api/lecturer-triage';
import { getLecturerClasses } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { ClassItem, LectStudentQuestionDto } from '@/lib/api/types';

const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low'] as const;
type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

function confidenceLevel(score: number | null | undefined): ConfidenceLevel {
  if (score == null) return 'Medium';
  if (score >= 0.8) return 'High';
  if (score >= 0.5) return 'Medium';
  return 'Low';
}

function confidenceColor(level: ConfidenceLevel): string {
  if (level === 'High')
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (level === 'Medium')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
}

export default function QATriagePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [questions, setQuestions] = useState<LectStudentQuestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [escalateError, setEscalateError] = useState<string | null>(null);

  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalateNote, setEscalateNote] = useState('');
  const [selectedDept, setSelectedDept] = useState('radiology');

  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [editStructuredDiagnosis, setEditStructuredDiagnosis] = useState('');
  const [editDifferentialDiagnoses, setEditDifferentialDiagnoses] = useState('');
  const [modifying, setModifying] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);

  const currentQ = questions[currentIndex] ?? null;
  const total = questions.length;

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) return;
    getLecturerClasses(userId)
      .then((data) => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      })
      .catch(console.error);
  }, []);

  const loadQuestions = useCallback(async (classId: string) => {
    setLoading(true);
    setLoadError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setEscalated(false);
    try {
      const data = await getStudentQuestions(classId);
      setQuestions(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) loadQuestions(selectedClassId);
  }, [selectedClassId, loadQuestions]);

  const handleApprove = async () => {
    if (!currentQ || !selectedClassId) return;
    try {
      await approveAnswer(selectedClassId, currentQ.id, currentQ.answerText ?? '');
      setQuestions((prev) => prev.filter((q) => q.id !== currentQ.id));
      if (currentIndex >= questions.length - 1) setCurrentIndex((i) => Math.max(0, i - 1));
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const openModifyDialog = () => {
    if (!currentQ) return;
    setEditAnswerText(currentQ.answerText ?? '');
    setEditStructuredDiagnosis('');
    setEditDifferentialDiagnoses('');
    setModifyError(null);
    setShowModifyDialog(true);
  };

  const handleModifySubmit = async () => {
    if (!currentQ || !selectedClassId || !editAnswerText.trim()) return;
    setModifying(true);
    setModifyError(null);
    try {
      await respondToQuestion(selectedClassId, currentQ.id, {
        answerText: editAnswerText.trim(),
        structuredDiagnosis: editStructuredDiagnosis.trim() || undefined,
        differentialDiagnoses: editDifferentialDiagnoses.trim() || undefined,
        approve: false,
      });
      setShowModifyDialog(false);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === currentQ.id
            ? { ...q, answerText: editAnswerText.trim(), answerStatus: 'Edited' }
            : q,
        ),
      );
    } catch (e) {
      setModifyError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setModifying(false);
    }
  };

  const handleEscalate = async () => {
    if (!currentQ) return;
    setEscalating(true);
    setEscalateError(null);
    try {
      await escalateToExpert(currentQ.id);
      setEscalated(true);
      setShowEscalateDialog(false);
      setEscalateNote('');
    } catch (e) {
      setEscalateError(e instanceof Error ? e.message : 'Escalation failed');
    } finally {
      setEscalating(false);
    }
  };

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  const pendingCount = questions.filter((q) => !q.escalatedById).length;
  const escalatedCount = questions.filter((q) => q.escalatedById).length;
  const avgScore =
    questions.length > 0
      ? questions.reduce((s, q) => s + (q.aiConfidenceScore ?? 0), 0) / questions.length
      : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Validation Workbench</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-primary">QA Triage</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-card-foreground">
            Case #{currentQ?.caseId.slice(0, 8).toUpperCase() ?? '—'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= total - 1}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next case
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Class selector + stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Class filter
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20"
          >
            {classes.length === 0 && <option value="">No classes found</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className} ({c.semester})
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/40">
              <FileCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Pending review</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">{pendingCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-900/40">
              <Bolt className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Escalated</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">{escalatedCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="rounded-xl bg-cyan-100 p-2 dark:bg-cyan-900/40">
              <BotMessageSquare className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Avg. AI confidence</p>
          <p className="mt-1 text-3xl font-black text-card-foreground">
            {questions.length > 0 ? `${Math.round(avgScore * 100)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-[2rem] border border-border bg-card">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="font-semibold text-destructive">{loadError}</p>
          <Button className="mt-4" onClick={() => selectedClassId && loadQuestions(selectedClassId)}>
            Retry
          </Button>
        </div>
      ) : !currentQ ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card">
          <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground">No questions to review</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {classes.length === 0
              ? 'You have no classes assigned.'
              : 'All student questions in this class have been resolved.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Left column: student context + knowledge snippet */}
          <div className="col-span-12 space-y-6 lg:col-span-4">
            {/* Student info */}
            <div className="rounded-[2rem] border border-border/60 bg-card p-7 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                  {(currentQ.studentName || '?')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submitted by</p>
                  <h3 className="text-lg font-bold text-card-foreground">{currentQ.studentName}</h3>
                  <p className="text-xs text-muted-foreground">{currentQ.studentEmail}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="mb-1 text-xs font-bold text-muted-foreground">Module</p>
                  <p className="text-sm font-medium text-card-foreground">{currentQ.caseTitle}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="mb-1 text-xs font-bold text-muted-foreground">Case reference</p>
                  <p className="text-sm font-medium italic text-card-foreground">
                    #{currentQ.caseId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                {currentQ.createdAt && (
                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="mb-1 text-xs font-bold text-muted-foreground">Asked at</p>
                    <p className="text-sm font-medium text-card-foreground">
                      {new Date(currentQ.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Knowledge base snippet */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-7 text-white">
              <div className="relative z-10">
                <h4 className="mb-3 flex items-center gap-2 font-headline font-bold">
                  <BookOpen className="h-5 w-5 text-cyan-300" />
                  Knowledge base hit
                </h4>
                <p className="text-sm leading-relaxed text-slate-300">
                  Based on the question context, the AI retrieved relevant anatomical references from the
                  bone pathology knowledge base. Cross-reference with standard radiographic anatomy texts
                  recommended.
                </p>
              </div>
              <div className="absolute right-0 top-0 p-8 opacity-10">
                <BookOpen className="h-24 w-24" />
              </div>
            </div>
          </div>

          {/* Right column: QA interaction */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {/* Student question */}
            <div className="rounded-[2rem] border-l-4 border-primary bg-card p-8 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-tight text-primary">
                  Student question
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {total}
                </span>
              </div>
              <p className="text-xl font-medium leading-snug text-card-foreground">
                {currentQ.questionText}
              </p>
            </div>

            {/* AI answer */}
            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-white">
                    <BotMessageSquare className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-secondary">Curator AI Response</span>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${confidenceColor(confidenceLevel(currentQ.aiConfidenceScore))}`}
                  >
                    {Math.round((currentQ.aiConfidenceScore ?? 0) * 100)}% Confidence
                  </span>
                </div>
              </div>

              {currentQ.answerText ? (
                <div className="prose prose-sm max-w-none">
                  {currentQ.answerText.split('\n').map((line, i) => (
                    <p key={i} className="mb-3 text-card-foreground leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[100px] items-center justify-center rounded-2xl bg-muted/30">
                  <p className="text-sm text-muted-foreground italic">No AI answer generated yet.</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve answer
                  </button>
                  <button
                    type="button"
                    onClick={openModifyDialog}
                    className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Edit3 className="h-4 w-4" />
                    Modify answer
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEscalateDialog(true);
                    setEscalateError(null);
                    setEscalateNote('');
                  }}
                  className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-6 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Bolt className="h-4 w-4" />
                  Escalate to expert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalate dialog */}
      {showEscalateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !escalating && setShowEscalateDialog(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
            <div className="p-10">
              {/* Dialog header */}
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <Bolt className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-card-foreground">
                      Escalate to expert
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Route this query to a Subject Matter Specialist
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={escalating}
                  onClick={() => setShowEscalateDialog(false)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Department selection */}
              <div className="mb-6 space-y-3">
                <label className="block text-sm font-bold text-card-foreground">
                  Select clinical department
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'radiology', label: 'Thoracic Radiology', sub: '3 experts online' },
                    { id: 'vascular', label: 'Vascular Surgery', sub: '1 expert online' },
                  ].map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDept(dept.id)}
                      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                        selectedDept === dept.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                      }`}
                    >
                      <div
                        className={`mt-0.5 rounded-lg p-1.5 ${
                          selectedDept === dept.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-card-foreground">{dept.label}</p>
                        <p className="text-xs text-muted-foreground">{dept.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification note */}
              <div className="mb-6 space-y-2">
                <label className="block text-sm font-bold text-card-foreground">
                  Justification note
                </label>
                <textarea
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  placeholder="Explain why this requires expert intervention…"
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-muted/30 p-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Priority toggle */}
              <div className="mb-8 flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-bold text-card-foreground">Standard priority</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Estimated 2h response</span>
                  <button
                    type="button"
                    className="relative h-6 w-11 rounded-full bg-muted-foreground/20 p-1 transition-colors"
                  >
                    <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
                  </button>
                </div>
              </div>

              {escalateError && (
                <p className="mb-4 text-sm text-destructive">{escalateError}</p>
              )}

              {/* Dialog footer */}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={escalating}
                  onClick={() => setShowEscalateDialog(false)}
                  className="flex-1 rounded-full py-4 font-bold text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={escalating}
                  onClick={handleEscalate}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {escalating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send to expert
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify answer dialog */}
      {showModifyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !modifying && setShowModifyDialog(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
            <div className="p-10">
              {/* Dialog header */}
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-card-foreground">
                      Modify AI Answer
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Edit the response before approving for student review
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={modifying}
                  onClick={() => setShowModifyDialog(false)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Question context */}
              <div className="mb-6 rounded-2xl border border-border/60 bg-muted/30 p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Student Question
                </p>
                <p className="text-sm font-medium text-card-foreground">{currentQ?.questionText}</p>
              </div>

              {/* Answer text */}
              <div className="mb-5 space-y-2">
                <label className="block text-sm font-bold text-card-foreground">
                  Response text <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={editAnswerText}
                  onChange={(e) => setEditAnswerText(e.target.value)}
                  rows={8}
                  placeholder="Write or edit the curator's response…"
                  className="w-full rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-relaxed focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Structured diagnosis */}
              <div className="mb-5 space-y-2">
                <label className="block text-sm font-bold text-card-foreground">
                  Structured diagnosis
                </label>
                <input
                  type="text"
                  value={editStructuredDiagnosis}
                  onChange={(e) => setEditStructuredDiagnosis(e.target.value)}
                  placeholder="e.g., Spiral fracture of the tibial shaft (AO 42-A3)"
                  className="w-full rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Differential diagnoses */}
              <div className="mb-6 space-y-2">
                <label className="block text-sm font-bold text-card-foreground">
                  Differential diagnoses
                </label>
                <textarea
                  value={editDifferentialDiagnoses}
                  onChange={(e) => setEditDifferentialDiagnoses(e.target.value)}
                  rows={3}
                  placeholder="List alternative diagnoses to consider…"
                  className="w-full rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-relaxed focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {modifyError && (
                <p className="mb-4 text-sm text-destructive">{modifyError}</p>
              )}

              {/* Dialog footer */}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={modifying}
                  onClick={() => setShowModifyDialog(false)}
                  className="flex-1 rounded-full py-4 font-bold text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modifying || !editAnswerText.trim()}
                  onClick={handleModifySubmit}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modifying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Save &amp; Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation success toast */}
      {escalated && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-6 py-4 shadow-xl dark:bg-emerald-950/50">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-200">Escalation sent</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Expert team has been notified.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEscalated(false)}
            className="ml-2 rounded-lg p-1 hover:bg-emerald-100"
          >
            <X className="h-4 w-4 text-emerald-600" />
          </button>
        </div>
      )}
    </div>
  );
}
