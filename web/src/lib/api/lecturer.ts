import { http, getApiErrorMessage } from './client';
import type {
  Announcement,
  CaseDto,
  ClassItem,
  ClassStats,
  StudentEnrollment,
} from './types';

export async function createClass(body: {
  className: string;
  semester: string;
  lecturerId: string;
}): Promise<ClassItem> {
  try {
    const { data } = await http.post<ClassItem>('/api/Lecturers/classes', body);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getLecturerClasses(lecturerId: string): Promise<ClassItem[]> {
  try {
    const { data } = await http.get<ClassItem[]>('/api/Lecturers/classes', {
      params: { lecturerId },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassStudents(classId: string): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.get<StudentEnrollment[]>(`/api/Lecturers/classes/${classId}/students`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getAvailableStudents(classId: string): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.get<StudentEnrollment[]>(
      `/api/Lecturers/classes/${classId}/students/available`,
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function enrollStudent(classId: string, studentId: string): Promise<void> {
  try {
    await http.post(`/api/Lecturers/classes/${classId}/enroll`, { studentId });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function removeStudent(classId: string, studentId: string): Promise<void> {
  try {
    await http.delete(`/api/Lecturers/classes/${classId}/students/${studentId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getLecturerCases(): Promise<CaseDto[]> {
  try {
    const { data } = await http.get<CaseDto[]>('/api/Lecturers/cases');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function assignCasesToClass(
  classId: string,
  payload: { caseIds: string[]; dueDate?: string; isMandatory: boolean },
): Promise<CaseDto[]> {
  try {
    const { data } = await http.post<CaseDto[]>(
      `/api/lecturer/classes/${classId}/assignments/cases`,
      {
      caseIds: payload.caseIds,
      dueDate: payload.dueDate,
      isMandatory: payload.isMandatory,
      },
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function assignQuizToClass(
  classId: string,
  payload: {
    quizId: string;
    openTime?: string;
    closeTime?: string;
    timeLimitMinutes?: number;
    passingScore?: number;
  },
): Promise<void> {
  try {
    await http.post(`/api/lecturer/classes/${classId}/assignments/quizzes`, {
      quizId: payload.quizId,
      openTime: payload.openTime,
      closeTime: payload.closeTime,
      timeLimitMinutes: payload.timeLimitMinutes,
      passingScore: payload.passingScore,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function approveCase(caseId: string, isApproved: boolean): Promise<void> {
  try {
    await http.put(`/api/Lecturers/cases/${caseId}/approve`, { isApproved });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassAnnouncements(classId: string): Promise<Announcement[]> {
  try {
    const { data } = await http.get<Announcement[]>(`/api/Lecturers/classes/${classId}/announcements`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createAnnouncement(
  classId: string,
  body: { title: string; content: string },
): Promise<Announcement> {
  try {
    const { data } = await http.post<Announcement | ''>(
      `/api/Lecturers/classes/${classId}/announcements`,
      body,
    );
    if (!data || typeof data === 'string') {
      return {
        id: '',
        classId,
        className: '',
        title: body.title,
        content: body.content,
        createdAt: new Date().toISOString(),
      };
    }
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassStats(classId: string): Promise<ClassStats> {
  try {
    const { data } = await http.get<ClassStats>(`/api/Lecturers/classes/${classId}/stats`);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
