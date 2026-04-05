import { http, getApiErrorMessage } from './client';
import type {
  QuizDto,
  ClassQuizDto,
  CreateQuizRequest,
  QuizQuestionDto,
  CreateQuizQuestionRequest,
  UpdateQuizQuestionRequest,
} from './types';

export interface UpdateQuizRequest {
  title: string;
  openTime?: string | null;
  closeTime?: string | null;
  timeLimit?: number | null;
  passingScore?: number | null;
}

// ========== Quiz Management ==========

/**
 * Get all quizzes for a lecturer across all classes
 */
export async function getLecturerQuizzes(lecturerId: string): Promise<ClassQuizDto[]> {
  try {
    const { data } = await http.get<ClassQuizDto[]>('/api/lecturer/quizzes', {
      params: { lecturerId },
    });
    return Array.isArray(data) ? data : [];
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
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
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
    return data;
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
    return data;
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
