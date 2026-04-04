'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  PlusCircle,
  Timer,
  Percent,
  Upload,
  Save,
  X,
  FilePenLine,
  HelpCircle,
  ListChecks,
  Eye,
  Send,
  Lightbulb,
  ShieldCheck,
  GripVertical,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuestionEditorDialog from '@/components/lecturer/quizzes/QuestionEditorDialog';
import { createQuiz, addQuizQuestion, getQuizQuestions } from '@/lib/api/lecturer-quiz';
import { getLecturerClasses, getLecturerCases } from '@/lib/api/lecturer';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { CaseDto, ClassItem, CreateQuizQuestionRequest, QuizQuestionDto } from '@/lib/api/types';

const CLASSIFICATION_OPTIONS = [
  'Resident Year 1',
  'Resident Year 2',
  'Advanced Diagnostics',
  'Continuing Med Ed',
] as const;

const XRAY_PREVIEW =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAoOGYnw5n4ew-n9Wmv5ZA4YaIuF1gtwGKUQaTZQrkkKXdcm-gLF6sirEOSKBedDTN_IR5NoWWPVV_g4xTKmAcdr3Dtc4O9cgyKfz2Ej5jCrA6edYswSo0Z_sPwKyR-sdadFXKU0hpWlQx1J1U1PUYqeQsg_0TtMzTnYfebYjOhOdHFc6ZcHoceiHyIJJWZ9jSCSdcO4CU1GBGuLbvOK35yDpoi5jRK7YOfOZ0B-jiwF208iK89Z51TTdakoZ6oHGl_eo6h_iMcmq0';

type QuestionLike = CreateQuizQuestionRequest | QuizQuestionDto;

function classificationToBand(c: string): 'RESIDENT' | 'SPECIALIST' | 'FELLOW' {
  if (c.startsWith('Resident Year 1')) return 'RESIDENT';
  if (c.startsWith('Resident Year 2')) return 'SPECIALIST';
  if (c.includes('Advanced')) return 'FELLOW';
  return 'SPECIALIST';
}

function typeLabel(type: string | null | undefined): string {
  const t = (type || 'MultipleChoice').toLowerCase();
  if (t === 'truefalse' || t === 'true/false') return 'True / False';
  if (t === 'annotation' || t === 'draw') return 'Annotation';
  return 'Multiple Choice';
}

function mcOptions(q: QuestionLike) {
  return (
    [
      { key: 'A' as const, text: q.optionA },
      { key: 'B' as const, text: q.optionB },
      { key: 'C' as const, text: q.optionC },
      { key: 'D' as const, text: q.optionD },
    ] as const
  ).filter((o) => o.text);
}

