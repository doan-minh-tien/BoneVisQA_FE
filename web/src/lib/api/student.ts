import { http, getApiErrorMessage } from './client';
import type {
  AssignedQuizItem,
  QuizSessionDto,
  StudentAnnouncement,
  StudentCaseCatalogItem,
  StudentCaseHistoryItem,
  StudentPracticeQuiz,
  StudentProfile,
  StudentProfileUpdatePayload,
  StudentProgress,
  StudentQuizAnswer,
  StudentQuizSubmissionResult,
  StudentQuizResultDto,
  StudentRecentActivityItem,
  StudentSubmitQuestionDto,
  StudentTopicStat,
} from './types';

function normalizeDifficulty(raw: unknown): StudentCaseHistoryItem['difficulty'] {
  const value = String(raw ?? '').toLowerCase();
  if (value === 'advanced') return 'advanced';
  if (value === 'intermediate') return 'intermediate';
  return 'basic';
}

function mapStudentCase(row: unknown): StudentCaseHistoryItem | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? item.caseId ?? item.answerId ?? '');
  if (!id) return null;

  return {
    id,
    title: String(item.title ?? item.question ?? item.questionText ?? 'Untitled case'),
    thumbnailUrl:
      item.thumbnailUrl != null
        ? String(item.thumbnailUrl)
        : item.imageUrl != null
          ? String(item.imageUrl)
          : undefined,
    boneLocation: String(item.boneLocation ?? item.regionName ?? item.region ?? 'Clinical case'),
    lesionType: String(item.lesionType ?? item.caseType ?? item.categoryName ?? 'Visual QA'),
    difficulty: normalizeDifficulty(item.difficulty),
    duration: item.duration != null ? String(item.duration) : undefined,
    progress: typeof item.progress === 'number' ? item.progress : undefined,
    status: item.status != null ? String(item.status) : undefined,
    askedAt: item.askedAt != null ? String(item.askedAt) : item.createdAt != null ? String(item.createdAt) : undefined,
  };
}

function mapStudentCaseCatalog(row: unknown): StudentCaseCatalogItem | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? item.caseId ?? '');
  if (!id) return null;

  return {
    id,
    title: String(item.title ?? 'Untitled case'),
    imageUrl:
      item.imageUrl != null
        ? String(item.imageUrl)
        : item.thumbnailUrl != null
          ? String(item.thumbnailUrl)
          : undefined,
    location: String(item.location ?? item.boneLocation ?? item.regionName ?? 'Unknown location'),
    lesionType: String(item.lesionType ?? item.categoryName ?? 'Unknown lesion'),
    difficulty: normalizeDifficulty(item.difficulty),
  };
}

export async function fetchStudentProfile(): Promise<StudentProfile> {
  try {
    const { data } = await http.get<StudentProfile>('/api/student/profile');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function normalizeStudentAnnouncement(raw: unknown): StudentAnnouncement | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r.Id ?? '');
  if (!id) return null;
  return {
    id,
    classId: String(r.classId ?? r.ClassId ?? ''),
    className: r.className != null ? String(r.className) : null,
    title: String(r.title ?? r.Title ?? ''),
    content: String(r.content ?? r.Content ?? ''),
    createdAt: r.createdAt != null ? String(r.createdAt) : null,
  };
}

