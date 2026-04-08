import axios from 'axios';
import { http, getApiErrorMessage } from './client';

export type ExpertQuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface ExpertQuiz {
  id: string;
  title: string;
  topic: string | null;
  openTime: string;
  closeTime: string;
  timeLimit: number;
  passingScore: number;
  isAiGenerated: boolean;
  difficulty: ExpertQuizDifficulty | string;
  classification: string | null;
  createdAt: string;
  expertName?: string;
}

interface ExpertQuizListResponse {
  message?: string;
  result?: {
    items?: unknown[];
    totalCount?: number;
    pageIndex?: number;
    pageSize?: number;
  };
}

export interface ExpertQuizPagedResponse {
  items: ExpertQuiz[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface CreateExpertQuizRequest {
  title: string;
  topic: string | null;
  openTime: string; // ISO
  closeTime: string; // ISO
  timeLimit: number;
  passingScore: number;
  isAiGenerated: boolean;
  difficulty: ExpertQuizDifficulty | string;
  classification: string | null;
  createdByExpertId?: string;
}

export type UpdateExpertQuizRequest = Partial<CreateExpertQuizRequest>;

function normalizeBoolean(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (raw == null) return false;
  const s = String(raw).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

function mapExpertQuiz(row: unknown, fallbackId?: string): ExpertQuiz | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;

  const id = String(r.id ?? r.Id ?? fallbackId ?? '');
  if (!id) return null;

  const openTime = String(r.openTime ?? r.OpenTime ?? '');
  const closeTime = String(r.closeTime ?? r.CloseTime ?? '');

  return {
    id,
    title: String(r.title ?? r.Title ?? 'Untitled quiz'),
    topic: r.topic != null ? String(r.topic) : r.Topic != null ? String(r.Topic) : null,
    openTime,
    closeTime,
    timeLimit: Number(r.timeLimit ?? r.TimeLimit ?? 0),
    passingScore: Number(r.passingScore ?? r.PassingScore ?? 0),
    isAiGenerated: normalizeBoolean(r.isAiGenerated ?? r.IsAiGenerated),
    difficulty: String(r.difficulty ?? r.Difficulty ?? 'Easy'),
    classification:
      r.classification != null
        ? String(r.classification)
        : r.Classification != null
          ? String(r.Classification)
          : null,
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    expertName: r.expertName != null ? String(r.expertName) : r.ExpertName != null ? String(r.ExpertName) : undefined,
  };
}

export async function fetchExpertQuizzes(pageIndex = 1, pageSize = 100): Promise<ExpertQuiz[]> {
  try {
    const res = await fetchExpertQuizzesPaged(pageIndex, pageSize);
    return res.items;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertQuizzesPaged(pageIndex = 1, pageSize = 100): Promise<ExpertQuizPagedResponse> {
  try {
    const { data } = await http.get<ExpertQuizListResponse>(
      `/api/expert/quizzes?pageIndex=${pageIndex}&pageSize=${pageSize}`,
    );

    const itemsRaw = data?.result?.items;
    const totalCount = Number(data?.result?.totalCount ?? 0);
    const pageIndexOut = Number(data?.result?.pageIndex ?? pageIndex);
    const pageSizeOut = Number(data?.result?.pageSize ?? pageSize);

    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((row) => mapExpertQuiz(row)).filter((q): q is ExpertQuiz => q !== null)
      : [];

    return {
      items,
      totalCount,
      pageIndex: pageIndexOut,
      pageSize: pageSizeOut,
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createExpertQuiz(input: CreateExpertQuizRequest): Promise<ExpertQuiz> {
  try {
    const { data } = await http.post<ExpertQuizListResponse | { result?: unknown; message?: string }>(
      '/api/expert/quizzes',
      input,
    );

    // BE thường trả: { message, result: { ... } }
    const row =
      (data as any)?.result ??
      (data as any)?.Result ??
      data;

    const mapped = mapExpertQuiz(row);
    if (!mapped) throw new Error('Invalid quiz response from server');
    return mapped;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateExpertQuiz(id: string, input: UpdateExpertQuizRequest): Promise<ExpertQuiz> {
  // BE C# thường bind DTO.Id, nên gửi cả `Id` và `id` để chắc chắn.
  const bodyWithId = { Id: id, id, ...(input ?? {}) };
  try {
    // Theo BE của bạn: update chạy ở PUT /api/expert/quizzes (id nằm trong body)
    const { data } = await http.put<{ result?: unknown; message?: string }>(
      `/api/expert/quizzes`,
      bodyWithId,
    );

    const row = data?.result ?? data;
    const mapped = mapExpertQuiz(row, id);
    if (!mapped) throw new Error('Invalid quiz response from server');
    return mapped;
  } catch (e) {
    // fallback tối thiểu nếu PUT không được phép
    if (!axios.isAxiosError(e)) throw new Error(getApiErrorMessage(e));

    const status = e.response?.status;
    if (status !== 405 && status !== 400 && status !== 404) throw new Error(getApiErrorMessage(e));

    // Thử PATCH /api/expert/quizzes (cũng là kiểu id trong body)
    try {
      const { data } = await http.patch<{ result?: unknown; message?: string }>(`/api/expert/quizzes`, bodyWithId);
      const row = data?.result ?? data;
      const mapped = mapExpertQuiz(row, id);
      if (!mapped) throw new Error('Invalid quiz response from server');
      return mapped;
    } catch {
      // fallthrough
    }

    // Thử update theo route có {id}
    try {
      const { data } = await http.put<{ result?: unknown; message?: string }>(`/api/expert/quizzes/${id}`, bodyWithId);
      const row = data?.result ?? data;
      const mapped = mapExpertQuiz(row, id);
      if (!mapped) throw new Error('Invalid quiz response from server');
      return mapped;
    } catch {
      // fallthrough
    }

    try {
      const { data } = await http.patch<{ result?: unknown; message?: string }>(`/api/expert/quizzes/${id}`, bodyWithId);
      const row = data?.result ?? data;
      const mapped = mapExpertQuiz(row, id);
      if (!mapped) throw new Error('Invalid quiz response from server');
      return mapped;
    } catch {
      // fallthrough
    }

    throw new Error(getApiErrorMessage(e));
  }
}

export async function deleteExpertQuiz(id: string): Promise<void> {
  try {
    await http.delete(`/api/expert/quizzes/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ========== Expert Assign & Score ==========

export interface AssignQuizRequest {
  classId: string;
  quizId: string;
  assignedExpertId?: string | null;
  openTime?: string | null; // ISO
  closeTime?: string | null; // ISO
  passingScore?: number | null;
  timeLimitMinutes?: number | null;
}

export interface AssignQuizResult {
  classId: string;
  className: string;
  quizId: string;
  quizName: string;
  expertName: string;
  assignedAt: string;
  openTime: string;
  closeTime: string;
  passingScore: number;
  timeLimitMinutes: number;
}

export async function assignExpertQuiz(payload: AssignQuizRequest): Promise<AssignQuizResult> {
  try {
    const { data } = await http.post<unknown>('/api/expert/assign', payload);
    const body = data as any;
    const row = body?.result ?? body?.Result ?? body;

    return {
      classId: String(row?.classId ?? row?.ClassId ?? ''),
      className: String(row?.className ?? row?.ClassName ?? ''),
      quizId: String(row?.quizId ?? row?.QuizId ?? ''),
      quizName: String(row?.quizName ?? row?.QuizName ?? ''),
      expertName: String(row?.expertName ?? row?.ExpertName ?? ''),
      assignedAt: String(row?.assignedAt ?? row?.AssignedAt ?? ''),
      openTime: String(row?.openTime ?? row?.OpenTime ?? ''),
      closeTime: String(row?.closeTime ?? row?.CloseTime ?? ''),
      passingScore: Number(row?.passingScore ?? row?.PassingScore ?? 0),
      timeLimitMinutes: Number(
        row?.timeLimitMinutes ?? row?.TimeLimitMinutes ?? row?.timeLimitMinutes ?? row?.timeLimit ?? 0,
      ),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export interface CalculateAttemptScoreResult {
  attemptId: string;
  studentId: string;
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passingScore: number;
  isPassed: boolean;
  completedAt: string;
}

export async function calculateAttemptScore(attemptId: string): Promise<CalculateAttemptScoreResult> {
  try {
    const { data } = await http.get<unknown>(`/api/expert/attempts/${attemptId}/score`);
    const body = data as any;
    const row = body?.result ?? body?.Result ?? body;

    return {
      attemptId: String(row?.attemptId ?? row?.AttemptId ?? attemptId),
      studentId: String(row?.studentId ?? row?.StudentId ?? ''),
      quizId: String(row?.quizId ?? row?.QuizId ?? ''),
      quizTitle: String(row?.quizTitle ?? row?.QuizTitle ?? ''),
      totalQuestions: Number(row?.totalQuestions ?? row?.TotalQuestions ?? 0),
      correctAnswers: Number(row?.correctAnswers ?? row?.CorrectAnswers ?? 0),
      score: Number(row?.score ?? row?.Score ?? 0),
      passingScore: Number(row?.passingScore ?? row?.PassingScore ?? 0),
      isPassed: Boolean(row?.isPassed ?? row?.IsPassed),
      completedAt: String(row?.completedAt ?? row?.CompletedAt ?? ''),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertClassesPaged(pageIndex = 1, pageSize = 100): Promise<{ id: string; className: string }[]> {
  try {
    const { data } = await http.get<unknown>(`/api/expert/class?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    const body = data as any;
    const rawList = body?.result?.items ?? body?.result ?? body?.items ?? body;
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((c: any) => ({
      id: String(c.id ?? c.Id ?? ''),
      className: String(c.className ?? c.ClassName ?? c.name ?? c.Name ?? 'Unknown Class'),
    }));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchExpertUsersPaged(pageIndex = 1, pageSize = 100): Promise<{ id: string; fullName: string }[]> {
  try {
    const { data } = await http.get<unknown>(`/api/expert/expert?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    const body = data as any;
    const rawList = body?.result?.items ?? body?.result ?? body?.items ?? body;
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((u: any) => ({
      id: String(u.id ?? u.Id ?? u.userId ?? u.UserId ?? ''),
      fullName: String(u.fullName ?? u.FullName ?? u.name ?? u.Name ?? 'Unknown Expert'),
    }));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