function CreateQuizQuestionPreview({
  index,
  question,
  onEdit,
  onDelete,
}: {
  index: number;
  question: QuestionLike;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = (question.type || 'MultipleChoice').toLowerCase();
  const isTf = t === 'truefalse' || t === 'true/false';
  const opts = isTf
    ? [
        { key: 'True', text: 'True' },
        { key: 'False', text: 'False' },
      ]
    : mcOptions(question).map((o) => ({ key: o.key, text: o.text! }));
  let correct = (question.correctAnswer || '').trim();
  if (isTf) {
    const u = correct.toUpperCase();
    if (u === 'A') correct = 'True';
    if (u === 'B') correct = 'False';
  }

  return (
    <div className="group relative mb-4 rounded-xl border border-border/60 bg-muted/30 p-6 transition-all last:mb-0 hover:border-primary/30">
      <div className="mb-4 flex justify-between">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-tight text-primary">
          Question {String(index).padStart(2, '0')} • {typeLabel(question.type)}
        </span>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1 text-muted-foreground hover:text-primary"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <span className="cursor-grab p-1 text-muted-foreground" aria-hidden>
            <GripVertical className="h-4 w-4" />
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="mb-4 w-full text-left text-sm font-semibold text-card-foreground"
      >
        {question.questionText}
      </button>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {opts.map(({ key, text }) => {
          const isCorrect = isTf
            ? correct.toLowerCase() === key.toLowerCase()
            : correct === key;
          return (
            <div
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                isCorrect
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/60 bg-card hover:bg-muted/50'
              }`}
              onClick={onEdit}
              role="presentation"
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCorrect ? 'border-primary' : 'border-muted-foreground/30'
                }`}
              >
                {isCorrect ? <div className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </div>
              <span className="text-sm font-medium text-card-foreground">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="group flex w-full cursor-pointer items-center justify-between rounded-xl py-1 text-left"
    >
      <span className="text-sm font-medium text-card-foreground">{label}</span>
      <span
        className={`relative h-6 w-12 rounded-full transition-colors ${
          on ? 'bg-cyan-500' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full border border-border bg-white shadow-sm transition-all ${
            on ? 'right-1' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

export default function CreateQuizPage() {
  const router = useRouter();
  const curriculaRef = useRef<HTMLElement>(null);
  const diagnosticRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    openTime: '',
    closeTime: '',
    timeLimit: '30',
    passingScore: '80',
  });

  const [classification, setClassification] = useState<(typeof CLASSIFICATION_OPTIONS)[number]>(
    'Resident Year 1',
  );
  const [tags, setTags] = useState<string[]>(['Radiology', 'Cardiology']);
  const [tagInput, setTagInput] = useState('');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [allowRetakes, setAllowRetakes] = useState(false);
  const [immediateResults, setImmediateResults] = useState(true);

  const [referenceCaseIds, setReferenceCaseIds] = useState<string[]>([]);
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [caseLibrary, setCaseLibrary] = useState<CaseDto[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  const [tempQuestions, setTempQuestions] = useState<CreateQuizQuestionRequest[]>([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CreateQuizQuestionRequest | null>(null);
  const [editingTempIndex, setEditingTempIndex] = useState<number | null>(null);

  const allQuestions = createdQuizId ? questions : tempQuestions;

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const userId = getStoredUserId();
      if (!userId) return;
      const data = await getLecturerClasses(userId);
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const openCasePicker = async () => {
    setCasePickerOpen(true);
    setCasesLoading(true);
    try {
      const data = await getLecturerCases();
      setCaseLibrary(data);
    } catch {
      setCaseLibrary([]);
    } finally {
      setCasesLoading(false);
    }
  };

  const toggleReferenceCase = (id: string) => {
    setReferenceCaseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const band = classificationToBand(classification);

  const insightsText = useMemo(() => {
    const level =
      band === 'SPECIALIST' ? 'Level 3 Specialist' : band === 'FELLOW' ? 'Fellowship' : 'Residency';
    const diff = band === 'SPECIALIST' ? 'High' : band === 'FELLOW' ? 'Very high' : 'Moderate';
    return `This quiz structure aligns with ${level} standards. Topics: ${tags.slice(0, 3).join(', ') || 'general'}. Predicted difficulty: ${diff}.`;
  }, [band, tags]);

  const scrollTo = (ref: { current: HTMLElement | null }, step: 1 | 2) => {
    setActiveStep(step);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const buildCreatePayload = () => ({
    title: formData.title,
    classId: formData.classId || '00000000-0000-0000-0000-000000000000',
    openTime: formData.openTime || undefined,
    closeTime: formData.closeTime || undefined,
    timeLimit: formData.timeLimit ? parseInt(formData.timeLimit, 10) : undefined,
    passingScore: formData.passingScore ? parseInt(formData.passingScore, 10) : undefined,
  });

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      setError('Please enter an assessment title');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const quiz = await createQuiz(buildCreatePayload());
      for (const q of tempQuestions) {
        await addQuizQuestion({ ...q, quizId: quiz.id });
      }
      router.push(`/lecturer/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!formData.title.trim()) {
      setError('Please enter an assessment title');
      scrollTo(curriculaRef, 1);
      return;
    }
    if (allQuestions.length === 0) {
      setError('Add at least one question before publishing.');
      scrollTo(diagnosticRef, 2);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const quiz = await createQuiz(buildCreatePayload());
      setCreatedQuizId(quiz.id);
      for (const q of tempQuestions) {
        await addQuizQuestion({ ...q, quizId: quiz.id });
      }
      router.push(`/lecturer/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditingTempIndex(null);
    setEditorOpen(true);
  };

  const handleEditQuestion = (question: QuizQuestionDto) => {
    if (!createdQuizId) {
      const idx = parseInt(question.id, 10);
      if (!Number.isNaN(idx) && tempQuestions[idx]) {
        setEditingQuestion(tempQuestions[idx]);
        setEditingTempIndex(idx);
        setEditorOpen(true);
      }
      return;
    }
    const q = questions.find((x) => x.id === question.id);
    if (q) {
      setEditingQuestion({
        quizId: q.quizId,
        questionText: q.questionText,
        type: q.type || 'MultipleChoice',
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctAnswer: q.correctAnswer || '',
        caseId: q.caseId || undefined,
      });
      setEditingTempIndex(null);
      setEditorOpen(true);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Remove this question?')) return;
    setTempQuestions(tempQuestions.filter((_, i) => i.toString() !== questionId));
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const handleDraftSave = (payload: CreateQuizQuestionRequest) => {
    const row = { ...payload, quizId: 'temp' };
    if (editingTempIndex !== null) {
      const u = [...tempQuestions];
      u[editingTempIndex] = row;
      setTempQuestions(u);
    } else {
      setTempQuestions([...tempQuestions, row]);
    }
    setEditorOpen(false);
    setEditingQuestion(null);
    setEditingTempIndex(null);
  };

  useEffect(() => {
    if (createdQuizId) {
      getQuizQuestions(createdQuizId).then(setQuestions).catch(console.error);
    }
  }, [createdQuizId]);

  const estMinutes = Math.max(1, parseInt(formData.timeLimit, 10) || 12);
  const complexityBadge = useMemo(() => {
    const n = allQuestions.length;
    if (classification.includes('Advanced')) return { label: 'LEVEL 3', className: 'bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100' };
    if (n >= 5) return { label: 'LEVEL 3', className: 'bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100' };
    if (n >= 2) return { label: 'LEVEL 2', className: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100' };
    return { label: 'LEVEL 1', className: 'bg-muted text-muted-foreground' };
  }, [allQuestions.length, classification]);

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <header className="sticky top-0 z-30 -mx-4 mb-8 flex flex-col gap-4 border-b border-border/60 bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <FilePenLine className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h1 className="text-lg font-bold text-card-foreground">Create New Assessment</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/lecturer/quizzes"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Back to quizzes
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={handleSaveDraft}
            className="h-10 rounded-full border border-border bg-card px-6 text-sm font-bold text-primary transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Save draft'}
          </button>
        </div>
      </header>

      {/* Stepper — Basic info / Questions */}
      <div className="mb-10 flex justify-center">
        <div className="relative flex w-full max-w-md items-center">
          <button
            type="button"
            onClick={() => scrollTo(curriculaRef, 1)}
            className="z-10 flex flex-1 flex-col items-center"
          >
            <div
              className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${
                activeStep === 1 ? 'bg-gradient-to-br from-primary to-primary/90' : 'bg-muted text-muted-foreground'
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-bold uppercase ${activeStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Basic info
            </span>
          </button>
          <div className="pointer-events-none absolute left-1/4 right-1/4 top-5 h-0.5 bg-border" aria-hidden />
          <button
            type="button"
            onClick={() => scrollTo(diagnosticRef, 2)}
            className="z-10 flex flex-1 flex-col items-center"
          >
            <div
              className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                activeStep === 2
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-bold uppercase ${activeStep === 2 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Questions
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          <section
            ref={curriculaRef}
            className="rounded-xl border border-border/40 bg-card p-8 shadow-sm"
          >
            <div className="mb-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-card-foreground">
                <HelpCircle className="h-5 w-5 text-primary" aria-hidden />
                Curricula details
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Define the foundation of this clinical assessment.
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quiz title
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Advanced Musculoskeletal Pathology"
                    className="h-12 rounded-lg border-0 bg-muted/60 px-4 font-medium text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Classification
                  </label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value as (typeof CLASSIFICATION_OPTIONS)[number])}
                    className="h-12 rounded-lg border-0 bg-muted/60 px-4 font-medium text-card-foreground focus:ring-2 focus:ring-primary"
                  >
                    {CLASSIFICATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Clinical description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide learning objectives and case context…"
                  rows={3}
                  className="rounded-lg border-0 bg-muted/60 p-4 font-medium text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:bg-muted/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="mt-1 text-[10px] font-bold text-muted-foreground">Attach DICOM</span>
                  <input type="file" accept=".dcm,.jpg,.jpeg,.png" className="hidden" disabled />
                </label>
                <div className="col-span-2 flex items-center gap-4 rounded-lg bg-secondary/15 p-4 dark:bg-secondary/10">
                  <div className="rounded-lg bg-secondary p-2 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-secondary">Verified curriculum</h3>
                    <p className="text-xs text-muted-foreground">
                      Aligns with standard radiology board learning objectives for this track.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Schedule &amp; scoring
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Class</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    >
                      <option value="">Optional</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.className} — {cls.semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" /> Time limit (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Percent className="h-3 w-3" /> Passing (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Opens</label>
                    <input
                      type="datetime-local"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Closes</label>
                    <input
                      type="datetime-local"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openCasePicker}
                className="w-full rounded-lg border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                Tag reference cases ({referenceCaseIds.length} selected) — open library
              </button>
              {referenceCaseIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {referenceCaseIds.map((id) => {
                    const c = caseLibrary.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary"
                      >
                        {c?.title || id.slice(0, 8)}
                        <button
                          type="button"
                          onClick={() => toggleReferenceCase(id)}
                          className="rounded p-0.5 hover:bg-secondary/20"
                          aria-label="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <details className="rounded-lg border border-border/60 bg-muted/10 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-card-foreground">
                  Advanced quiz options
                </summary>
                <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary"
                      >
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="rounded hover:opacity-70">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Topic tag"
                      className="min-w-0 flex-1 rounded-full border border-border bg-card px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded-full bg-muted px-3 py-2 text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <ToggleRow label="Randomize questions" on={randomizeQuestions} onChange={setRandomizeQuestions} />
                  <ToggleRow label="Allow retakes" on={allowRetakes} onChange={setAllowRetakes} />
                  <ToggleRow label="Immediate results" on={immediateResults} onChange={setImmediateResults} />
                  <p className="text-[11px] text-muted-foreground">
                    Tags and toggles are local to this screen until the API supports them.
                  </p>
                </div>
              </details>
            </div>
          </section>

          <section
            ref={diagnosticRef}
            className="rounded-xl border border-border/40 bg-card p-8 shadow-sm"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-card-foreground">
                  <ListChecks className="h-5 w-5 text-primary" aria-hidden />
                  Diagnostic questions
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Populate the assessment with high-fidelity case questions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
              >
                <PlusCircle className="h-4 w-4" />
                New question
              </button>
            </div>

            {allQuestions.length > 0 ? (
              <div>
                {allQuestions.map((question, index) => (
                  <CreateQuizQuestionPreview
                    key={!createdQuizId ? `t-${index}` : (question as QuizQuestionDto).id}
                    index={index + 1}
                    question={question as QuestionLike}
                    onEdit={() => {
                      if (!createdQuizId) {
                        setEditingQuestion(question as CreateQuizQuestionRequest);
                        setEditingTempIndex(index);
                        setEditorOpen(true);
                      } else {
                        handleEditQuestion(question as QuizQuestionDto);
                      }
                    }}
                    onDelete={() =>
                      handleDeleteQuestion(
                        !createdQuizId ? String(index) : (question as QuizQuestionDto).id,
                      )
                    }
                  />
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-12 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <PlusCircle className="mb-2 h-10 w-10 opacity-60" />
              <span className="text-sm font-bold uppercase tracking-widest">Add question section</span>
            </button>
          </section>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={XRAY_PREVIEW} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold">Quiz live preview</h3>
              <p className="mb-6 text-xs text-white/70">
                See how students will interact with your diagnostic modules after you publish.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (allQuestions.length === 0) {
                    setError('Add at least one question to use preview.');
                    scrollTo(diagnosticRef, 2);
                    return;
                  }
                  setError(null);
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/15 font-bold text-white backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <Eye className="h-4 w-4" />
                Preview quiz
              </button>
            </div>
          </div>

          <div className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Assessment metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Est. completion time</span>
                <span className="text-sm font-bold text-primary">{estMinutes} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Complexity score</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${complexityBadge.className}`}
                >
                  {complexityBadge.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tagged cases</span>
                <span className="text-sm font-bold text-primary">
                  {String(referenceCaseIds.length).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="border-t border-border/60 pt-4">
              <button
                type="button"
                disabled={loading || allQuestions.length === 0}
                onClick={handleCreateQuiz}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary/90 font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Finalize &amp; publish
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-cyan-500/10 p-6 dark:bg-cyan-950/30">
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 shrink-0 text-cyan-800 dark:text-cyan-200" />
              <div>
                <h4 className="text-sm font-bold text-cyan-950 dark:text-cyan-100">Clinical tip</h4>
                <p className="mt-1 text-xs leading-relaxed text-cyan-900/80 dark:text-cyan-100/80">
                  Include differential diagnoses for every question to improve resident critical thinking.
                  {tags.length > 0 ? ` Topics: ${tags.slice(0, 3).join(', ')}.` : ''}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">{insightsText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {casePickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setCasePickerOpen(false)}
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold text-card-foreground">Reference cases</h3>
              <button type="button" onClick={() => setCasePickerOpen(false)} className="rounded-lg p-2 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-4">
              {casesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : caseLibrary.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No cases in library.</p>
              ) : (
                <ul className="space-y-2">
                  {caseLibrary.map((c) => {
                    const sel = referenceCaseIds.includes(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => toggleReferenceCase(c.id)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                            sel ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input type="checkbox" readOnly checked={sel} className="mt-1" />
                          <span>
                            <span className="font-medium text-card-foreground">{c.title || 'Untitled'}</span>
                            {c.categoryName ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">{c.categoryName}</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-border p-4">
              <Button className="w-full" onClick={() => setCasePickerOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <QuestionEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingQuestion(null);
          setEditingTempIndex(null);
        }}
        quizId={createdQuizId || 'temp'}
        draftMode={!createdQuizId}
        onDraftSave={handleDraftSave}
        question={
          editingQuestion
            ? {
                id: editingTempIndex !== null ? String(editingTempIndex) : '',
                quizId: '',
                quizTitle: null,
                caseId: null,
                caseTitle: null,
                questionText: editingQuestion.questionText,
                type: editingQuestion.type || 'MultipleChoice',
                optionA: editingQuestion.optionA || null,
                optionB: editingQuestion.optionB || null,
                optionC: editingQuestion.optionC || null,
                optionD: editingQuestion.optionD || null,
                correctAnswer: editingQuestion.correctAnswer || null,
              }
            : null
        }
        onSuccess={() => {
          setEditorOpen(false);
          setEditingQuestion(null);
          setEditingTempIndex(null);
        }}
      />
    </div>
  );
}