export async function fetchStudentAnnouncements(): Promise<StudentAnnouncement[]> {
  try {
    const { data } = await http.get<unknown[]>('/api/student/announcements');
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeStudentAnnouncement).filter((item): item is StudentAnnouncement => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateStudentProfile(
  payload: StudentProfileUpdatePayload,
): Promise<StudentProfile> {
  try {
    const { data } = await http.put<StudentProfile>('/api/student/profile', payload);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchStudentProgress(): Promise<StudentProgress> {
  try {
    const { data } = await http.get<StudentProgress>('/api/student/progress');
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchStudentPracticeQuiz(topic: string): Promise<StudentPracticeQuiz> {
  try {
    const { data } = await http.get<StudentPracticeQuiz>('/api/student/quizzes/practice', {
      params: { topic },
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * AI Generate Practice Quiz: Student tự tạo quiz ôn luyện bằng AI
 */
export async function generateAIPracticeQuiz(
  topic: string,
  questionCount?: number,
  difficulty?: string
): Promise<{
  success: boolean;
  message?: string;
  questions: Array<{
    questionText: string;
    type: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    caseId?: string;
    caseTitle?: string;
  }>;
}> {
  try {
    const { data } = await http.post<{
      success: boolean;
      message?: string;
      questions: Array<{
        questionText: string;
        type: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctAnswer: string;
        caseId?: string;
        caseTitle?: string;
      }>;
    }>('/api/student/quizzes/practice/generate', {
      topic,
      questionCount,
      difficulty,
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function submitStudentQuiz(
  attemptId: string,
  answers: StudentQuizAnswer[],
): Promise<StudentQuizSubmissionResult> {
  try {
    const { data } = await http.post<StudentQuizSubmissionResult>('/api/student/quizzes/submit', {
      attemptId,
      answers,
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get all quizzes assigned to the current student (from enrolled classes).
 */
export async function getAssignedQuizzes(): Promise<AssignedQuizItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/student/quizzes');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return (list as Record<string, unknown>[]).map(mapQuizListItem);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function mapQuizListItem(item: Record<string, unknown>): AssignedQuizItem {
  return {
    quizId: String(item.quizId ?? item.QuizId ?? ''),
    quizName: String(item.title ?? item.Title ?? item.quizName ?? 'Untitled quiz'),
    classId: String(item.classId ?? item.ClassId ?? ''),
    className: String(item.className ?? item.ClassName ?? ''),
    totalQuestions: typeof item.totalQuestions === 'number' ? item.totalQuestions : 0,
    timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : null,
    passingScore: typeof item.passingScore === 'number' ? item.passingScore : null,
    openTime: item.openTime != null ? String(item.openTime) : null,
    closeTime: item.closeTime != null ? String(item.closeTime) : null,
    isCompleted: Boolean(item.isCompleted ?? item.IsCompleted ?? false),
    score: typeof item.score === 'number' ? item.score : null,
  };
}

/**
 * Start a quiz session: GET /api/student/quizzes/{quizId}/start
 * Returns questions so the student can begin answering.
 */
export async function startQuizSession(quizId: string): Promise<QuizSessionDto> {
  try {
    const { data } = await http.get<QuizSessionDto>(`/api/student/quizzes/${quizId}/start`);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Submit all quiz answers.
 */
export async function submitQuizSession(
  attemptId: string,
  answers: StudentSubmitQuestionDto[],
): Promise<StudentQuizResultDto> {
  try {
    const { data } = await http.post<StudentQuizResultDto>('/api/student/quizzes/submit', {
      attemptId,
      answers: answers.map((a) => ({ questionId: a.questionId, studentAnswer: a.studentAnswer })),
    });
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchStudentCases(): Promise<StudentCaseHistoryItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/student/cases/history');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list.map(mapStudentCase).filter((item): item is StudentCaseHistoryItem => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchCaseCatalog(filters: {
  location?: string;
  lesionType?: string;
  difficulty?: string;
}): Promise<StudentCaseCatalogItem[]> {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && String(value).trim().length > 0),
    );
    const { data } = await http.get<unknown>('/api/student/cases/catalog', { params });
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list
      .map(mapStudentCaseCatalog)
      .filter((item): item is StudentCaseCatalogItem => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function mapStudentTopicStat(row: unknown): StudentTopicStat | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const topicName = String(item.topicName ?? item.topic ?? item.name ?? '');
  if (!topicName) return null;
  return {
    topicName,
    accuracyRate: Number(item.accuracyRate ?? 0),
    quizAttempts: Number(item.quizAttempts ?? 0),
  };
}

function mapStudentRecentActivity(row: unknown, index: number): StudentRecentActivityItem | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const title = String(item.title ?? item.activityTitle ?? item.description ?? item.message ?? '');
  const occurredAt = String(item.occurredAt ?? item.createdAt ?? item.timestamp ?? '');
  if (!title || !occurredAt) return null;

  return {
    id: String(item.id ?? item.activityId ?? index),
    title,
    description: item.description != null ? String(item.description) : item.message != null ? String(item.message) : undefined,
    occurredAt,
    type: String(item.type ?? item.activityType ?? 'activity'),
    status: item.status != null ? String(item.status) : undefined,
  };
}

export async function fetchStudentTopicStats(): Promise<StudentTopicStat[]> {
  try {
    const { data } = await http.get<unknown>('/api/student/progress/topic-stats');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list.map(mapStudentTopicStat).filter((item): item is StudentTopicStat => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchStudentRecentActivity(): Promise<StudentRecentActivityItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/student/progress/recent-activity');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list
      .map((item, index) => mapStudentRecentActivity(item, index))
      .filter((item): item is StudentRecentActivityItem => item !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// Re-export types so other modules can import from '@/lib/api/student'
export type {
  AssignedQuizItem,
  QuizSessionDto,
  StudentSubmitQuestionDto,
};

/** ====== Student Classes ====== */

export interface StudentClassItem {
  classId: string;
  className: string;
  semester: string;
  lecturerId?: string | null;
  lecturerName?: string | null;
  totalAnnouncements: number;
  totalQuizzes: number;
  totalCases: number;
  enrolledAt?: string | null;
}

/** ====== AI Quiz Session (after save to DB) ====== */

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
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
    imageUrl?: string | null;
  }>;
  savedToHistory: boolean;
}

/** ====== Quiz Attempt History ====== */

export interface QuizAttemptReview {
  attemptId: string;
  quizTitle: string;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  questions: Array<{
    questionId: string;
    questionText: string;
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
    studentAnswer?: string | null;
    correctAnswer?: string | null;
    isCorrect: boolean;
    imageUrl?: string | null;
    caseId?: string | null;
  }>;
}

export async function fetchQuizAttemptReview(attemptId: string): Promise<QuizAttemptReview> {
  try {
    const { data } = await http.get<unknown>(`/api/student/quizzes/${attemptId}/review`);
    const item = data as Record<string, unknown>;
    const questions = Array.isArray(item.questions) ? (item.questions as Record<string, unknown>[]) : [];
    return {
      attemptId: String(item.attemptId ?? item.AttemptId ?? ''),
      quizTitle: String(item.quizTitle ?? item.QuizTitle ?? ''),
      score: item.score != null ? Number(item.score) : item.Score != null ? Number(item.Score) : null,
      totalQuestions: Number(item.totalQuestions ?? item.TotalQuestions ?? 0),
      correctAnswers: Number(item.correctAnswers ?? item.CorrectAnswers ?? 0),
      passed: Boolean(item.passed ?? item.Passed ?? false),
      questions: questions.map((q) => ({
        questionId: String(q.questionId ?? q.QuestionId ?? ''),
        questionText: String(q.questionText ?? q.QuestionText ?? ''),
        optionA: q.optionA ?? q.OptionA ?? null,
        optionB: q.optionB ?? q.OptionB ?? null,
        optionC: q.optionC ?? q.OptionC ?? null,
        optionD: q.optionD ?? q.OptionD ?? null,
        studentAnswer: q.studentAnswer ?? q.StudentAnswer ?? null,
        correctAnswer: q.correctAnswer ?? q.CorrectAnswer ?? null,
        isCorrect: Boolean(q.isCorrect ?? q.IsCorrect ?? false),
        imageUrl: q.imageUrl ?? q.ImageUrl ?? null,
        caseId: q.caseId ?? q.CaseId ?? null,
      })),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface StudentQuizAttemptSummary {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  topic?: string | null;
  difficulty?: string | null;
  className?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  score?: number | null;
  passingScore?: number | null;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  isAiGenerated: boolean;
}

export async function fetchStudentClasses(): Promise<StudentClassItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/students/classes');
    const list = Array.isArray(data) ? data : [];
    return (list as Record<string, unknown>[]).map((item) => ({
      classId: String(item.classId ?? item.ClassId ?? item.classId ?? ''),
      className: String(item.className ?? item.ClassName ?? ''),
      semester: String(item.semester ?? item.Semester ?? ''),
      lecturerId: item.lecturerId != null ? String(item.lecturerId) : item.LecturerId != null ? String(item.LecturerId) : null,
      lecturerName: item.lecturerName != null ? String(item.lecturerName) : item.LecturerName != null ? String(item.LecturerName) : null,
      totalAnnouncements: Number(item.totalAnnouncements ?? item.TotalAnnouncements ?? 0),
      totalQuizzes: Number(item.totalQuizzes ?? item.TotalQuizzes ?? 0),
      totalCases: Number(item.totalCases ?? item.TotalCases ?? 0),
      enrolledAt: item.enrolledAt != null ? String(item.enrolledAt) : item.EnrolledAt != null ? String(item.EnrolledAt) : null,
    }));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * AI Generate + Save to DB → returns quiz session.
 * POST /api/student/quizzes/practice/generate
 */
export async function generateAndSaveAIPracticeQuiz(
  topic: string,
  questionCount = 5,
  difficulty?: string,
): Promise<StudentGeneratedQuizSession> {
  try {
    const { data } = await http.post<unknown>('/api/student/quizzes/practice/generate', {
      topic,
      questionCount,
      difficulty,
    });
    const item = data as Record<string, unknown>;
    const questions = Array.isArray(item.questions) ? (item.questions as Record<string, unknown>[]) : [];
    return {
      attemptId: String(item.attemptId ?? item.AttemptId ?? ''),
      quizId: String(item.quizId ?? item.QuizId ?? ''),
      title: String(item.title ?? item.Title ?? ''),
      topic: item.topic != null ? String(item.topic) : item.Topic != null ? String(item.Topic) : null,
      questions: questions.map((q) => ({
        questionId: String(q.questionId ?? q.QuestionId ?? q.id ?? ''),
        questionText: String(q.questionText ?? q.QuestionText ?? ''),
        type: q.type != null ? String(q.type) : q.Type != null ? String(q.Type) : null,
        caseId: q.caseId != null ? String(q.caseId) : q.CaseId != null ? String(q.CaseId) : null,
        optionA: q.optionA != null ? String(q.optionA) : q.OptionA != null ? String(q.OptionA) : null,
        optionB: q.optionB != null ? String(q.optionB) : q.OptionB != null ? String(q.OptionB) : null,
        optionC: q.optionC != null ? String(q.optionC) : q.OptionC != null ? String(q.OptionC) : null,
        optionD: q.optionD != null ? String(q.optionD) : q.OptionD != null ? String(q.OptionD) : null,
        imageUrl: q.imageUrl != null ? String(q.imageUrl) : q.ImageUrl != null ? String(q.ImageUrl) : null,
      })),
      savedToHistory: Boolean(item.savedToHistory ?? item.SavedToHistory ?? true),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Submit answers for an AI-generated quiz attempt.
 */
export async function submitAIPracticeQuiz(
  attemptId: string,
  answers: Array<{ questionId: string; studentAnswer: string }>,
): Promise<{
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
}> {
  try {
    const { data } = await http.post<unknown>('/api/student/quizzes/submit', {
      attemptId,
      answers,
    });
    const item = data as Record<string, unknown>;
    return {
      score: Number(item.score ?? item.Score ?? 0),
      passed: Boolean(item.passed ?? item.Passed ?? false),
      totalQuestions: Number(item.totalQuestions ?? item.TotalQuestions ?? 0),
      correctAnswers: Number(item.correctAnswers ?? item.CorrectAnswers ?? 0),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get quiz attempt history (all attempts including AI-generated).
 * GET /api/student/quizzes/history
 */
export async function fetchStudentQuizHistory(): Promise<StudentQuizAttemptSummary[]> {
  try {
    const { data } = await http.get<unknown>('/api/student/quizzes/history');
    const list = Array.isArray(data) ? data : [];
    return (list as Record<string, unknown>[]).map((item) => ({
      attemptId: String(item.attemptId ?? item.AttemptId ?? ''),
      quizId: String(item.quizId ?? item.QuizId ?? ''),
      quizTitle: String(item.quizTitle ?? item.QuizTitle ?? item.title ?? item.Title ?? ''),
      topic: item.topic != null ? String(item.topic) : item.Topic != null ? String(item.Topic) : null,
      difficulty: item.difficulty != null ? String(item.difficulty) : item.Difficulty != null ? String(item.Difficulty) : null,
      className: item.className != null ? String(item.className) : item.ClassName != null ? String(item.ClassName) : null,
      startedAt: item.startedAt != null ? String(item.startedAt) : item.StartedAt != null ? String(item.StartedAt) : null,
      completedAt: item.completedAt != null ? String(item.completedAt) : item.CompletedAt != null ? String(item.CompletedAt) : null,
      score: item.score != null ? Number(item.score) : item.Score != null ? Number(item.Score) : null,
      passingScore: item.passingScore != null ? Number(item.passingScore) : item.PassingScore != null ? Number(item.PassingScore) : null,
      passed: Boolean(item.passed ?? item.Passed ?? false),
      totalQuestions: Number(item.totalQuestions ?? item.TotalQuestions ?? 0),
      correctAnswers: Number(item.correctAnswers ?? item.CorrectAnswers ?? 0),
      isAiGenerated: Boolean(item.isAiGenerated ?? item.IsAiGenerated ?? false),
    }));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
