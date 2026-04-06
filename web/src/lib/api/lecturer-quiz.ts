import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import type {
  QuizDto,
  ClassQuizDto,
  CreateQuizRequest,
  QuizQuestionDto,
  CreateQuizQuestionRequest,
  UpdateQuizQuestionRequest,
} from './types';

/** BE có thể trả camelCase hoặc PascalCase tùy cấu hình JSON. */
function normalizeQuizQuestionDto(q: QuizQuestionDto): QuizQuestionDto {
  const raw = q as QuizQuestionDto & { ImageUrl?: string | null };
  const imageUrl = q.imageUrl ?? raw.ImageUrl ?? null;
  return { ...q, imageUrl };
}

export interface UpdateQuizRequest {
  title: string;
  openTime?: string | null;
  closeTime?: string | null;
  timeLimit?: number | null;
  passingScore?: number | null;
}

// ========== Quiz Management ==========

/** BE có thể trả camelCase hoặc PascalCase. */
function normalizeClassQuizDto(raw: ClassQuizDto & Record<string, unknown>): ClassQuizDto {
  const r = raw as ClassQuizDto & {
    ClassId?: string;
    QuizId?: string;
    QuizName?: string | null;
    ClassName?: string | null;
    Topic?: string | null;
    AssignedAt?: string | null;
    OpenTime?: string | null;
    CloseTime?: string | null;
    QuestionCount?: number;
  };
  return {
    classId: raw.classId ?? r.ClassId ?? '',
    quizId: raw.quizId ?? r.QuizId ?? '',
    quizName: raw.quizName ?? r.QuizName ?? null,
    className: raw.className ?? r.ClassName ?? null,
    topic: raw.topic ?? r.Topic ?? null,
    assignedAt: raw.assignedAt ?? r.AssignedAt ?? null,
    openTime: raw.openTime ?? r.OpenTime ?? null,
    closeTime: raw.closeTime ?? r.CloseTime ?? null,
    questionCount: raw.questionCount ?? r.QuestionCount,
  };
}

/**
 * Get all quizzes for a lecturer across all classes
 */
export async function getLecturerQuizzes(lecturerId: string): Promise<ClassQuizDto[]> {
  try {
    const { data } = await http.get<ClassQuizDto[]>('/api/lecturer/quizzes', {
      params: { lecturerId },
    });
    const list = Array.isArray(data) ? data : [];
    return list.map((row) => normalizeClassQuizDto(row as ClassQuizDto & Record<string, unknown>));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get quizzes for a specific class
 */
export async function getClassQuizzes(classId: string): Promise<QuizDto[]> {
  try {
    const { data } = await http.get<QuizDto[]>(`/api/lecturer/classes/${classId}/quizzes`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get a single quiz by ID
 */
export async function getQuiz(quizId: string): Promise<QuizDto> {
  try {
    const { data } = await http.get<QuizDto>(`/api/lecturer/quizzes/${quizId}`);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get batch quizzes by IDs
 */
export async function getQuizzesByIds(quizIds: string[]): Promise<QuizDto[]> {
  try {
    const { data } = await http.get<QuizDto[]>('/api/lecturer/quizzes/batch', {
      params: { quizIds },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Create a new quiz
 */
export async function createQuiz(body: CreateQuizRequest): Promise<QuizDto> {
  try {
    const { data } = await http.post<QuizDto>('/api/lecturer', body);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Update quiz information
 */
export async function updateQuiz(quizId: string, body: UpdateQuizRequest): Promise<QuizDto> {
  try {
    const { data } = await http.put<QuizDto>(`/api/lecturer/quizzes/${quizId}`, body);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Assign a quiz to a class
 */
export async function assignQuizToClass(classId: string, quizId: string): Promise<ClassQuizDto> {
  try {
    const { data } = await http.post<ClassQuizDto>(
      `/api/lecturer/classes/${classId}/quizzes/${quizId}`,
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ========== Quiz Questions ==========

/**
 * Get questions for a quiz
 */
export async function getQuizQuestions(quizId: string): Promise<QuizQuestionDto[]> {
  try {
    const { data } = await http.get<QuizQuestionDto[]>(`/api/lecturer/quizzes/${quizId}/questions`);
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeQuizQuestionDto);
  } catch (e) {
    // BE trả 404 khi quiz chưa có câu hỏi — coi như danh sách rỗng
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return [];
    }
    throw new Error(getApiErrorMessage(e));
  }
}

const DEFAULT_QUESTION_BATCH = 6;

/** Gửi nhiều câu hỏi song song theo lô để publish nhanh hơn (tránh nối tuần tự). */
export async function addQuizQuestionsBatched(
  quizId: string,
  items: CreateQuizQuestionRequest[],
  batchSize = DEFAULT_QUESTION_BATCH,
): Promise<void> {
  const list = items.map((q) => ({ ...q, quizId }));
  for (let i = 0; i < list.length; i += batchSize) {
    const slice = list.slice(i, i + batchSize);
    await Promise.all(slice.map((q) => addQuizQuestion(q)));
  }
}

/**
 * Get a single question by ID
 */
export async function getQuizQuestion(questionId: string): Promise<QuizQuestionDto> {
  try {
    const { data } = await http.get<QuizQuestionDto>(
      `/api/lecturer/quizzes/questions/${questionId}`,
    );
    return normalizeQuizQuestionDto(data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Add a new question to a quiz
 */
export async function addQuizQuestion(body: CreateQuizQuestionRequest): Promise<QuizQuestionDto> {
  try {
    const { data } = await http.post<QuizQuestionDto>(
      `/api/lecturer/quizzes/${body.quizId}/questions`,
      body,
    );
    return normalizeQuizQuestionDto(data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Update an existing question
 */
export async function updateQuizQuestion(
  questionId: string,
  body: UpdateQuizQuestionRequest,
): Promise<void> {
  try {
    await http.put(`/api/lecturer/quizzes/questions/${questionId}`, body);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Delete a question
 */
export async function deleteQuizQuestion(questionId: string): Promise<void> {
  try {
    await http.delete(`/api/lecturer/quizzes/questions/${questionId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ========== AI Quiz Functions ==========

import type {
  AIQuizGenerationResult,
  AIAutoGenerateQuizRequest,
  AISuggestQuestionsRequest,
} from './types';

/**
 * AI Auto-Generate Quiz: Tạo quiz tự động từ topic
 */
export async function aiAutoGenerateQuiz(
  request: AIAutoGenerateQuizRequest
): Promise<AIQuizGenerationResult> {
  try {
    const { data } = await http.post<AIQuizGenerationResult>(
      '/api/lecturer/ai/generate-quiz',
      request
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * AI Suggest Questions: Gợi ý câu hỏi từ các cases đã chọn
 */
export async function aiSuggestQuestions(
  request: AISuggestQuestionsRequest
): Promise<AIQuizGenerationResult> {
  try {
    const { data } = await http.post<AIQuizGenerationResult>(
      '/api/lecturer/ai/suggest-questions',
      request
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * AI Create Complete Quiz: Tạo quiz hoàn chỉnh từ AI
 */
export async function aiCreateQuiz(
  request: AIAutoGenerateQuizRequest
): Promise<{ quizId: string; title: string; questionsCreated: number; message: string }> {
  try {
    const { data } = await http.post<{ quizId: string; title: string; questionsCreated: number; message: string }>(
      '/api/lecturer/ai/create-quiz',
      request
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
