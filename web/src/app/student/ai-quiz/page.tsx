'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  HelpCircle,
  ChevronDown,
  Eye,
  Star,
  Zap,
} from 'lucide-react';
import {
  generateAndSaveAIPracticeQuiz,
  submitAIPracticeQuiz,
} from '@/lib/api/student';
import type { StudentGeneratedQuizSession } from '@/lib/api/student';
import { resolveApiAssetUrl, getApiErrorMessage } from '@/lib/api/client';
import type { StudentSubmitQuestionDto } from '@/lib/api/types';

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

  const [selectedTopic, setSelectedTopic] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('');

  const [quizState, setQuizState] = useState<QuizState>('config');
  const [session, setSession] = useState<StudentGeneratedQuizSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; totalQuestions: number; correctAnswers: number } | null>(null);
  const [showAIReasoning, setShowAIReasoning] = useState(false);

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
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNew = () => {
    setQuizState('config');
    setSession(null);
    setAnswers({});
    setCurrentIndex(0);
    setQuizResult(null);
  };

  // Config View
  if (quizState === 'config' || quizState === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00478d] to-[#005eb8] shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h1 className="font-['Manrope',sans-serif] text-3xl font-black text-[#191c1e]">
                AI Quiz Generator
              </h1>
              <p className="text-[#424752]">
                Generate personalized practice quizzes powered by AI
              </p>
            </div>

            {/* Topic Selection Card */}
            <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e]">
                <BookOpen className="h-6 w-6 text-[#00478d]" />
                Select a Topic
              </h2>

              {/* Quick Topics */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {QUICK_TOPICS.slice(0, 6).map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                      selectedTopic === topic
                        ? 'border-[#00478d] bg-[#00478d]/10 text-[#00478d]'
                        : 'border-slate-200 text-[#424752] hover:border-[#00478d]/40'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Show More Topics */}
              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="mb-4 text-sm font-medium text-[#00478d] hover:underline"
              >
                {showAllTopics ? 'Show less topics' : 'Show all topics'}
              </button>

              {showAllTopics && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {QUICK_TOPICS.slice(6).map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                        selectedTopic === topic
                          ? 'border-[#00478d] bg-[#00478d]/10 text-[#00478d]'
                          : 'border-slate-200 text-[#424752] hover:border-[#00478d]/40'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Topic */}
              {selectedTopic && (
                <div className="mb-6 rounded-2xl border-2 border-[#00478d]/30 bg-[#00478d]/5 p-4 text-center">
                  <p className="text-sm text-[#424752]">Selected topic:</p>
                  <p className="text-xl font-bold text-[#00478d]">{selectedTopic}</p>
                </div>
              )}

              {/* Question Count & Difficulty */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#424752]">Questions</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-[#191c1e] focus:border-[#00478d] focus:outline-none"
                  >
                    {[5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>{n} questions</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#424752]">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-[#191c1e] focus:border-[#00478d] focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => void handleGenerate()}
                disabled={!selectedTopic || quizState === 'generating'}
                className={`w-full rounded-2xl py-4 font-bold text-lg transition-all ${
                  selectedTopic && quizState !== 'generating'
                    ? 'bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white shadow-xl hover:shadow-2xl active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {quizState === 'generating' ? (
                  <>
                    <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 inline h-5 w-5" />
                    Generate AI Quiz
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#191c1e]">
                <HelpCircle className="h-5 w-5 text-[#00478d]" />
                How it works
              </h3>
              <ol className="space-y-2 text-sm text-[#424752]">
                <li className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00478d]/10 text-xs font-bold text-[#00478d]">1</span>
                  Select a medical topic
                </li>
                <li className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00478d]/10 text-xs font-bold text-[#00478d]">2</span>
                  AI generates questions from medical knowledge
                </li>
                <li className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00478d]/10 text-xs font-bold text-[#00478d]">3</span>
                  Answer and get instant feedback
                </li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Active / Result View
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00478d]">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="rounded-full bg-[#00478d]/10 px-3 py-1 text-xs font-bold text-[#00478d]">
                AI PRACTICE MODE
              </span>
              <p className="mt-1 font-semibold text-[#191c1e]">{session?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#424752]">
              <span className="font-bold text-[#00478d]">{answeredCount}</span> / {totalQ} answered
            </span>
            <button
              onClick={handleStartNew}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-[#424752] hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit
            </button>
          </div>
        </header>

        {/* Progress */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#191c1e]">Question {currentIndex + 1} / {totalQ}</span>
            <span className="text-[#424752]">
              {Math.round(((currentIndex + 1) / totalQ) * 100)}% complete
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#eceef0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] transition-all"
              style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
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
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#00478d] text-white shadow-md'
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

        {/* Current Question */}
        {currentQ && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {/* Question Text */}
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#00478d]">
                Question {currentIndex + 1}
              </p>
              <h2 className="text-xl font-bold text-[#191c1e]">
                {currentQ.questionText}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {(
                [
                  { key: 'A' as const, text: currentQ.optionA },
                  { key: 'B' as const, text: currentQ.optionB },
                  { key: 'C' as const, text: currentQ.optionC },
                  { key: 'D' as const, text: currentQ.optionD },
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
                    className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#00478d] bg-[#00478d]/10'
                        : 'border-slate-200 hover:border-[#00478d]/30 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                        isSelected ? 'bg-[#00478d] text-white' : 'bg-slate-100 text-[#424752]'
                      }`}>
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

            {/* AI Reasoning Toggle */}
            <div className="mt-6 rounded-xl bg-[#eceef0] p-4">
              <button
                type="button"
                onClick={() => setShowAIReasoning(!showAIReasoning)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#00478d]" />
                  <span className="text-sm font-bold text-[#191c1e]">AI Explanation</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-[#424752] transition-transform ${showAIReasoning ? 'rotate-180' : ''}`} />
              </button>
              {showAIReasoning && (
                <div className="mt-3 text-sm text-[#424752]">
                  This question tests your knowledge of bone pathology and radiographic interpretation.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 rounded-2xl bg-white py-4 font-bold text-[#191c1e] shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
            disabled={currentIndex >= totalQ - 1}
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#00478d] to-[#005eb8] py-4 font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Submit Button */}
        {quizState === 'result' && quizResult ? (
          <div className="mt-6 space-y-4">
            <div className={`rounded-2xl border-2 p-6 text-center ${
              quizResult.passed ? 'border-green-500/50 bg-green-50' : 'border-red-500/50 bg-red-50'
            }`}>
              <div className="flex items-center justify-center gap-4">
                {quizResult.passed ? (
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600" />
                )}
                <div className="text-left">
                  <p className={`text-4xl font-black ${
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStartNew}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#00478d] to-[#005eb8] py-4 font-bold text-white shadow-lg flex items-center justify-center gap-2"
              >
                <Star className="h-5 w-5" />
                New Quiz
              </button>
              <Link
                href="/student/quizzes"
                className="flex-1 rounded-2xl bg-slate-100 py-4 font-bold text-[#191c1e] text-center"
              >
                <ArrowLeft className="mr-2 inline h-5 w-5" />
                Back to Quizzes
              </Link>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || answeredCount === 0}
            className={`mt-6 w-full rounded-2xl py-4 font-bold transition-all ${
              answeredCount > 0 && !submitting
                ? 'bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white shadow-xl hover:shadow-2xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Quiz ({answeredCount}/{totalQ})
              </>
            )}
          </button>
        )}
      </main>
    </div>
  );
}
