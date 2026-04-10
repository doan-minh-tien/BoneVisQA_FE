import { http, getApiErrorMessage } from './client';
import type {
  Announcement,
  ClassAssignment,
  CaseDto,
  ClassItem,
  ClassStats,
  StudentEnrollment,
  ImportStudentsSummary,
  LectStudentQuestionDto,
  UpdateClassRequest,
  ClassStudentProgress,
  StudentQuizAttemptDto,
  QuizAttemptDetailDto,
  UpdateQuizAttemptRequestDto,
  ExpertOption,
} from './types';

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chuẩn hóa JSON từ BE (camelCase hoặc PascalCase) + gắn classId khi thiếu. */
export function normalizeAnnouncement(row: unknown, fallbackClassId: string): Announcement {
  const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
  const id = String(r.id ?? r.Id ?? '').trim();
  const classId = String(r.classId ?? r.ClassId ?? fallbackClassId).trim() || fallbackClassId;
  return {
    id,
    classId,
    className: String(r.className ?? r.ClassName ?? '') || '',
    title: String(r.title ?? r.Title ?? '') || '',
    content: String(r.content ?? r.Content ?? '') || '',
    sendEmail: Boolean(r.sendEmail ?? r.SendEmail ?? true),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? new Date().toISOString()),
  };
}

function assertValidGuid(label: string, value: string) {
  const v = String(value ?? '').trim();
  if (!v || !GUID_RE.test(v)) {
    throw new Error(`${label} is missing or not a valid id. Refresh the page and try again.`);
  }
  return v;
}

/** Dùng để lọc bản ghi không đủ id trước khi gọi API update/delete. */
export function isValidGuidString(value: string | undefined | null): boolean {
  return GUID_RE.test(String(value ?? '').trim());
}

/** Normalize a single assignment row from BE (camelCase or PascalCase). */
function normalizeAssignment(row: unknown): ClassAssignment | null {
  const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
  const id = String(r.id ?? r.Id ?? '').trim();
  if (!id || !GUID_RE.test(id)) return null;
  return {
    id,
    classId: String(r.classId ?? r.ClassId ?? '') || '',
    className: String(r.className ?? r.ClassName ?? '') || '',
    type: String(r.type ?? r.Type ?? '') || '',
    title: String(r.title ?? r.Title ?? '') || '',
    dueDate: (r.dueDate ?? r.DueDate ?? null) as string | null,
    isMandatory: Boolean(r.isMandatory ?? r.IsMandatory ?? false),
    assignedAt: (r.assignedAt ?? r.AssignedAt ?? null) as string | null,
    totalStudents: Number(r.totalStudents ?? r.TotalStudents ?? 0) || 0,
    submittedCount: Number(r.submittedCount ?? r.SubmittedCount ?? 0) || 0,
    gradedCount: Number(r.gradedCount ?? r.GradedCount ?? 0) || 0,
  };
}

