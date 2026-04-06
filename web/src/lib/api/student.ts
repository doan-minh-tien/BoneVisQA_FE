import { http, getApiErrorMessage } from './client';
import type {
  AssignedQuizItem,
  QuizSessionDto,
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
    const { data } = await http.get<unknown>('/api/student/cases');
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
export type { AssignedQuizItem, QuizSessionDto, StudentSubmitQuestionDto };
