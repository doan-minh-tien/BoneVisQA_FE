/**
 * ============================================
 * AI QUIZ - DISABLED CODE ARCHIVE
 * ============================================
 * 
 * File này chứa tất cả code AI Quiz/AI Image Practice
 * đã bị disabled trong codebase chính.
 * 
 * KHI CẦN ENABLE:
 * 1. Copy nội dung từ file này vào vị trí tương ứng
 * 2. Uncomment các phần được đánh dấu TODO
 * 3. Thay {false && ( thành {filterTab === 'practice' && (
 * 
 * ============================================
 */

// ============================================
// 1. SIDEBAR - AppSidebar.tsx
// ============================================
// THAY:
/*
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Case Library', href: '/student/catalog', icon: BookOpen },
    { label: 'History', href: '/student/history', icon: ClipboardList },
    { label: 'Visual QA', href: '/student/qa/image', icon: ScanSearch },
    // TODO: Uncomment when AI Image Practice is ready for production
    // { label: 'AI Image Practice', href: '/student/ai-quiz/image-based', icon: ImageIcon },
    { label: 'Quizzes', href: '/student/quizzes', icon: HelpCircle },
    { label: 'Classes', href: '/student/classes', icon: Users },
  ],
*/
// BẰNG:
/*
  student: [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Case Library', href: '/student/catalog', icon: BookOpen },
    { label: 'History', href: '/student/history', icon: ClipboardList },
    { label: 'Visual QA', href: '/student/qa/image', icon: ScanSearch },
    { label: 'AI Image Practice', href: '/student/ai-quiz/image-based', icon: ImageIcon },
    { label: 'Quizzes', href: '/student/quizzes', icon: HelpCircle },
    { label: 'Classes', href: '/student/classes', icon: Users },
  ],
*/


// ============================================
// 2. SIDEBAR - StudentSidebar.tsx  
// ============================================
// THAY:
/*
const studentMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
  { icon: BookOpen, label: 'Case Catalog', href: '/student/catalog' },
  { icon: ClipboardList, label: 'History', href: '/student/history' },
  { icon: BotMessageSquare, label: 'AI Q&A', href: '/student/qa' },
  { icon: Trophy, label: 'Quizzes', href: '/student/quiz' },
  { icon: Eye, label: 'Review', href: '/student/quiz/history' },
  // TODO: Uncomment when AI Quiz is ready for production
  // { icon: Sparkles, label: 'AI Quiz', href: '/student/ai-quiz' },
  { icon: UserCircle, label: 'Profile', href: '/student/profile' },
  { icon: Settings, label: 'Settings', href: '/student/settings' },
];
*/
// BẰNG:
/*
const studentMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
  { icon: BookOpen, label: 'Case Catalog', href: '/student/catalog' },
  { icon: ClipboardList, label: 'History', href: '/student/history' },
  { icon: BotMessageSquare, label: 'AI Q&A', href: '/student/qa' },
  { icon: Trophy, label: 'Quizzes', href: '/student/quiz' },
  { icon: Eye, label: 'Review', href: '/student/quiz/history' },
  { icon: Sparkles, label: 'AI Quiz', href: '/student/ai-quiz' },
  { icon: UserCircle, label: 'Profile', href: '/student/profile' },
  { icon: Settings, label: 'Settings', href: '/student/settings' },
];
*/


// ============================================
// 3. HEADER - StudentAppChrome.tsx
// ============================================
// THAY:
/*
<span className="truncate text-sm font-medium text-muted-foreground">{breadcrumb}</span>
{/*
  <Link
    href="/student/ai-quiz"
    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
  >
    <Sparkles className="h-4 w-4" />
    AI Quiz
  </Link>
*/}
// BẰNG:
/*
<span className="truncate text-sm font-medium text-muted-foreground">{breadcrumb}</span>
<Link
  href="/student/ai-quiz"
  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
>
  <Sparkles className="h-4 w-4" />
  AI Quiz
</Link>
*/


