'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  Minus,
  BookOpen,
  PlayCircle,
  AlertCircle,
  Timer,
  HelpCircle,
  Contrast,
  Ruler,
  ChevronDown,
  Eye,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  generateAndSaveAIPracticeQuiz,
  submitAIPracticeQuiz,
  fetchQuizAttemptReview,
} from '@/lib/api/student';
import type { QuizAttemptReview, StudentGeneratedQuizSession } from '@/lib/api/student';
import { resolveApiAssetUrl, getApiErrorMessage } from '@/lib/api/client';
import type { StudentSubmitQuestionDto } from '@/lib/api/types';

const ZOOM_LEVELS = [1, 1.25, 1.5, 2, 2.5];

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const QUICK_TOPICS = [
  'Long Bone Fractures',
  'Spine Lesions',
  'Joint Diseases',
  'Bone Tumors',
  'Upper Extremity',
  'Lower Extremity',
  'Pelvis & Hip',
  'Foot & Ankle',
];

type DifficultyLevel = '' | 'Easy' | 'Medium' | 'Hard';
type QuizState = 'config' | 'generating' | 'active' | 'submitting' | 'result';

export default function AIQuizPage() {
  const router = useRouter();
  const toast = useToast();

  // Config state
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('');

  // Quiz session state
  const [quizState, setQuizState] = useState<QuizState>('config');
  const [session, setSession] = useState<StudentGeneratedQuizSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; totalQuestions: number; correctAnswers: number } | null>(null);
  const [quizReview, setQuizReview] = useState<QuizAttemptReview | null>(null);

  // Image controls
  const [zoomIndex, setZoomIndex] = useState(0);
  const [highContrastImg, setHighContrastImg] = useState(false);
  const [straightenActive, setStraightenActive] = useState(false);

  // UI state
  const [showAIReasoning, setShowAIReasoning] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const questions = session?.questions ?? [];
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQ && totalQ > 0;
  const currentAnswer = currentQ ? answers[currentQ.questionId] : null;

  const handleSelect = useCallback((option: string) => {
    if (!currentQ || quizState !== 'active') return;
    setAnswers((prev) => ({ ...prev, [currentQ.questionId]: option }));
  }, [currentQ, quizState]);

  const handleGenerate = async () => {
    if (!selectedTopic.trim()) {
      toast.error('Please select a topic.');
      return;
    }
    setQuizState('generating');
    setAnswers({});
    setCurrentIndex(0);
    setQuizResult(null);
    setQuizReview(null);
    try {
      const data = await generateAndSaveAIPracticeQuiz(selectedTopic, questionCount, difficulty || undefined);
      if (!data.attemptId || data.attemptId === '00000000-0000-0000-0000-000000000000') {
        toast.info('AI cannot generate questions. Please try a different topic.');
        setQuizState('config');
        return;
      }
      setSession(data);
      setQuizState('active');
      toast.success(`Quiz "${data.title}" created! Start practicing.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
      setQuizState('config');
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const payload: StudentSubmitQuestionDto[] = Object.entries(answers).map(
        ([questionId, studentAnswer]) => ({ questionId, studentAnswer }),
      );
      const result = await submitAIPracticeQuiz(session.attemptId, payload);
      setQuizResult(result);
      setQuizState('result');
      toast.success(`Submitted! Score: ${Math.round(result.score)}%`);
      // Load review
      try {
        const review = await fetchQuizAttemptReview(session.attemptId);
        setQuizReview(review);
      } catch {
        // non-critical
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setQuizState('config');
    setSession(null);
    setAnswers({});
    setCurrentIndex(0);
    setQuizResult(null);
    setQuizReview(null);
  };

  const handleStartNew = () => {
    handleRetake();
  };

  // Progress percentage
  const progressPct = totalQ > 0 ? Math.round(((currentIndex + 1) / totalQ) * 100) : 0;
  const answeredPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  if (!session) {
    return (
      <div className="flex flex-1 min-h-screen bg-[#f7f9fb]">
        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="flex justify-between items-center w-full px-8 py-5 bg-white border-b border-slate-200/60">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-wide">
                AI PRACTICE MODE
              </span>
            </div>
            <div className="flex items-center gap-6">
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Help">
                <HelpCircle className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1">
            {/* Config sidebar */}
            <aside className="w-80 bg-[#f2f4f6] p-6 flex flex-col gap-8 border-r border-slate-200/60">
              <div>
                <h2 className="font-['Manrope',sans-serif] font-bold text-[#191c1e] text-lg mb-1">Quiz Configuration</h2>
                <p className="text-xs text-[#424752]">Customize your AI practice session</p>
              </div>

              {/* Topic Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#424752] uppercase tracking-wider">Topic</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAllTopics(!showAllTopics)}
                    className="w-full text-left p-3 rounded-xl bg-white text-[#00478d] font-semibold text-sm border border-[#00478d]/20 flex justify-between items-center shadow-sm"
                  >
                    {selectedTopic || 'Select topic...'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAllTopics ? 'rotate-180' : ''}`} />
                  </button>
                  {showAllTopics && (
                    <div className="grid grid-cols-1 gap-2 bg-white rounded-xl p-2 shadow-sm border border-slate-200/60 max-h-64 overflow-y-auto">
                      {QUICK_TOPICS.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => {
                            setSelectedTopic(topic);
                            setShowAllTopics(false);
                          }}
                          className={`p-3 rounded-lg text-sm text-left transition-colors flex items-center gap-2 ${
                            selectedTopic === topic
                              ? 'bg-[#00478d]/10 text-[#00478d] font-semibold'
                              : 'hover:bg-slate-50 text-[#191c1e]'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedTopic === topic
                              ? 'border-[#00478d] bg-[#00478d]'
                              : 'border-slate-300'
                          }`}>
                            {selectedTopic === topic && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </span>
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Count */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#424752] uppercase tracking-wider">Number of questions</label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 25].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        questionCount === n
                          ? 'bg-[#00478d] text-white shadow-md'
                          : 'bg-white text-[#424752] hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#424752] uppercase tracking-wider">Difficulty</label>
                <div className="flex p-1 bg-white rounded-full border border-slate-200">
                  {['', 'Easy', 'Medium', 'Hard'].map((d) => (
                    <button
                      key={d || 'all'}
                      onClick={() => setDifficulty(d as DifficultyLevel)}
                      className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                        difficulty === d
                          ? 'bg-[#00478d] text-white shadow-sm'
                          : 'text-[#424752] hover:text-[#191c1e]'
                      }`}
                    >
                      {d || 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Mode Info */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#424752] uppercase tracking-wider">AI Mode</label>
                <div className="p-4 rounded-2xl bg-[#00478d]/10 border border-[#00478d]/10">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-[#00478d] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#00478d]">RAG Knowledge Base</p>
                      <p className="text-[10px] text-[#424752] leading-relaxed mt-1">
                        AI synthesizes questions from clinical medical journals and bone pathology databases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => void handleGenerate()}
                  disabled={quizState === 'generating' || !selectedTopic.trim()}
                  className="w-full py-4 bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {quizState === 'generating' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating questions...
                    </>
                  ) : (
                    <>
                      <Star className="h-5 w-5" />
                      Create &amp; Start Quiz
                    </>
                  )}
                </button>
              </div>
            </aside>

            {/* Main area - Welcome */}
            <section className="flex-1 p-8 flex items-center justify-center bg-[#f7f9fb]">
              <div className="text-center max-w-lg">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00478d] to-[#005eb8] shadow-xl shadow-blue-500/20">
                  <Star className="h-10 w-10 text-white" />
                </div>
                <h2 className="font-['Manrope',sans-serif] text-3xl font-extrabold text-[#191c1e] mb-3">
                  AI Quiz Practice
                </h2>
                <p className="text-[#424752] leading-relaxed mb-8">
                  Select a topic you want to practice, and AI will generate questions based on medical knowledge.
                  After submitting, you can review answers and scores.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Long Bone Fractures', 'Spine Lesions', 'Joint Diseases'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                        selectedTopic === topic
                          ? 'bg-[#00478d] text-white border-[#00478d]'
                          : 'bg-white text-[#424752] border-slate-200 hover:border-[#00478d]/40 hover:text-[#00478d]'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // Quiz Active / Result View
  return (
    <div className="flex flex-1 min-h-screen bg-[#f7f9fb]">
      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-8 py-4 bg-white border-b border-slate-200/60 z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#00478d]" />
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-wide">
                AI PRACTICE MODE
              </span>
            </div>
            {quizState === 'active' && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-600">In progress</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            {quizState === 'active' && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-[#f2f4f6] px-4 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#00478d] font-['Manrope',sans-serif]">
                    {currentIndex + 1} <span className="text-[#424752] font-normal">/</span> {totalQ}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-300/60" />
                <span className="text-sm">
                  <span className="font-bold text-[#00478d]">{answeredCount}</span>
                  <span className="text-[#424752]"> answered</span>
                </span>
              </div>
            )}
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Help">
              <HelpCircle className="h-5 w-5 text-slate-500" />
            </button>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 rounded-xl border border-slate-200/60 px-4 py-2 text-sm font-bold text-[#424752] hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Image Viewer */}
          <section className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              {/* Progress Bar */}
              <div className="mb-6 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-[#191c1e]">Progress: Question {currentIndex + 1} / {totalQ}</span>
                  <span className="text-[#424752]">
                    <span className="font-bold text-[#00478d]">{answeredPct}%</span> completed ({answeredCount}/{totalQ})
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eceef0]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Question Navigation Pills */}
              <div className="mb-6 flex flex-wrap gap-2">
                {questions.map((q, i) => {
                  const isAnswered = !!answers[q.questionId];
                  const isCurrent = i === currentIndex;
                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#00478d] text-white shadow-md ring-2 ring-[#00478d]/30'
                          : isAnswered
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : 'bg-white text-[#424752] border-2 border-slate-200 hover:border-[#00478d]/40'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Image Viewer */}
              {currentQ?.imageUrl && (
                <div className="relative group mb-6 overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-[#3d4449] to-[#191c1e] border border-white/10">
                  <div
                    className={`flex min-h-[40vh] w-full origin-center items-center justify-center overflow-auto p-4 transition-transform duration-300 ${
                      highContrastImg ? 'contrast-125 saturate-125' : ''
                    }`}
                    style={{
                      transform: `scale(${ZOOM_LEVELS[zoomIndex]}) ${straightenActive ? 'rotate(-1deg)' : 'none'}`,
                    }}
                  >
                    <img
                      src={resolveApiAssetUrl(currentQ.imageUrl)}
                      alt={currentQ.caseTitle ?? 'Case image'}
                      className="h-auto w-full max-w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                      style={{ maxHeight: 'min(70vh, 800px)' }}
                    />
                  </div>

                  {/* AI Marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-24 h-24 border-2 border-[#94efec] rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#94efec] rounded-full" />
                    </div>
                    <div className="absolute -top-12 left-12 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl whitespace-nowrap">
                      <p className="text-[10px] font-bold text-[#00478d] flex items-center gap-1">
                        <span className="text-xs">🔍</span> AI INSIGHT: EXAMINE ROI
                      </p>
                    </div>
                  </div>

                  {/* Image Toolbar */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/20 bg-white/80 backdrop-blur-xl px-4 py-2 shadow-2xl">
                    <button
                      onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))}
                      className="rounded-full p-2 text-[#00478d] hover:bg-blue-50 transition-colors"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
                      className="rounded-full p-2 text-[#00478d] hover:bg-blue-50 transition-colors"
                      title="Zoom out"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-300/60 mx-1" />
                    <button
                      onClick={() => setHighContrastImg((v) => !v)}
                      className={`rounded-full p-2 transition-colors hover:bg-blue-50 ${
                        highContrastImg ? 'text-[#006a68] bg-teal-50' : 'text-[#00478d]'
                      }`}
                      title="Contrast"
                    >
                      <Contrast className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setStraightenActive((v) => !v)}
                      className={`rounded-full p-2 transition-colors hover:bg-blue-50 ${
                        straightenActive ? 'text-[#006a68] bg-teal-50' : 'text-[#00478d]'
                      }`}
                      title="Straighten"
                    >
                      <Ruler className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-300/60 mx-1" />
                    <span className="px-2 py-1 font-['Manrope',sans-serif] text-xs font-bold text-[#424752]">
                      {ZOOM_LEVELS[zoomIndex]}x
                    </span>
                  </div>
                </div>
              )}

              {/* Case Info */}
              {currentQ && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentQ.caseId && (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-4 py-2 text-xs font-semibold text-[#424752] shadow-sm">
                      <Eye className="h-4 w-4" />
                      ID: {currentQ.caseId.slice(0, 8)}
                    </span>
                  )}
                  {currentQ.caseTitle && (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-4 py-2 text-xs font-semibold text-[#424752] shadow-sm">
                      <BookOpen className="h-4 w-4" />
                      {currentQ.caseTitle}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-xl bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900 shadow-sm">
                    AI Generated
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Right: Question Panel */}
          <aside className="w-[480px] bg-white border-l border-slate-200/60 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Card */}
              <div className="bg-[#f2f4f6] rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-[#00478d] uppercase tracking-tighter">
                    Question {currentIndex + 1} / {totalQ}
                  </span>
                  {currentQ?.type && (
                    <span className="rounded-full bg-[#00478d]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#00478d]">
                      {currentQ.type}
                    </span>
                  )}
                </div>
                <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e] leading-snug">
                  {currentQ?.questionText ?? ''}
                </h3>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {(
                  [
                    { key: 'A' as const, text: currentQ?.optionA },
                    { key: 'B' as const, text: currentQ?.optionB },
                    { key: 'C' as const, text: currentQ?.optionC },
                    { key: 'D' as const, text: currentQ?.optionD },
                  ] as const
                ).map(({ key, text }) => {
                  if (!text) return null;
                  const isSelected = currentAnswer === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={quizState !== 'active'}
                      onClick={() => handleSelect(key)}
                      className={`w-full p-5 text-left rounded-2xl border-2 transition-all group ${
                        isSelected
                          ? 'bg-[#00478d]/10 border-[#00478d] shadow-md'
                          : 'bg-white border-slate-200 hover:border-[#00478d]/30 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected
                              ? 'bg-[#00478d] text-white'
                              : 'bg-slate-100 text-[#424752] group-hover:bg-[#00478d] group-hover:text-white'
                          }`}
                        >
                          {key}
                        </span>
                        <span className={`flex-1 font-medium ${isSelected ? 'text-[#00478d]' : 'text-[#191c1e]'}`}>
                          {text}
                        </span>
                        {isSelected && <CheckCircle2 className="h-6 w-6 text-[#00478d]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* AI Reasoning */}
              <div className="bg-[#eceef0] rounded-2xl p-4">
                <button
                  type="button"
                  onClick={() => setShowAIReasoning(!showAIReasoning)}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#00478d]" />
                    <span className="text-xs font-bold text-[#191c1e]">AI Reasoning &amp; References</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-[#424752] transition-transform ${showAIReasoning ? 'rotate-180' : ''}`} />
                </button>
                {showAIReasoning && (
                  <div className="mt-3 bg-white/60 rounded-xl p-3 border border-white/20">
                    <p className="text-[11px] text-[#424752] leading-relaxed">
                      This question was generated by AI based on X-ray image analysis and medical knowledge base.
                      <span className="block mt-2 font-semibold text-[#00478d]">
                        Source: Journal of Orthopedic Trauma (2023), Vol 42.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-200/60 p-6 space-y-3 bg-white">
              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="flex-1 py-4 bg-[#eceef0] text-[#191c1e] font-bold rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
                  disabled={currentIndex >= totalQ - 1}
                  className="flex-1 py-4 bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {/* Submit Button */}
              {quizState === 'result' && quizResult ? (
                <div className="space-y-4">
                  <div className={`rounded-2xl border-2 p-6 text-center ${
                    quizResult.passed
                      ? 'border-green-500/50 bg-green-50'
                      : 'border-red-500/50 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {quizResult.passed ? (
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      ) : (
                        <XCircle className="h-10 w-10 text-red-600" />
                      )}
                      <div className="text-left">
                        <p className={`text-4xl font-black font-['Manrope',sans-serif] ${
                          quizResult.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.round(quizResult.score)}%
                        </p>
                        <p className="text-sm text-[#424752]">
                          {quizResult.correctAnswers}/{quizResult.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartNew}
                    className="w-full py-4 bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <Star className="h-5 w-5" />
                    Create New Quiz
                  </button>
                  <Link
                    href="/student/quiz"
                    className="w-full py-4 bg-[#eceef0] text-[#191c1e] font-bold rounded-2xl flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Quiz List
                  </Link>

                  {/* Review Answers Button */}
                  {quizReview && (
                    <button
                      type="button"
                      onClick={() => setShowReview(!showReview)}
                      className="w-full py-3 bg-[#00478d]/10 text-[#00478d] font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#00478d]/20 transition-colors"
                    >
                    <Eye className="h-5 w-5" />
                    {showReview ? 'Hide answers' : 'View answers'}
                    </button>
                  )}

                  {/* Review Panel */}
                  {showReview && quizReview && (
                    <div className="border-t border-slate-200/60 pt-4 mt-4 space-y-4">
                      <h4 className="text-sm font-bold text-[#191c1e]">Answer details</h4>
                      {quizReview.questions.map((q, idx) => {
                        const isCorrect = q.isCorrect;
                        const studentAns = q.studentAnswer ?? '-';
                        const correctAns = q.correctAnswer ?? '-';
                        return (
                          <div
                            key={q.questionId}
                            className={`rounded-xl border p-4 text-left ${
                              isCorrect
                                ? 'border-green-300 bg-green-50'
                                : 'border-red-300 bg-red-50'
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              )}
                            <p className="text-sm font-semibold text-[#191c1e] flex-1">
                              Question {idx + 1}: {q.questionText}
                            </p>
                            </div>
                            <div className="ml-7 space-y-1">
                              <p className="text-xs">
                                <span className="font-semibold text-[#424752]">Your answer: </span>
                                <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{studentAns}</span>
                              </p>
                              {!isCorrect && (
                                <p className="text-xs">
                                  <span className="font-semibold text-[#424752]">Correct answer: </span>
                                  <span className="font-bold text-green-600">{correctAns}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (answeredCount === 0) {
                      toast.error('Please answer at least 1 question before submitting.');
                      return;
                    }
                    void handleSubmit();
                  }}
                  disabled={submitting}
                  className={`group relative w-full overflow-hidden rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                    answeredCount > 0
                      ? 'bg-gradient-to-r from-[#00478d] via-[#005eb8] to-[#006a68] text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-[0.98]'
                      : 'bg-slate-100 text-[#727783] cursor-not-allowed'
                  }`}
                >
                  {/* Background animation for ready state */}
                  {answeredCount > 0 && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  )}
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                      <span className="relative z-10">Submitting...</span>
                    </>
                  ) : answeredCount > 0 ? (
                    <>
                      <span className="relative z-10 flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <span>Submit Quiz</span>
                        <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                          {answeredCount}/{totalQ}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10 flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current">
                          !
                        </span>
                        <span>No questions answered</span>
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Progress indicator */}
              <div className="text-center text-xs text-[#727783]">
                {answeredCount}/{totalQ} questions answered
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
