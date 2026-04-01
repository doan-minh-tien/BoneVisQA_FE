import { http, getApiErrorMessage } from './client';
import type {
  StudentCaseHistoryItem,
  StudentPracticeQuiz,
  StudentProfile,
  StudentProfileUpdatePayload,
  StudentProgress,
  StudentQuizAnswer,
  StudentQuizSubmissionResult,
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
