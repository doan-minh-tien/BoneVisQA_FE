import axios from 'axios';
import { http, getApiErrorMessage } from './client';
import type { ClassItem, LecturerTriageRow } from './types';

export async function fetchLecturerClasses(lecturerId: string): Promise<ClassItem[]> {
  try {
    const { data } = await http.get<ClassItem[]>('/api/lecturer/classes', {
      params: { lecturerId },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchLecturerTriageList(classId: string): Promise<LecturerTriageRow[]> {
  try {
    const { data } = await http.get<unknown[]>('/api/lecturer/triage', {
      params: { classId },
    });
    return (data ?? []).map(normalizeTriageRow).filter((x): x is LecturerTriageRow => x !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getQuestionDetail(
  classId: string,
  questionId: string,
): Promise<unknown> {
  try {
    const { data } = await http.get(`/api/lecturer/classes/${classId}/questions/${questionId}`);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function respondToQuestion(
  classId: string,
  questionId: string,
  body: {
    answerText: string;
    structuredDiagnosis?: string;
    differentialDiagnoses?: string;
    approve: boolean;
  },
): Promise<unknown> {
  try {
    const { data } = await http.put(
      `/api/lecturer/classes/${classId}/questions/${questionId}/respond`,
      body,
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export const TRIAGE_ALREADY_ESCALATED = 'TRIAGE_ALREADY_ESCALATED';

/**
 * Quick-approve an existing AI answer (marks it Approved without editing).
 * Uses the existing respond endpoint with approve=true and existing answer text.
 */
export async function approveAnswer(
  classId: string,
  questionId: string,
  existingAnswerText: string,
): Promise<void> {
  try {
    await http.put(
      `/api/lecturer/classes/${classId}/questions/${questionId}/respond`,
      {
        answerText: existingAnswerText,
        approve: true,
      },
    );
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function escalateToExpert(answerId: string): Promise<void> {
  try {
    await http.post(`/api/lecturer/triage/${answerId}/escalate`);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 409) {
      throw new Error(TRIAGE_ALREADY_ESCALATED);
    }
    throw new Error(getApiErrorMessage(e));
  }
}

function normalizeTriageRow(row: unknown): LecturerTriageRow | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const id = String(r.answerId ?? r.AnswerId ?? r.questionId ?? r.QuestionId ?? '');
  if (!id) return null;

  return {
    id,
    studentName: String(r.studentName ?? r.StudentName ?? ''),
    questionSnippet: String(
      r.questionText ?? r.QuestionText ?? r.questionSnippet ?? r.question ?? '',
    ),
    thumbnailUrl: String(
      r.thumbnailUrl ?? r.ThumbnailUrl ?? r.caseThumbnailUrl ?? r.imageUrl ?? '',
    ),
    askedAt: String(r.askedAt ?? r.AskedAt ?? r.createdAt ?? r.questionCreatedAt ?? ''),
    similarityScore: Number(r.aiConfidenceScore ?? r.AiConfidenceScore ?? r.similarityScore ?? 0),
    escalated: !!(r.isEscalated ?? r.IsEscalated ?? (r.status === 'Escalated' ? true : false)),
  };
}