// ============================================
// 4. DASHBOARD - student/dashboard/page.tsx
// ============================================
// THAY:
/*
  // TODO: Uncomment when AI Image Practice is ready for production
  // {
  //   title: 'AI Image Practice',
  //   description: 'Upload an X-ray and get AI-generated practice questions instantly.',
  //   icon: ImageIcon,
  //   href: '/student/ai-quiz/image-based',
  //   iconColor: 'bg-purple-500/15 text-purple-700',
  // },
*/
// BẰNG:
/*
  {
    title: 'AI Image Practice',
    description: 'Upload an X-ray and get AI-generated practice questions instantly.',
    icon: ImageIcon,
    href: '/student/ai-quiz/image-based',
    iconColor: 'bg-purple-500/15 text-purple-700',
  },
*/


// ============================================
// 5. QUIZ PAGE - student/quiz/page.tsx
// ============================================

// 5A. TAB NAVIGATION - Bỏ comment tab AI Quizzes:
/*
{/* ── Tab navigation ── *//}
<div className="mb-6 flex items-center gap-1 border-b border-[#c2c6d4]/30">
  {([
    ['assigned', 'Assigned Quizzes', Trophy, assignedQuizzes.length] as const,
    // TODO: Uncomment when AI Quizzes is ready for production
    // ['practice', 'AI Quizzes', BotMessageSquare, 0] as const,
  ]).map(([key, label, Icon, count]) => (
*/

// THÀNH:
/*
{/* ── Tab navigation ── *//}
<div className="mb-6 flex items-center gap-1 border-b border-[#c2c6d4]/30">
  {([
    ['assigned', 'Assigned Quizzes', Trophy, assignedQuizzes.length] as const,
    ['practice', 'AI Quizzes', BotMessageSquare, 0] as const,
  ]).map(([key, label, Icon, count]) => (
*/

// 5B. AI QUIZ BUTTON - Sửa lại:
/*
goToAIPractice={() => {}}
className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all opacity-50 cursor-not-allowed"
>
//   <Sparkles className="h-4 w-4" />
//   AI Quiz (Coming Soon)
*/

// THÀNH:
/*
onClick={goToAIPractice}
className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
>
//   <Sparkles className="h-4 w-4" />
//   AI Quiz
*/

// 5C. AI QUIZ CONTENT - Thay {false && ( thành {filterTab === 'practice' && (:
/*
{/* ── AI Quiz active / result ── *//}
{false && (
  <>
    {/* AI Quiz Generator panel — inside AI tab, collapsible */}

*/

// THÀNH:
/*
{/* ── AI Quiz active / result ── *//}
{filterTab === 'practice' && (
  <>
    {/* AI Quiz Generator panel — inside AI tab, collapsible */}

*/

// 5D. CÁC STATE CẦN CÓ:
/*
// ── Sub-state: AI Quiz in-progress ──────────────────────────────────────────
type AIState = 'idle' | 'generating' | 'active' | 'submitting' | 'result';
type AIStateNarrow = Exclude<AIState, 'generating'>;

// ── AI Quiz Flow ─────────────────────────────────────────────────────────
const [showGenerator, setShowGenerator] = useState(false);
const [aiState, setAiState] = useState<AIState>('idle');
const [aiSession, setAiSession] = useState<StudentGeneratedQuizSession | null>(null);
const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
const [aiResult, setAiResult] = useState<{ score: number; passed: boolean; totalQuestions: number; correctAnswers: number } | null>(null);
const [genTopic, setGenTopic] = useState('');
const [genCount, setGenCount] = useState(5);
const [genDifficulty, setGenDifficulty] = useState('');

// ── Computed values for AI Quiz ─────────────────────────────────────────────────────────
const totalPages = aiSession ? Math.ceil(aiSession.questions.length / 1) : 0;
const currentPageAI = 1;
const pagedQuestion = aiSession?.questions[0];
const aiProgress = aiSession
  ? Math.round((Object.keys(aiAnswers).length / aiSession.questions.length) * 100)
  : 0;

// ── AI Quiz handlers ─────────────────────────────────────────────────────────
const goToAIPractice = () => {
  setFilterTab('practice');
  setShowGenerator(true);
};

const handleGenerate = async () => {
  if (!genTopic.trim()) return;
  setAiState('generating');
  try {
    const session = await generateAIPracticeQuiz(genTopic, genCount, genDifficulty || undefined);
    setAiSession(session);
    setAiState('active');
    setAiAnswers({});
    setAiResult(null);
  } catch (error) {
    toast.error('Failed to generate quiz');
    setAiState('idle');
  }
};

const handleSubmitAI = async () => {
  if (!aiSession) return;
  setAiState('submitting');
  try {
    const answers = aiSession.questions.map((q) => ({
      questionId: q.questionId,
      answer: aiAnswers[q.questionId] ?? '',
    }));
    const result = await submitAIPracticeQuiz(aiSession.attemptId, answers);
    setAiResult(result);
    setAiState('result');
    toast.success(`Quiz completed! Score: ${Math.round(result.score)}%`);
  } catch {
    toast.error('Failed to submit quiz');
    setAiState('active');
  }
};

const handleResetAI = () => {
  setAiSession(null);
  setAiAnswers({});
  setAiResult(null);
  setAiState('idle');
  setShowGenerator(false);
};
*/

// 5E. QUICK TOPIC CHIPS - Sửa onClick:
/*
onClick={() => {
  setGenTopic(topic);
  goToAIPractice();
}}
*/

// THÀNH (xóa goToAIPractice):
/*
onClick={() => {
  setGenTopic(topic);
  setFilterTab('practice');
  setShowGenerator(true);
}}
*/


// ============================================
// 6. TYPES - lib/api/student.ts
// ============================================
/*
/** ====== AI Quiz Session (after save to DB) ====== *//*
export interface StudentGeneratedQuizSession {
  attemptId: string;
  quizId: string;
  title: string;
  topic?: string | null;
  questions: Array<{
    questionId: string;
    questionText: string;
    type?: string | null;
    caseId?: string | null;
    caseTitle?: string | null;
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
    imageUrl?: string | null;
  }>;
  savedToHistory: boolean;
}

export async function generateAIPracticeQuiz(topic: string, count: number, difficulty?: string): Promise<StudentGeneratedQuizSession> {
  // API call implementation
}

export async function submitAIPracticeQuiz(attemptId: string, answers: Array<{ questionId: string; answer: string }>): Promise<{ score: number; passed: boolean; totalQuestions: number; correctAnswers: number }> {
  // API call implementation
}
*/


// ============================================
// 7. FULL COMPONENT - AI Quiz Tab Content
// ============================================
/*
        {/* ── AI Quiz active / result ── *//}
        {filterTab === 'practice' && (
          <>
            {/* AI Quiz Generator panel — inside AI tab, collapsible *//*}
            {showGenerator &&
              aiState !== 'active' &&
              aiState !== 'submitting' &&
              aiState !== 'result' && (
                <div className="mb-6 rounded-2xl border border-[#924e00]/25 bg-gradient-to-br from-[#ffdcc3]/25 to-white p-5 shadow-sm dark:from-amber-950/30 dark:to-slate-900">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 shrink-0 text-[#703a00]" />
                      <div>
                        <h3 className="font-['Manrope',sans-serif] text-base font-bold text-[#703a00]">
                          Generate AI Practice Quiz
                        </h3>
                        <p className="text-xs text-[#424752]">
                          Select a topic → generate a quiz → start practicing. After submitting, view it in History.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGenerator(false)}
                      className="text-xs font-semibold text-[#727783] hover:text-[#191c1e]"
                    >
                      Collapse
                    </button>
                  </div>

                  {aiState === 'generating' ? (
                    <div className="flex items-center gap-3 py-6 text-sm text-[#703a00]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating questions…
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-[#703a00]">Topic</label>
                          <select
                            value={genTopic}
                            onChange={(e) => setGenTopic(e.target.value)}
                            className="w-full rounded-xl border border-[#924e00]/25 bg-white px-3 py-2 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#703a00]/30"
                          >
                            <option value="">Select a topic…</option>
                            {QUICK_TOPICS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#703a00]">Questions</label>
                          <select
                            value={genCount}
                            onChange={(e) => setGenCount(Number(e.target.value))}
                            className="w-full rounded-xl border border-[#924e00]/25 bg-white px-3 py-2 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#703a00]/30"
                          >
                            {[3, 5, 10, 15, 20].map((n) => (
                              <option key={n} value={n}>
                                {n} questions
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#703a00]">Difficulty</label>
                          <select
                            value={genDifficulty}
                            onChange={(e) => setGenDifficulty(e.target.value)}
                            className="w-full rounded-xl border border-[#924e00]/25 bg-white px-3 py-2 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#703a00]/30"
                          >
                            <option value="">All</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={!genTopic.trim()}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#703a00] to-[#924e00] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate & Start
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            {aiState === 'idle' ? (
              <div className="rounded-2xl border border-dashed border-[#c2c6d4] bg-white px-6 py-12 text-center">
                <Brain className="mx-auto h-10 w-10 text-[#703a00]" />
                <h3 className="mt-3 text-lg font-semibold text-[#191c1e]">Practice with AI</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#424752]">
                  Generate a quiz by topic, answer questions, then submit — your score will be saved to History.
                </p>
                {!showGenerator && (
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00478d] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#005eb8]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Open Generator
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Session header *//*}
                {aiSession && (
                  <div className="flex items-center justify-between rounded-2xl border border-[#924e00]/30 bg-[#ffdcc3]/20 p-4">
                    <div>
                      <p className="font-semibold text-[#703a00]">{aiSession.title}</p>
                      <p className="text-xs text-[#703a00]/70">
                        {aiSession.questions.length} questions •{' '}
                        {aiSession.topic ? `Topic: ${aiSession.topic}` : 'AI-generated'}
                      </p>
                    </div>
                    {aiState === 'result' && (
                      <button
                        type="button"
                        onClick={handleResetAI}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#703a00] shadow-sm hover:bg-[#ffdcc3]"
                      >
                        <Plus className="h-4 w-4" /> New Quiz
                      </button>
                    )}
                  </div>
                )}

                {/* Result banner *//*}
                {aiState === 'result' && aiResult && (
                  <div className="rounded-2xl border border-[#006a68]/30 bg-[#94efec]/20 p-6">
                    <div className="mb-4 flex items-center gap-3">
                      {aiResult.passed
                        ? <CheckCircle className="h-8 w-8 text-[#006a68]" />
                        : <XCircle className="h-8 w-8 text-[#ba1a1a]" />}
                      <div>
                        <h3 className={`text-2xl font-black ${scoreColor(aiResult.score)}`}>
                          {Math.round(aiResult.score)}%
                        </h3>
                        <p className="text-sm text-[#424752]">
                          {aiResult.correctAnswers}/{aiResult.totalQuestions} correct —{' '}
                          {aiResult.passed ? 'Passed' : 'Needs improvement'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => aiSession && openReview(aiSession.attemptId)}
                        disabled={reviewLoading}
                        className="flex items-center gap-2 rounded-xl border border-[#00478d]/30 bg-white px-4 py-2 text-sm font-semibold text-[#00478d] hover:bg-[#d6e3ff]"
                      >
                        {reviewLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        Review Answers
                      </button>
                      {!aiResult.passed && (
                        <button
                          type="button"
                          onClick={() => {
                            setGenTopic(aiSession?.topic ?? '');
                            handleResetAI();
                          }}
                          className="flex items-center gap-2 rounded-xl border border-[#924e00]/30 bg-white px-4 py-2 text-sm font-semibold text-[#703a00]"
                        >
                          <RotateCcw className="h-4 w-4" /> Try Again
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Questions *//*}
                {(aiState === 'active' || aiState === 'submitting') && aiSession && (
                  <>
                    {/* Progress bar *//*}
                    <div className="rounded-2xl border border-[#c2c6d4]/30 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-[#424752]">
                        <span>Question 1 / {aiSession.questions.length}</span>
                        <span>{aiProgress}% completed</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#eceef0]">
                        <div
                          className="h-full rounded-full bg-[#924e00] transition-all"
                          style={{ width: `${aiProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Current question *//*}
                    {pagedQuestion && (
                      <div className="rounded-2xl border border-[#924e00]/30 bg-white p-6">
                        <div className="mb-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#924e00]">
                            Question 1
                          </p>
                          <h3 className="mt-2 font-['Manrope',sans-serif] text-lg font-semibold text-[#191c1e]">
                            {pagedQuestion.questionText}
                          </h3>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {(['A', 'B', 'C', 'D'] as const).map((key) => {
                            const val = pagedQuestion[`option${key}` as keyof typeof pagedQuestion] as string | undefined;
                            if (!val) return null;
                            const isSelected = aiAnswers[pagedQuestion.questionId] === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  setAiAnswers((prev) => ({ ...prev, [pagedQuestion.questionId]: key }))
                                }
                                className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                                  isSelected
                                    ? 'border-[#924e00] bg-[#ffdcc3]/30 text-[#703a00] ring-1 ring-[#924e00]/40'
                                    : 'border-[#c2c6d4]/40 bg-[#f2f4f6] text-[#191c1e] hover:border-[#924e00]/40'
                                }`}
                              >
                                <span className="mr-2 font-bold text-[#924e00]">{key}.</span>{val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Navigation *//*}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-2 rounded-xl border border-[#c2c6d4]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#424752] opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitAI}
                        disabled={aiState === 'submitting'}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006a68] to-[#00478d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                      >
                        {aiState === 'submitting' ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                        ) : (
                          <><CheckCircle className="h-4 w-4" /> Submit</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
*/


// ============================================
// 8. API FUNCTIONS - lib/api/student.ts
// ============================================
/*
import type { StudentGeneratedQuizSession } from './types';

export async function generateAIPracticeQuiz(
  topic: string,
  count: number,
  difficulty?: string
): Promise<StudentGeneratedQuizSession> {
  const { data } = await http.post<StudentGeneratedQuizSession>('/api/student/ai-quiz/generate', {
    topic,
    count,
    difficulty,
  });
  return data;
}

export async function submitAIPracticeQuiz(
  attemptId: string,
  answers: Array<{ questionId: string; answer: string }>
): Promise<{ score: number; passed: boolean; totalQuestions: number; correctAnswers: number }> {
  const { data } = await http.post(`/api/student/ai-quiz/${attemptId}/submit`, { answers });
  return data as { score: number; passed: boolean; totalQuestions: number; correctAnswers: number };
}
*/


// ============================================
// 9. IMAGE-BASED PAGE - student/ai-quiz/image-based/page.tsx
// ============================================
/*
Đây là trang AI Image Practice hoàn chỉnh với:
- Upload ảnh X-quang
- Chế độ Hỏi AI (Q&A)
- Chế độ Tạo Quiz từ ảnh

Xem file: src/app/student/ai-quiz/image-based/page.tsx
*/


// ============================================
// 10. AI QUIZ PAGE - student/ai-quiz/page.tsx
// ============================================
/*
Trang chính cho AI Quiz, redirect hoặc integrate với student/quiz/page.tsx
Xem file: src/app/student/ai-quiz/page.tsx
*/


/**
 * ============================================
 * HƯỚNG DẪN ENABLE
 * ============================================
 * 
 * Step 1: Enable trong Sidebar
 *   - AppSidebar.tsx - bỏ comment AI Image Practice
 *   - StudentSidebar.tsx - bỏ comment AI Quiz
 * 
 * Step 2: Enable trong Header
 *   - StudentAppChrome.tsx - bỏ comment Link AI Quiz
 * 
 * Step 3: Enable Dashboard Card
 *   - student/dashboard/page.tsx - bỏ comment AI Image Practice card
 * 
 * Step 4: Enable Quiz Page
 *   - student/quiz/page.tsx:
 *     - Thêm AI state và handlers
 *     - Thay {false && ( thành {filterTab === 'practice' && (
 *     - Bỏ comment tab AI Quizzes
 *     - Sửa nút AI Quiz button
 * 
 * Step 5: API Backend
 *   - VisualQAController.cs - endpoint /api/student/ai-quiz/*
 *   - VisualQaAiService.cs - AI generation logic
 * 
 * Step 6: Test
 *   - npm run dev
 *   - Test upload ảnh
 *   - Test generate quiz
 *   - Test submit và xem kết quả
 * 
 * ============================================
 */
