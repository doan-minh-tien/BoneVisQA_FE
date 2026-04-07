'use client';

import axios from 'axios';
import { getApiErrorMessage, http } from './client';
import type { CaseDto, ClassItem, QuizDto, StudentEnrollment } from './types';

export class ForbiddenApiError extends Error {
  constructor(message = 'You are not allowed to access this resource.') {
    super(message);
    this.name = 'ForbiddenApiError';
  }
}

function throwApiError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    throw new ForbiddenApiError(getApiErrorMessage(error));
  }
  throw new Error(getApiErrorMessage(error));
}

export type UpsertLecturerClassPayload = {
  className: string;
  semester: string;
  expertId?: string;
};

export type AssignCasesPayload = {
  caseIds: string[];
  dueDate?: string;
  isMandatory: boolean;
};

export type AssignQuizPayload = {
  quizId: string;
  openTime?: string;
  closeTime?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
};

export async function createLecturerClass(payload: UpsertLecturerClassPayload): Promise<ClassItem> {
  try {
    const { data } = await http.post<ClassItem>('/api/lecturer/classes', payload);
    return data;
  } catch (error) {
    throwApiError(error);
  }
}

export async function fetchLecturerClasses(): Promise<ClassItem[]> {
  try {
    const { data } = await http.get<ClassItem[]>('/api/lecturer/classes');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throwApiError(error);
  }
}

export async function fetchLecturerClassById(classId: string): Promise<ClassItem> {
  try {
    const { data } = await http.get<ClassItem>(`/api/lecturer/classes/${classId}`);
    return data;
  } catch (error) {
    throwApiError(error);
  }
}

export async function updateLecturerClass(
  classId: string,
  payload: UpsertLecturerClassPayload,
): Promise<ClassItem> {
  try {
    const { data } = await http.put<ClassItem>(`/api/lecturer/classes/${classId}`, payload);
    return data;
  } catch (error) {
    throwApiError(error);
  }
}

export async function deleteLecturerClass(classId: string): Promise<void> {
  try {
    await http.delete(`/api/lecturer/classes/${classId}`);
  } catch (error) {
    throwApiError(error);
  }
}

export async function enrollStudentsMany(classId: string, studentIds: string[]): Promise<void> {
  try {
    await http.post(`/api/lecturer/classes/${classId}/enrollmany`, { studentIds });
  } catch (error) {
    throwApiError(error);
  }
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  try {
    await http.delete(`/api/lecturer/classes/${classId}/students/${studentId}`);
  } catch (error) {
    throwApiError(error);
  }
}

export async function fetchClassStudents(classId: string): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.get<StudentEnrollment[]>(`/api/lecturer/classes/${classId}/students`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throwApiError(error);
  }
}

export async function fetchAvailableStudents(classId: string): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.get<StudentEnrollment[]>(
      `/api/lecturer/classes/${classId}/students/available`,
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throwApiError(error);
  }
}

export async function assignCasesToLecturerClass(
  classId: string,
  payload: AssignCasesPayload,
): Promise<void> {
  try {
    await http.post(`/api/lecturer/classes/${classId}/assignments/cases`, payload);
  } catch (error) {
    throwApiError(error);
  }
}

export async function assignQuizToLecturerClass(
  classId: string,
  payload: AssignQuizPayload,
): Promise<void> {
  try {
    await http.post(`/api/lecturer/classes/${classId}/assignments/quizzes`, payload);
  } catch (error) {
    throwApiError(error);
  }
}

export async function fetchAssignedCases(classId: string): Promise<CaseDto[]> {
  try {
    const { data } = await http.get<CaseDto[]>(`/api/lecturer/classes/${classId}/cases`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throwApiError(error);
  }
}

export async function fetchAssignedQuizzes(classId: string): Promise<QuizDto[]> {
  try {
    const { data } = await http.get<QuizDto[]>(`/api/lecturer/classes/${classId}/quizzes`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throwApiError(error);
  }
}

export async function fetchLecturerCaseLibrary(): Promise<CaseDto[]> {
  try {
    const { data } = await http.get<CaseDto[]>('/api/lecturer/cases');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throwApiError(error);
  }
}

export async function fetchLecturerQuizLibrary(): Promise<QuizDto[]> {
  try {
    const { data } = await http.get<QuizDto[]>('/api/lecturer/quizzes');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throwApiError(error);
  }
}
