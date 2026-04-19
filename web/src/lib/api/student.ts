import { http, getApiErrorMessage } from './client';
import type {
  AssignedQuizItem,
  QuizSessionDto,
  StudentAnnouncement,
  StudentCaseCatalogItem,
  StudentCaseCatalogDetail,
  StudentCaseHistoryItem,
  StudentHistoryKind,
  StudentPracticeQuiz,
  StudentProfile,
  StudentProfileUpdatePayload,
  StudentProgress,
  StudentQuizAnswer,
  StudentQuizSubmissionResult,
  StudentQuizResultDto,
  StudentRecentActivityItem,
  StudentSessionQuestion,
  StudentSubmitQuestionDto,
  StudentTopicStat,
} from './types';

function normalizeDifficulty(raw: unknown): StudentCaseHistoryItem['difficulty'] {
  const value = String(raw ?? '').toLowerCase();
  if (value === 'advanced') return 'advanced';
  if (value === 'intermediate') return 'intermediate';
  return 'basic';
}

/**
 * Classify history rows for the two student tabs. Prefer explicit API fields; fall back to light heuristics.
 */
function inferHistoryKind(item: Record<string, unknown>): StudentHistoryKind {
  const explicit =
    item.historyKind ??
    item.historyType ??
    item.interactionSource ??
    item.source ??
    item.origin ??
    item.caseSource;
  if (typeof explicit === 'string') {
    const e = explicit.toLowerCase();
    if (
      e.includes('catalog') ||
      e.includes('library') ||
      e.includes('expert') ||
      e.includes('published') ||
      e.includes('case_study') ||
      e === 'casestudy'
    ) {
      return 'caseStudy';
    }
    if (
      e.includes('upload') ||
      e.includes('custom') ||
      e.includes('personal') ||
      e.includes('student_image') ||
      e.includes('visualqa')
    ) {
      return 'personalQa';
    }
  }
  if (item.fromCatalog === true || item.isFromCatalog === true) return 'caseStudy';
  if (item.isCustomUpload === true || item.isUpload === true || item.hasCustomImage === true) {
    return 'personalQa';
  }
  const catalogId = item.catalogCaseId ?? item.publishedCaseId ?? item.caseCatalogId;
  if (catalogId != null && String(catalogId).trim()) return 'caseStudy';

  const thumb = String(item.thumbnailUrl ?? item.imageUrl ?? '').toLowerCase();
  if (
    thumb.includes('customimage') ||
    thumb.includes('student-visual') ||
    thumb.includes('/uploads/students/') ||
    thumb.includes('user-upload')
  ) {
    return 'personalQa';
  }

  return 'caseStudy';
}