export async function createClass(body: {
  className: string;
  semester: string;
  lecturerId: string;
}): Promise<ClassItem> {
  try {
    const { data } = await http.post<ClassItem>('/api/lecturer/classes', body);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getLecturerClasses(lecturerId: string): Promise<ClassItem[]> {
  try {
    const { data } = await http.get<ClassItem[]>('/api/lecturer/classes', {
      params: { lecturerId },
    });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassStudents(classId: string): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.get<StudentEnrollment[]>(`/api/lecturer/classes/${classId}/students`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getAvailableStudents(classId: string): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.get<StudentEnrollment[]>(
      `/api/lecturer/classes/${classId}/students/available`,
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function enrollStudent(classId: string, studentId: string): Promise<void> {
  try {
    await http.post(`/api/lecturer/classes/${classId}/enroll`, { studentId });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function removeStudent(classId: string, studentId: string): Promise<void> {
  try {
    await http.delete(`/api/lecturer/classes/${classId}/students/${studentId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getLecturerCases(): Promise<CaseDto[]> {
  try {
    const { data } = await http.get<CaseDto[]>('/api/lecturer/cases');
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
    shuffleQuestions?: boolean;
    allowRetake?: boolean;
  },
): Promise<void> {
  try {
    await http.post(`/api/lecturer/classes/${classId}/assignments/quizzes`, {
      quizId: payload.quizId,
      openTime: payload.openTime,
      closeTime: payload.closeTime,
      timeLimitMinutes: payload.timeLimitMinutes,
      passingScore: payload.passingScore,
      shuffleQuestions: payload.shuffleQuestions,
      allowRetake: payload.allowRetake,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** Lấy danh sách Expert để gán vào lớp học. */
export async function getExperts(): Promise<ExpertOption[]> {
  try {
    const { data } = await http.get<ExpertOption[]>('/api/lecturer/experts');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/** Gán (hoặc gỡ) Expert khỏi một lớp học. expertId = null → gỡ expert. */
export async function assignExpertToClass(classId: string, expertId: string | null): Promise<void> {
  try {
    await http.put(`/api/lecturer/classes/${classId}/expert`, { expertId });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function approveCase(caseId: string, isApproved: boolean): Promise<void> {
  try {
    await http.put(`/api/lecturer/cases/${caseId}/approve`, { isApproved });
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassAnnouncements(classId: string): Promise<Announcement[]> {
  try {
    const { data } = await http.get<unknown[]>(`/api/lecturer/classes/${classId}/announcements`);
    const list = Array.isArray(data) ? data : [];
    return list.map((row) => normalizeAnnouncement(row, classId));
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createAnnouncement(
  classId: string,
  body: { title: string; content: string; sendEmail: boolean },
): Promise<Announcement> {
  try {
    const { data } = await http.post<Announcement | ''>(
      `/api/lecturer/classes/${classId}/announcements`,
      body,
    );
    if (!data || typeof data === 'string') {
      return {
        id: '',
        classId,
        className: '',
        title: body.title,
        content: body.content,
        sendEmail: body.sendEmail,
        createdAt: new Date().toISOString(),
      };
    }
    return normalizeAnnouncement(data, classId);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateAnnouncement(
  classId: string,
  announcementId: string,
  body: { title: string; content: string; sendEmail: boolean },
): Promise<Announcement> {
  const cId = assertValidGuid('Class', classId);
  const aId = assertValidGuid('Announcement', announcementId);
  try {
    const { data } = await http.put<unknown>(
      `/api/lecturer/classes/${encodeURIComponent(cId)}/announcements/${encodeURIComponent(aId)}`,
      body,
    );
    return normalizeAnnouncement(data, cId);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function deleteAnnouncement(classId: string, announcementId: string): Promise<void> {
  const cId = assertValidGuid('Class', classId);
  const aId = assertValidGuid('Announcement', announcementId);
  try {
    await http.delete(
      `/api/lecturer/classes/${encodeURIComponent(cId)}/announcements/${encodeURIComponent(aId)}`,
    );
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassAssignments(classId: string): Promise<ClassAssignment[]> {
  try {
    const { data } = await http.get<unknown[]>(
      `/api/lecturer/classes/${encodeURIComponent(classId)}/assignments`,
    );
    const list = Array.isArray(data) ? data : [];
    return list
      .map(normalizeAssignment)
      .filter((a): a is ClassAssignment => a !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getAllLecturerAssignments(lecturerId: string): Promise<ClassAssignment[]> {
  const lid = assertValidGuid('Lecturer', lecturerId);
  try {
    const { data } = await http.get<unknown[]>(
      `/api/lecturer/assignments?lecturerId=${encodeURIComponent(lid)}`,
    );
    const list = Array.isArray(data) ? data : [];
    return list
      .map(normalizeAssignment)
      .filter((a): a is ClassAssignment => a !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getClassStats(classId: string): Promise<ClassStats> {
  try {
    const { data } = await http.get<ClassStats>(`/api/lecturer/classes/${classId}/stats`);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Pulls the answer row GUID for POST /api/lecturer/triage/{answerId}/escalate from flat or nested payloads.
 */
function extractAnswerIdFromQuestionRow(r: Record<string, unknown>): string | null {
  const direct =
    r.answerId ??
    r.AnswerId ??
    r.answer_id ??
    r.latestAnswerId ??
    r.LatestAnswerId ??
    r.answerGuid ??
    r.AnswerGuid;
  if (direct != null && String(direct).trim() !== '') return String(direct).trim();

  const nested =
    r.answer ??
    r.Answer ??
    r.answerDto ??
    r.AnswerDto ??
    r.latestAnswer ??
    r.LatestAnswer;
  if (nested && typeof nested === 'object') {
    const a = nested as Record<string, unknown>;
    const id = a.id ?? a.Id ?? a.answerId ?? a.AnswerId ?? a.guid ?? a.Guid;
    if (id != null && String(id).trim() !== '') return String(id).trim();
  }

  return null;
}

/**
 * Maps GET /api/lecturer/classes/{classId}/questions rows to camelCase and ensures
 * `answerId` is populated when the backend sends PascalCase or alternate keys.
 * Escalation uses POST /api/lecturer/triage/{answerId}/escalate — the route id must be the answer GUID, not the question id.
 */
function normalizeLectStudentQuestionDto(raw: unknown): LectStudentQuestionDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const questionId = String(
    r.questionId ?? r.QuestionId ?? r.id ?? r.Id ?? '',
  ).trim();
  if (!questionId) return null;

  const answerId = extractAnswerIdFromQuestionRow(r);

  const scoreRaw = r.aiConfidenceScore ?? r.AiConfidenceScore ?? r.similarityScore ?? r.SimilarityScore;
  let aiConfidenceScore: number | null = null;
  if (typeof scoreRaw === 'number' && !Number.isNaN(scoreRaw)) {
    aiConfidenceScore = scoreRaw > 1 ? Math.min(1, scoreRaw / 100) : scoreRaw;
  } else if (typeof scoreRaw === 'string' && scoreRaw.trim() !== '') {
    const n = parseFloat(scoreRaw);
    if (!Number.isNaN(n)) aiConfidenceScore = n > 1 ? Math.min(1, n / 100) : n;
  }

  return {
    id: questionId,
    answerId,
    studentId: String(r.studentId ?? r.StudentId ?? ''),
    studentName: String(r.studentName ?? r.StudentName ?? ''),
    studentEmail: String(r.studentEmail ?? r.StudentEmail ?? ''),
    caseId: String(r.caseId ?? r.CaseId ?? ''),
    caseTitle: String(r.caseTitle ?? r.CaseTitle ?? ''),
    questionText: String(r.questionText ?? r.QuestionText ?? ''),
    language: r.language == null && r.Language == null ? null : String(r.language ?? r.Language ?? ''),
    createdAt: (r.createdAt ?? r.CreatedAt ?? null) as string | null,
    answerText: (r.answerText ?? r.AnswerText ?? null) as string | null,
    answerStatus: (r.answerStatus ?? r.AnswerStatus ?? null) as string | null,
    escalatedById: (r.escalatedById ?? r.EscalatedById ?? null) as string | null,
    escalatedAt: (r.escalatedAt ?? r.EscalatedAt ?? null) as string | null,
    aiConfidenceScore,
  };
}

/**
 * Get student questions for a class
 */
export async function getStudentQuestions(
  classId: string,
  options?: { caseId?: string; studentId?: string },
): Promise<LectStudentQuestionDto[]> {
  try {
    const { data } = await http.get<unknown[]>(
      `/api/lecturer/classes/${classId}/questions`,
      {
        params: {
          caseId: options?.caseId,
          studentId: options?.studentId,
        },
      },
    );
    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeLectStudentQuestionDto)
      .filter((row): row is LectStudentQuestionDto => row !== null);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Import students from Excel file
 */
export async function importStudentsFromExcel(
  classId: string,
  file: File,
): Promise<ImportStudentsSummary> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await http.post<ImportStudentsSummary>(
      `/api/lecturer/classes/${classId}/import-students`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Bulk enroll students from list
 */
export async function enrollManyStudents(
  classId: string,
  studentIds: string[],
): Promise<StudentEnrollment[]> {
  try {
    const { data } = await http.post<StudentEnrollment[]>(
      `/api/lecturer/classes/${classId}/enrollmany`,
      { studentIds },
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get a single class by ID
 */
export async function getClassById(classId: string): Promise<ClassItem> {
  try {
    const { data } = await http.get<ClassItem>(`/api/lecturer/classes/${classId}`);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Update class information
 */
export async function updateClass(
  classId: string,
  body: UpdateClassRequest,
): Promise<ClassItem> {
  try {
    const { data } = await http.put<ClassItem>(`/api/lecturer/classes/${classId}`, body);
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Delete a class
 */
export async function deleteClass(classId: string): Promise<void> {
  try {
    await http.delete(`/api/lecturer/classes/${classId}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Get learning progress for all students in a class
 */
export async function getClassStudentProgress(
  classId: string,
): Promise<ClassStudentProgress[]> {
  try {
    const { data } = await http.get<ClassStudentProgress[]>(
      `/api/lecturer/classes/${classId}/student-progress`,
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

// ── Quiz Review API ────────────────────────────────────────────────────────────

/**
 * Lấy danh sách bài quiz attempts của tất cả sinh viên trong lớp cho 1 quiz cụ thể.
 */
export async function getClassQuizAttempts(
  classId: string,
  quizId: string,
): Promise<StudentQuizAttemptDto[]> {
  try {
    const { data } = await http.get<StudentQuizAttemptDto[]>(
      `/api/lecturer/classes/${classId}/assignments/quizzes/${quizId}/attempts`,
    );
    return data ?? [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Lấy chi tiết bài làm của 1 sinh viên (câu hỏi + câu trả lời + điểm).
 */
export async function getQuizAttemptDetail(
  classId: string,
  quizId: string,
  attemptId: string,
): Promise<QuizAttemptDetailDto> {
  try {
    const { data } = await http.get<QuizAttemptDetailDto>(
      `/api/lecturer/classes/${classId}/assignments/quizzes/${quizId}/attempts/${attemptId}`,
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Cập nhật điểm / câu trả lời của 1 bài quiz (lecturer chỉnh sửa).
 */
export async function updateQuizAttempt(
  classId: string,
  quizId: string,
  attemptId: string,
  body: UpdateQuizAttemptRequestDto,
): Promise<QuizAttemptDetailDto> {
  try {
    const { data } = await http.put<QuizAttemptDetailDto>(
      `/api/lecturer/classes/${classId}/assignments/quizzes/${quizId}/attempts/${attemptId}`,
      body,
    );
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Cho phép một sinh viên làm lại quiz (reset attempt).
 */
export async function allowRetakeForAttempt(
  classId: string,
  quizId: string,
  attemptId: string,
): Promise<void> {
  try {
    await http.post(
      `/api/lecturer/classes/${classId}/assignments/quizzes/${quizId}/attempts/${attemptId}/retake`,
      {},
    );
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Cho phép TẤT CẢ sinh viên trong lớp đã nộp quiz được làm lại.
 */
export async function allowRetakeAll(classId: string, quizId: string): Promise<void> {
  try {
    await http.post(
      `/api/lecturer/classes/${classId}/assignments/quizzes/${quizId}/retake-all`,
      {},
    );
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