function mapStudentCase(row: unknown): StudentCaseHistoryItem | null {
  if (!row || typeof row !== 'object') return null;
  const item = row as Record<string, unknown>;
  const id = String(item.id ?? item.caseId ?? item.answerId ?? '');
  if (!id) return null;

  const historyKind = inferHistoryKind(item);
  const catalogRaw = item.catalogCaseId ?? item.publishedCaseId ?? item.caseCatalogId ?? item.libraryCaseId;
  const catalogCaseId =
    catalogRaw != null && String(catalogRaw).trim() ? String(catalogRaw).trim() : null;

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
    keyImagingFindings:
      item.keyImagingFindings != null && item.keyImagingFindings !== ''
        ? String(item.keyImagingFindings)
        : null,
    reflectiveQuestions:
      item.reflectiveQuestions != null && item.reflectiveQuestions !== ''
        ? String(item.reflectiveQuestions)
        : null,
    historyKind,
    catalogCaseId,
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

function mapStudentCaseCatalogDetail(row: unknown): StudentCaseCatalogDetail | null {
  if (!row || typeof row !== 'object') return null;
  const base = mapStudentCaseCatalog(row);
  if (!base) return null;
  const item = row as Record<string, unknown>;

  // 获取 CategoryName 作为基础
  const categoryName = item.categoryName != null ? String(item.categoryName) : '';

  return {
    ...base,
    // imageUrl: 优先使用 base 已有的 imageUrl (来自 imageUrl/thumbnailUrl)，否则使用 PrimaryImageUrl
    imageUrl: base.imageUrl ?? (item.primaryImageUrl != null ? String(item.primaryImageUrl) : undefined),
    // location: 从 CategoryName 或从 base 继承
    location: categoryName || base.location,
    // lesionType: 由于后端没有明确的 lesionType，使用 CategoryName 或默认值
    lesionType: categoryName || base.lesionType,
    description: item.description != null ? String(item.description) : undefined,
    expertSummary:
      item.expertSummary != null
        ? String(item.expertSummary)
        : item.summary != null
          ? String(item.summary)
          : undefined,
    keyFindings: Array.isArray(item.keyFindings)
      ? (item.keyFindings as unknown[]).map((f) => String(f ?? '').trim()).filter((s) => s.length > 0)
      : typeof item.keyFindings === 'string' && item.keyFindings
        ? item.keyFindings.split(/[\n,;]/).map((s) => s.trim()).filter((s) => s.length > 0)
        : [],
    approvedAt:
      item.approvedAt != null
        ? String(item.approvedAt)
        : item.updatedAt != null
          ? String(item.updatedAt)
          : undefined,
  };
}

export async function fetchStudentProfile(): Promise<StudentProfile> {
  try {
    // BE: UsersController — GET /api/users/me (không dùng /api/student/profile)
    const { data } = await http.get<StudentProfile>('/api/users/me');
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

  // Normalize related assignment
  const relRaw = r.relatedAssignment ?? r.RelatedAssignment;
  let relatedAssignment: AnnouncementAssignmentInfo | undefined = undefined;
  if (relRaw && typeof relRaw === 'object') {
    const rel = relRaw as Record<string, unknown>;
    relatedAssignment = {
      assignmentId: rel.assignmentId != null ? String(rel.assignmentId) : undefined,
      assignmentTitle: rel.assignmentTitle != null ? String(rel.assignmentTitle) : undefined,
      assignmentType: rel.assignmentType != null ? String(rel.assignmentType) : undefined,
    };
  }

  return {
    id,
    classId: String(r.classId ?? r.ClassId ?? ''),
    className: r.className != null ? String(r.className) : null,
    title: String(r.title ?? r.Title ?? ''),
    content: String(r.content ?? r.Content ?? ''),
    createdAt: r.createdAt != null ? String(r.createdAt) : null,
    relatedAssignment,
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
    const { data } = await http.put<StudentProfile>('/api/users/me', payload);
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

function asOptionalNumber(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function mapQuizListItem(item: Record<string, unknown>): AssignedQuizItem {
  const totalQ =
    asOptionalNumber(item.totalQuestions) ??
    asOptionalNumber(item.TotalQuestions) ??
    0;
  const timeLimit =
    asOptionalNumber(item.timeLimit) ??
    asOptionalNumber(item.TimeLimit) ??
    asOptionalNumber(item.timeLimitMinutes) ??
    asOptionalNumber(item.TimeLimitMinutes);
  const passing =
    asOptionalNumber(item.passingScore) ?? asOptionalNumber(item.PassingScore);
  return {
    quizId: String(item.quizId ?? item.QuizId ?? ''),
    quizName: String(item.title ?? item.Title ?? item.quizName ?? 'Untitled quiz'),
    classId: String(item.classId ?? item.ClassId ?? ''),
    className: String(item.className ?? item.ClassName ?? ''),
    topic: item.topic != null ? String(item.topic) : item.Topic != null ? String(item.Topic) : null,
    totalQuestions: totalQ,
    timeLimit,
    passingScore: passing,
    openTime: item.openTime != null ? String(item.openTime) : null,
    closeTime: item.closeTime != null ? String(item.closeTime) : null,
    isCompleted: Boolean(item.isCompleted ?? item.IsCompleted ?? false),
    score: typeof item.score === 'number' ? item.score : null,
    attemptId: item.attemptId != null ? String(item.attemptId) : item.AttemptId != null ? String(item.AttemptId) : null,
    createdAt: item.createdAt != null ? String(item.createdAt) : item.CreatedAt != null ? String(item.CreatedAt) : null,
  };
}

function pickStr(r: Record<string, unknown>, camel: string, pascal: string): string | null {
  const v = r[camel] ?? r[pascal];
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Đọc chuỗi từ nhiều kiểu tên thuộc tính (camelCase, PascalCase, snake_case). */
function pickStrAny(r: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s.length) return s;
  }
  return null;
}

function normalizeStudentSessionQuestion(row: unknown): StudentSessionQuestion {
  const q = row as Record<string, unknown>;
  return {
    questionId: String(pickStrAny(q, 'questionId', 'QuestionId', 'question_id') ?? ''),
    questionText: String(
      pickStrAny(q, 'questionText', 'QuestionText', 'question_text') ?? '',
    ),
    type: pickStrAny(q, 'type', 'Type'),
    caseId: pickStrAny(q, 'caseId', 'CaseId', 'case_id'),
    caseTitle: pickStrAny(q, 'caseTitle', 'CaseTitle', 'case_title'),
    optionA: pickStrAny(q, 'optionA', 'OptionA', 'option_a'),
    optionB: pickStrAny(q, 'optionB', 'OptionB', 'option_b'),
    optionC: pickStrAny(q, 'optionC', 'OptionC', 'option_c'),
    optionD: pickStrAny(q, 'optionD', 'OptionD', 'option_d'),
    imageUrl: pickStrAny(q, 'imageUrl', 'ImageUrl', 'image_url'),
  };
}

function normalizeQuizSessionPayload(raw: unknown): QuizSessionDto {
  const o = raw as Record<string, unknown>;
  const rawQs = o.questions ?? o.Questions;
  const list = Array.isArray(rawQs) ? rawQs : [];
  const rawTl = o.timeLimit ?? o.TimeLimit;
  let timeLimit: number | null = null;
  if (rawTl != null && rawTl !== '') {
    const n = typeof rawTl === 'number' ? rawTl : Number(rawTl);
    if (Number.isFinite(n) && n > 0) timeLimit = Math.round(n);
  }
  // Handle closeTime from BE
  const closeTime = o.closeTime ?? o.CloseTime;
  const closeTimeStr = typeof closeTime === 'string' ? closeTime : (closeTime instanceof Date ? closeTime.toISOString() : null);
  return {
    attemptId: String(o.attemptId ?? o.AttemptId ?? ''),
    quizId: String(o.quizId ?? o.QuizId ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    topic: pickStr(o, 'topic', 'Topic'),
    timeLimit,
    closeTime: closeTimeStr,
    questions: list.map(normalizeStudentSessionQuestion),
  };
}

/**
 * Start a quiz session: POST /api/student/quizzes/{quizId}/start
 * Returns questions so the student can begin answering.
 */
export async function startQuizSession(quizId: string): Promise<QuizSessionDto> {
  try {
    const { data } = await http.post<unknown>(`/api/student/quizzes/${quizId}/start`);
    return normalizeQuizSessionPayload(data);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

/**
 * Student requests retake: POST /api/student/quizzes/{quizId}/request-retake
 * Sends notification + email to the lecturer.
 */
export async function requestRetake(quizId: string): Promise<{ message: string }> {
  try {
    const { data } = await http.post<unknown>(`/api/student/quizzes/${quizId}/request-retake`);
    const o = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
    return { message: String(o.message ?? 'Request sent.') };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function mapSubmitQuizResult(raw: unknown): StudentQuizResultDto {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const scoreRaw = r.score ?? r.Score;
  const passingRaw = r.passingScore ?? r.PassingScore;
  return {
    attemptId: String(r.attemptId ?? r.AttemptId ?? ''),
    quizId: String(r.quizId ?? r.QuizId ?? ''),
    score: scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : null,
    passingScore: passingRaw != null && passingRaw !== '' ? Number(passingRaw) : null,
    passed: Boolean(r.passed ?? r.Passed ?? false),
    totalQuestions: Number(r.totalQuestions ?? r.TotalQuestions ?? 0),
    correctAnswers: Number(r.correctAnswers ?? r.CorrectAnswers ?? 0),
    ungradedEssayCount: r.ungradedEssayCount != null ? Number(r.ungradedEssayCount) : r.UngradedEssayCount != null ? Number(r.UngradedEssayCount) : null,
  };
}

/**
 * Submit all quiz answers.
 */
export async function submitQuizSession(
  attemptId: string,
  answers: StudentSubmitQuestionDto[],
): Promise<StudentQuizResultDto> {
  try {
    const { data } = await http.post<unknown>('/api/student/quizzes/submit', {
      attemptId,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        studentAnswer: a.studentAnswer,
        essayAnswer: a.essayAnswer ?? undefined,
      })),
    });
    return mapSubmitQuizResult(data);
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

/**
 * Optional dedicated upload / custom Visual QA timeline (when backend exposes it).
 * Swallows errors so the UI still works with only `/api/student/cases/history`.
 */
export async function fetchStudentUploadQaHistory(): Promise<StudentCaseHistoryItem[]> {
  try {
    const { data } = await http.get<unknown>('/api/student/visual-qa/history');
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'items' in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
    return list
      .map(mapStudentCase)
      .filter((item): item is StudentCaseHistoryItem => item !== null)
      .map((item) => ({ ...item, historyKind: 'personalQa' as const }));
  } catch {
    return [];
  }
}

/** Merges catalog/case history with optional upload-only feed for the student history UI. */
export async function fetchStudentHistoryForUi(): Promise<StudentCaseHistoryItem[]> {
  const [catalogRows, uploadRows] = await Promise.all([fetchStudentCases(), fetchStudentUploadQaHistory()]);
  if (uploadRows.length === 0) return catalogRows;
  const seen = new Set(catalogRows.map((r) => r.id));
  const merged = [...catalogRows];
  for (const row of uploadRows) {
    if (!seen.has(row.id)) {
      merged.push(row);
      seen.add(row.id);
    }
  }
  return merged;
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

export async function fetchCaseCatalogDetail(caseId: string): Promise<StudentCaseCatalogDetail> {
  try {
    const { data } = await http.get<unknown>(`/api/student/cases/${caseId}`);
    const mapped = mapStudentCaseCatalogDetail(data);
    if (!mapped) {
      throw new Error('Case detail is unavailable.');
    }
    return mapped;
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

  const targetRaw = item.targetUrl ?? item.route ?? item.href ?? item.url ?? item.deepLink;
  const targetUrl =
    targetRaw != null && String(targetRaw).trim() ? String(targetRaw).trim() : undefined;
  const caseRaw = item.caseId ?? item.catalogCaseId ?? item.libraryCaseId;
  const caseId = caseRaw != null && String(caseRaw).trim() ? String(caseRaw).trim() : undefined;
  const quizRaw = item.quizId ?? item.assignedQuizId;
  const quizId = quizRaw != null && String(quizRaw).trim() ? String(quizRaw).trim() : undefined;

  return {
    id: String(item.id ?? item.activityId ?? index),
    title,
    description: item.description != null ? String(item.description) : item.message != null ? String(item.message) : undefined,
    occurredAt,
    type: String(item.type ?? item.activityType ?? 'activity'),
    status: item.status != null ? String(item.status) : undefined,
    targetUrl,
    caseId,
    quizId,
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
    caseTitle?: string | null;
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
    essayAnswer?: string | null; // Model answer for essay questions
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
        optionA: pickStr(q, 'optionA', 'OptionA'),
        optionB: pickStr(q, 'optionB', 'OptionB'),
        optionC: pickStr(q, 'optionC', 'OptionC'),
        optionD: pickStr(q, 'optionD', 'OptionD'),
        studentAnswer: pickStr(q, 'studentAnswer', 'StudentAnswer'),
        correctAnswer: pickStr(q, 'correctAnswer', 'CorrectAnswer'),
        isCorrect: Boolean(q.isCorrect ?? q.IsCorrect ?? false),
        imageUrl: pickStr(q, 'imageUrl', 'ImageUrl'),
        caseId: pickStr(q, 'caseId', 'CaseId'),
        essayAnswer: pickStr(q, 'essayAnswer', 'EssayAnswer'),
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

/** ====== Class Detail ====== */

export interface StudentClassDetail {
  classId: string;
  className: string;
  semester: string;
  lecturerId?: string | null;
  lecturerName?: string | null;
  /** Clinical expert attached to this cohort when returned by the API. */
  expertName?: string | null;
  expertEmail?: string | null;
  expertAvatarUrl?: string | null;
  enrolledAt?: string | null;
  /** Case assignments for this class (optional; depends on backend). */
  assignedCases?: Array<{
    caseId: string;
    title: string;
    dueDate?: string | null;
    isMandatory?: boolean;
  }>;
  quizzes: Array<{
    quizId: string;
    title: string;
    topic?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    totalQuestions: number;
    timeLimit?: number | null;
    passingScore?: number | null;
    isCompleted: boolean;
    score?: number | null;
  }>;
  students: Array<{
    studentId: string;
    studentName: string;
    studentCode?: string | null;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt?: string | null;
    relatedAssignment?: AnnouncementAssignmentInfo | null;
  }>;
}

export async function fetchStudentClassDetail(classId: string): Promise<StudentClassDetail> {
  try {
    const { data } = await http.get<unknown>(`/api/students/classes/${classId}`);
    const item = data as Record<string, unknown>;
    const expertRaw = item.expert ?? item.Expert;
    const expertObj =
      expertRaw && typeof expertRaw === 'object' ? (expertRaw as Record<string, unknown>) : null;
    const expertAvatarFromNested = expertObj
      ? pickStrAny(
          expertObj,
          'avatarUrl',
          'AvatarUrl',
          'photoUrl',
          'PhotoUrl',
          'imageUrl',
          'ImageUrl',
          'profileImageUrl',
          'ProfileImageUrl',
        )
      : null;
    const quizRows = item.quizzes ?? item.Quizzes;
    const studentRows = item.students ?? item.Students;
    const announcementRows = item.announcements ?? item.Announcements;
    const caseRows = item.assignedCases ?? item.AssignedCases ?? item.cases ?? item.Cases;
    const quizzes = Array.isArray(quizRows) ? (quizRows as Record<string, unknown>[]) : [];
    const students = Array.isArray(studentRows) ? (studentRows as Record<string, unknown>[]) : [];
    const announcements = Array.isArray(announcementRows) ? (announcementRows as Record<string, unknown>[]) : [];
    const cases = Array.isArray(caseRows) ? (caseRows as Record<string, unknown>[]) : [];
    return {
      classId: String(item.classId ?? item.ClassId ?? classId),
      className: String(item.className ?? item.ClassName ?? ''),
      semester: String(item.semester ?? item.Semester ?? ''),
      lecturerId: item.lecturerId != null ? String(item.lecturerId) : item.LecturerId != null ? String(item.LecturerId) : null,
      lecturerName: item.lecturerName != null ? String(item.lecturerName) : item.LecturerName != null ? String(item.LecturerName) : null,
      expertName:
        item.expertName != null
          ? String(item.expertName)
          : item.ExpertName != null
            ? String(item.ExpertName)
            : item.expertFullName != null
              ? String(item.expertFullName)
              : null,
      expertEmail:
        item.expertEmail != null
          ? String(item.expertEmail)
          : item.ExpertEmail != null
            ? String(item.ExpertEmail)
            : null,
      expertAvatarUrl:
        expertAvatarFromNested ??
        pickStrAny(item, 'expertAvatarUrl', 'ExpertAvatarUrl', 'expertPhotoUrl', 'ExpertPhotoUrl'),
      enrolledAt: item.enrolledAt != null ? String(item.enrolledAt) : item.EnrolledAt != null ? String(item.EnrolledAt) : null,
      assignedCases: cases.map((c) => ({
        caseId: String(c.caseId ?? c.CaseId ?? c.id ?? c.Id ?? ''),
        title: String(c.title ?? c.Title ?? c.caseTitle ?? c.CaseTitle ?? 'Case'),
        dueDate: c.dueDate != null ? String(c.dueDate) : c.DueDate != null ? String(c.DueDate) : null,
        isMandatory: Boolean(c.isMandatory ?? c.IsMandatory ?? false),
      })),
      quizzes: quizzes.map((q) => ({
        quizId: String(q.quizId ?? q.QuizId ?? ''),
        title: String(q.title ?? q.Title ?? ''),
        topic: q.topic != null ? String(q.topic) : q.Topic != null ? String(q.Topic) : null,
        openTime: q.openTime != null ? String(q.openTime) : q.OpenTime != null ? String(q.OpenTime) : null,
        closeTime: q.closeTime != null ? String(q.closeTime) : q.CloseTime != null ? String(q.CloseTime) : null,
        totalQuestions: Number(q.totalQuestions ?? q.TotalQuestions ?? 0),
        timeLimit: q.timeLimit != null ? Number(q.timeLimit) : q.TimeLimit != null ? Number(q.TimeLimit) : null,
        passingScore: q.passingScore != null ? Number(q.passingScore) : q.PassingScore != null ? Number(q.PassingScore) : null,
        isCompleted: Boolean(q.isCompleted ?? q.IsCompleted ?? false),
        score: q.score != null ? Number(q.score) : q.Score != null ? Number(q.Score) : null,
      })),
      students: students.map((s) => ({
        studentId: String(s.studentId ?? s.StudentId ?? ''),
        studentName: String(s.studentName ?? s.StudentName ?? ''),
        studentCode: s.studentCode != null ? String(s.studentCode) : s.StudentCode != null ? String(s.StudentCode) : null,
      })),
      announcements: announcements.map((a) => ({
        id: String(a.id ?? a.Id ?? ''),
        title: String(a.title ?? a.Title ?? ''),
        content: String(a.content ?? a.Content ?? ''),
        createdAt: a.createdAt != null ? String(a.createdAt) : a.CreatedAt != null ? String(a.CreatedAt) : null,
        relatedAssignment: (() => {
          const rel = a.relatedAssignment ?? a.RelatedAssignment;
          if (rel && typeof rel === 'object') {
            const r = rel as Record<string, unknown>;
            return {
              assignmentId: r.assignmentId != null ? String(r.assignmentId) : r.AssignmentId != null ? String(r.AssignmentId) : undefined,
              assignmentTitle: r.assignmentTitle != null ? String(r.assignmentTitle) : r.AssignmentTitle != null ? String(r.AssignmentTitle) : undefined,
              assignmentType: r.assignmentType != null ? String(r.assignmentType) : r.AssignmentType != null ? String(r.AssignmentType) : undefined,
            };
          }
          return null;
        })(),
      })),
    };
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
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

/** Student self-unenrolls from a class (DELETE enrollment). */
export async function leaveStudentClass(classId: string): Promise<void> {
  try {
    await http.delete(`/api/students/classes/${classId}`);
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
 * Delete a quiz attempt from history.
 * DELETE /api/student/quizzes/{attemptId}
 */
export async function deleteQuizAttempt(attemptId: string): Promise<void> {
  try {
    await http.delete(`/api/student/quizzes/${attemptId}`);
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
