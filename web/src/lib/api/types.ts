/** Normalized Visual QA report (accepts camelCase or PascalCase from backend). */
export interface VisualQaCitation {
  documentUrl?: string;
  chunkOrder?: number;
  pageNumber?: number;
  startPage?: number;
  endPage?: number;
  title?: string;
  label?: string;
  displayLabel?: string;
  snippet?: string;
  pageLabel?: string;
  kind?: 'doc' | 'case' | string;
  href?: string;
  /** Knowledge-base document id when API provides it (for markers & versioned links). */
  documentId?: string;
  /** Clinical case id when citation points at a case. */
  caseId?: string;
  /** Document revision — appended as `?v=` on file URLs when present. */
  version?: string;
}

export type VisualQaResponseKind =
  | 'analysis'
  | 'refusal'
  | 'clarification'
  | 'review_update'
  | 'system_notice'
  | string;

export type VisualQaReviewState =
  | 'none'
  | 'pending'
  | 'escalated'
  | 'reviewed'
  | 'resolved'
  | string;

export interface VisualQaReport {
  /** Echoed from the request when the API returns it. */
  questionText?: string;
  answerText?: string;
  suggestedDiagnosis?: string;
  keyFindings: string[];
  keyImagingFindings?: string | null;
  diagnosis?: string;
  findings?: string[];
  reflectiveQuestions?: string[] | string | null;
  differentialDiagnoses: string[];
  citations: VisualQaCitation[];
  /** Model confidence when provided by the backend (0–100). */
  aiConfidenceScore?: number;
  responseKind?: VisualQaResponseKind | null;
  clientRequestId?: string | null;
  policyReason?: string | null;
  systemNoticeCode?: string | null;
}

export interface VisualQaTurn {
  turnId?: string | null;
  turnIndex: number;
  questionText?: string;
  answerText?: string;
  messages?: VisualQaMessage[];
  /**
   * BE `VisualQaTurnDto.questionCoordinates` — user question ROI (normalized JSON).
   * FE merges into `roiBoundingBox` when the latter is absent so the viewer can reuse one field.
   */
  questionCoordinates?: NormalizedImageBoundingBox | null;
  /** Message-level ROI for this specific Q/A turn (normalized 0-1). */
  roiBoundingBox?: NormalizedImageBoundingBox | null;
  /** Assistant structured diagnosis (JSON string or plain text) from triage / thread DTOs. */
  structuredDiagnosis?: string | null;
  /** Assistant key imaging line (string or JSON) from triage DTOs. */
  keyImagingFindings?: string | null;
  diagnosis?: string;
  findings?: string[];
  reflectiveQuestions?: string[];
  differentialDiagnoses: string[];
  citations: VisualQaCitation[];
  aiConfidenceScore?: number;
  createdAt?: string | null;
  responseKind?: VisualQaResponseKind | null;
  clientRequestId?: string | null;
  userMessageId?: string | null;
  assistantMessageId?: string | null;
  reviewState?: VisualQaReviewState | null;
  lastResponderRole?: string | null;
  actorRole?: string | null;
  isReviewTarget?: boolean;
  policyReason?: string | null;
  systemNoticeCode?: string | null;
}

export interface VisualQaMessage {
  role: 'Student' | 'Assistant' | 'Lecturer' | string;
  content: string;
  createdAt?: string | null;
}

export interface VisualQaSessionReport {
  sessionId: string;
  /**
   * Root study image on thread (`VisualQaThreadDto`). BE may also send `imageUrl` / `studyImageUrl`
   * with the same value — FE normalizes into this field.
   */
  sessionImageUrl?: string | null;
  /**
   * Thread-level ROI: BE derives from latest user message with non-empty coordinates
   * (parallel to per-turn `questionCoordinates` / `roiBoundingBox` on turns).
   */
  roiBoundingBox?: NormalizedImageBoundingBox | null;
  clientRequestId?: string | null;
  responseKind?: VisualQaResponseKind | null;
  /** Root-level analysis text from the API when not only present on `latest` / `turns`. */
  answerText?: string | null;
  diagnosis?: string;
  findings?: string[];
  differentialDiagnoses?: string[];
  reflectiveQuestions?: string[];
  citations?: VisualQaCitation[];
  caseId?: string | null;
  imageId?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  reviewState?: VisualQaReviewState | null;
  lastResponderRole?: string | null;
  /** Thread-level banner when BE blocks interaction (VisualQaThreadDto). */
  blockingNotice?: string | null;
  systemNotice?: string | null;
  policyReason?: string | null;
  systemNoticeCode?: string | null;
  capabilities?: {
    canAskNext?: boolean;
    canRequestReview?: boolean;
    isReadOnly?: boolean;
    turnsUsed?: number;
    turnLimit?: number;
    reason?: string | null;
  };
  messages?: VisualQaMessage[];
  turns: VisualQaTurn[];
  latest: VisualQaTurn | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface TagOption {
  id: string;
  name: string;
}

export interface DocumentUploadResponse {
  documentId?: string;
  indexingStatus?: DocumentIndexingStatus | string;
  message?: string;
}

export type DocumentIndexingStatus =
  | 'Pending'
  | 'Processing'
  | 'Indexing'
  | 'Reindexing'
  | 'Completed'
  | 'Failed';

export interface DocumentStatusResponse {
  status: DocumentIndexingStatus | string;
  progressPercentage: number;
  currentOperation: string;
  /** 1-based page currently being indexed (when provided by pipeline). */
  currentPageIndexing?: number;
  totalPages?: number;
  /** Some pipelines report chunk totals instead of page totals. */
  totalChunks?: number;
}

/** Real-time ingestion update payload from SignalR `DocumentIndexingProgressUpdated`. */
export interface DocumentIngestionStatusDto {
  documentId: string;
  status?: string;
  totalPages?: number;
  totalChunks?: number;
  currentPageIndexing?: number;
  progressPercentage?: number;
  operation?: string;
}

export interface LecturerTriageRow {
  id: string;
  studentName: string;
  questionSnippet: string;
  thumbnailUrl: string;
  askedAt: string;
  similarityScore: number;
  escalated?: boolean;
  requestedReviewMessageId?: string | null;
  selectedUserMessageId?: string | null;
  selectedAssistantMessageId?: string | null;
  /** BE triage row: VisualQA vs CaseQA when present. */
  questionSource?: 'CaseQA' | 'VisualQA' | null;
  /** Short case snapshot for list (e.g. medical_cases.description). */
  caseDescription?: string | null;
  caseTitle?: string | null;
}

export interface ClassItem {
  id: string;
  className: string;
  semester: string;
  lecturerId: string;
  createdAt: string;
  expertId?: string | null;
  expertName?: string | null;
}

export interface StudentEnrollment {
  enrollmentId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  studentCode: string | null;
  className: string | null;
  enrolledAt: string | null;
}

export interface CaseDto {
  id: string;
  title: string | null;
  description: string | null;
  difficulty: string | null;
  categoryName: string | null;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string | null;
}

/** GET /api/lecturer/classes/{classId}/questions */
export interface LectStudentQuestionDto {
  id: string;
  /** Use for POST /api/lecturer/triage/{answerId}/escalate when distinct from question id. */
  answerId?: string | null;
  /** Alternate answer-row id from some API shapes (escalation fallback). */
  caseAnswerId?: string | null;
  /** Explicit study image URL when the API uses ImageUrl (see also customImageUrl). */
  imageUrl?: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  caseId: string;
  caseTitle: string;
  questionText: string;
  language?: string | null;
  createdAt: string | null;
  answerText?: string | null;
  answerStatus?: string | null;
  escalatedById?: string | null;
  escalatedAt?: string | null;
  aiConfidenceScore?: number | null;
  /** Student study image or case thumbnail for triage (URLs from API). */
  customImageUrl?: string | null;
  /** Session chat history for this question; latest turn drives final assessment. */
  turns?: VisualQaTurn[];
  requestedReviewMessageId?: string | null;
  selectedUserMessageId?: string | null;
  selectedAssistantMessageId?: string | null;
  customCoordinates?: PercentageBoundingBox | null;
  citations?: Citation[];
  /** Present when `GET .../questions` is called with an explicit `source` query (not legacy). */
  questionSource?: 'CaseQA' | 'VisualQA' | null;
  /** Snapshot from `medical_cases` when the session references a catalog case. */
  caseDescription?: string | null;
  caseSuggestedDiagnosis?: string | null;
  caseKeyFindings?: string | null;
}

export interface Announcement {
  id: string;
  classId: string;
  className: string;
  title: string;
  content: string;
  sendEmail: boolean;
  createdAt: string;
}

export interface ClassAssignment {
  id: string;
  classId: string;
  className: string;
  /** "case" or "quiz" */
  type: string;
  title: string;
  dueDate: string | null;
  isMandatory: boolean;
  assignedAt: string | null;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
}

export interface ClassStats {
  classId: string;
  totalStudents: number;
  totalCasesViewed: number;
  totalQuestionsAsked: number;
  avgQuizScore: number | null;
  totalAssignments: number;
  completedAssignments: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userId: string;
  fullName: string;
  email: string;
  token: string;
  roles: string[];
  /** Backend account lifecycle status (e.g. Pending, Active). */
  status?: string;
  userStatus?: string;
  requiresMedicalVerification?: boolean;
}

export interface LecturerDashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalQuestions: number;
  escalatedItems: number;
  pendingReviews: number;
  /** Backend may return null when no quiz attempts exist. */
  averageQuizScore: number | null;
}

export interface LecturerLeaderboardEntry {
  studentId?: string;
  studentName: string;
  totalCasesViewed: number;
  totalQuestionsAsked: number;
  averageQuizScore: number;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  schoolCohort: string;
  avatarUrl: string;
  isActive: boolean;
  roles: string[];
  /** ISO date string `YYYY-MM-DD` from API */
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  studentSchoolId?: string | null;
  classCode?: string | null;
  address?: string | null;
  bio?: string | null;
  emergencyContact?: string | null;
}

export interface StudentProfileUpdatePayload {
  fullName: string;
  schoolCohort: string;
  avatarUrl: string;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  studentSchoolId?: string | null;
  classCode?: string | null;
  address?: string | null;
  bio?: string | null;
  emergencyContact?: string | null;
}

export interface StudentProgress {
  totalCasesViewed: number;
  totalQuestionsAsked: number;
  /** Null when the student has no scored / completed quiz attempts yet. */
  avgQuizScore: number | null;
  totalQuizAttempts: number;
  completedQuizzes: number;
  escalatedAnswers: number;
  /** Null when the student has no completed quiz with a score yet. */
  latestQuizScore: number | null;
  /** Null when there are no submitted quiz answers to compute accuracy from. */
  quizAccuracyRate: number | null;
}

export interface StudentTopicStat {
  topicName: string;
  accuracyRate: number;
  quizAttempts: number;
}

export interface StudentRecentActivityItem {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  type: string;
  status?: string;
  /** Absolute or app-relative navigation target when the API provides one. */
  targetUrl?: string;
  /** Same semantics as notifications `route` when BE sends normalized SPA path. */
  route?: string;
  caseId?: string;
  quizId?: string;
  /** Visual QA session id when `type` is lecturer/expert reply notifications. */
  sessionId?: string;
}

export interface StudentQuizQuestion {
  questionId: string;
  questionText: string;
  type: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface StudentPracticeQuiz {
  attemptId: string;
  quizId: string;
  title: string;
  topic: string;
  difficulty?: string;
  timeLimit?: number;
  questions: StudentQuizQuestion[];
}

export interface StudentQuizAnswer {
  questionId: string;
  studentAnswer: string;
}

export interface StudentQuizSubmissionResult {
  attemptId: string;
  quizId: string;
  score: number | null;
  passingScore: number | null;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
}

export interface AssignedQuizItem {
  quizId: string;
  quizName: string;
  classId: string;
  className: string;
  /** Topic/chủ đề của quiz */
  topic?: string | null;
  totalQuestions: number;
  timeLimit: number | null;
  passingScore: number | null;
  openTime: string | null;
  closeTime: string | null;
  isCompleted: boolean;
  score: number | null;
}

export interface QuizSessionDto {
  attemptId: string;
  quizId: string;
  title: string;
  topic: string | null;
  timeLimit?: number | null;
  questions: StudentSessionQuestion[];
}

export interface StudentSessionQuestion {
  questionId: string;
  questionText: string;
  type: string | null;
  caseId: string | null;
  caseTitle: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  imageUrl?: string | null;
}

export interface StudentSubmitQuestionDto {
  questionId: string;
  studentAnswer: string;
}

export interface StudentQuizResultDto {
  attemptId: string;
  quizId: string;
  score: number | null;
  passingScore: number | null;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
}

/** Distinguishes expert library case work vs student-upload Visual QA in history UI. */
export type StudentHistoryKind = 'caseStudy' | 'personalQa';

export interface StudentCaseHistoryItem {
  id: string;
  sessionId?: string | null;
  title: string;
  lastQuestionAsked?: string | null;
  /** BE list DTO (`VisualQaSessionHistoryItemDto`): short preview for cards. */
  questionSnippet?: string | null;
  thumbnailUrl?: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  duration?: string;
  progress?: number;
  status?: 'Pending' | 'PendingExpert' | 'Approved' | 'Revised' | string;
  /** Session-level review workflow (list + thread; may overlap with `status`). */
  reviewState?: string | null;
  lastResponderRole?: string | null;
  askedAt?: string;
  /** BE often sends `updatedAt` on history list items. */
  updatedAt?: string | null;
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
  historyKind: StudentHistoryKind;
  /** Published catalog case id when this row is tied to the case library (deep link to `/student/cases/[id]`). */
  catalogCaseId?: string | null;
  /** Lecturer rejection message when session status is Rejected (BE: VisualQaSessionHistoryItemDto). */
  rejectionReason?: string | null;
}

export interface StudentCaseCatalogItem {
  id: string;
  title: string;
  imageUrl?: string;
  location: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface StudentCaseCatalogDetail extends StudentCaseCatalogItem {
  description?: string;
  expertSummary?: string;
  keyFindings?: string[];
  approvedAt?: string;
}

/** Real-time payload from SignalR `ReceiveNotification` (aligned with backend hub). */
export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  /** BE-normalized SPA path (pathname + query + fragment); prefer over `targetUrl` when set. */
  route?: string;
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  route?: string;
  createdAt?: string;
  isRead?: boolean;
}

/** From GET /api/admin/users — enrollments snapshot (BE `classAssignments`). */
export interface AdminClassAssignment {
  classId: string;
  className: string;
  roleInClass: string;
  enrolledAt?: string | null;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt?: string;
  schoolCohort?: string;
  classAssignments?: AdminClassAssignment[];
}

export interface PercentageBoundingBox {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

/** Polygon vertices in normalized image space (0–1 per axis); legacy student ROI payloads. */
export interface NormalizedPolygonPoint {
  x: number;
  y: number;
}

/** Axis-aligned bounding box in normalized image space (0–1). Preferred for Visual QA + expert case annotations. */
export interface NormalizedImageBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExpertReviewItem {
  sessionId: string;
  answerId?: string | null;
  id: string;
  studentName: string;
  className?: string;
  questionText: string;
  question: string;
  /** Catalog case id when session is tied to library case. */
  caseId?: string | null;
  /** Snapshot from `medical_cases` (aligned with lecturer triage). */
  caseDescription?: string | null;
  caseSuggestedDiagnosis?: string | null;
  caseKeyFindings?: string | null;
  imageUrl?: string;
  imageId?: string | null;
  customImageUrl?: string | null;
  promotedCaseId?: string | null;
  customCoordinates?: PercentageBoundingBox | null;
  /** Normalized rectangle ROI `{ x, y, width, height }` in 0–1 (preferred when present). */
  customBoundingBox?: NormalizedImageBoundingBox | null;
  /** Legacy: polygon vertices (0–1). */
  customPolygon?: NormalizedPolygonPoint[] | null;
  askedAt: string;
  status: 'PendingExpert' | 'Approved' | 'Rejected' | string;
  report: VisualQaReport;
  turns?: VisualQaTurn[];
  latestTurnIndex?: number | null;
  requestedReviewMessageId?: string | null;
  selectedUserMessageId?: string | null;
  selectedAssistantMessageId?: string | null;
  citations?: Citation[];
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
}

export interface Citation {
  chunkId: string;
  sourceText: string;
  referenceUrl?: string;
  pageNumber?: number;
  flagged?: boolean;
}

export type ExpertReviewCitation = Citation;
// ========== Lecturer Quiz Types ==========

export interface QuizDto {
  id: string;
  classId: string;
  className?: string | null;
  title: string;
  topic: string | null;
  isAiGenerated: boolean;
  difficulty: string | null;
  classification: string | null;
  openTime: string | null;
  closeTime: string | null;
  timeLimit: number | null;
  passingScore: number | null;
  createdAt: string | null;
  /** Present when API returns aggregate question count. */
  questionCount?: number | null;
  quizName?: string | null;
}

export interface ClassQuizDto {
  classId: string;
  quizId: string;
  quizName: string | null;
  className: string | null;
  /** Chủ đề quiz (khác tên lớp). */
  topic?: string | null;
  assignedAt: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  questionCount?: number;
}

export interface CreateQuizRequest {
  title: string;
  topic?: string;
  isAiGenerated?: boolean;
  difficulty?: string;
  classification?: string;
  openTime?: string;
  closeTime?: string;
  timeLimit?: number;
  passingScore?: number;
  classId: string;
}

export interface QuizQuestionDto {
  id: string;
  quizId: string;
  quizTitle: string | null;
  caseId: string | null;
  caseTitle: string | null;
  questionText: string;
  type: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  imageUrl?: string | null;
}

export interface CreateQuizQuestionRequest {
  quizId: string;
  caseId?: string;
  questionText: string;
  type?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  imageUrl?: string;
}

export interface UpdateQuizQuestionRequest {
  questionText: string;
  type?: string;
  correctAnswer?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  imageUrl?: string;
}

// ========== AI Quiz Types ==========

export interface AIQuizQuestion {
  questionText: string;
  type: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  caseId?: string;
  caseTitle?: string;
  explanation?: string;
}

export interface AIQuizGenerationResult {
  success: boolean;
  message?: string;
  questions: AIQuizQuestion[];
  topic?: string;
  difficulty?: string;
}

export interface AIAutoGenerateQuizRequest {
  title: string;
  topic: string;
  difficulty?: string;
  classification?: string;
  questionCount?: number;
  classId?: string;
  openTime?: string;
  closeTime?: string;
  timeLimit?: number;
  passingScore?: number;
}

export interface AISuggestQuestionsRequest {
  cases: Array<{
    caseId?: string | null;
    caseTitle?: string | null;
    caseDescription?: string | null;
    imageUrl?: string | null;
    modality?: string | null;
    keyFindings?: string | null;
    suggestedDiagnosis?: string | null;
    difficulty?: string | null;
  }>;
  questionsPerCase?: number;
  difficulty?: string | null;
}

export interface ImportStudentsSummary {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ row: number; message: string }>;
  importedStudents: Array<{
    studentId: string;
    studentName: string;
    studentCode: string;
  }>;
}

// ========== Student Types ==========

export interface StudentAnnouncement {
  id: string;
  classId: string;
  className: string | null;
  title: string;
  content: string;
  createdAt: string | null;
}

// ========== Lecturer Missing Types ==========

export interface UpdateClassRequest {
  className: string;
  semester: string;
  expertId?: string;
}

export interface ExpertOption {
  id: string;
  fullName: string;
  email?: string | null;
}

export interface ClassStudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentCode: string | null;
  totalCasesViewed: number;
  totalQuestionsAsked: number;
  avgQuizScore: number | null;
  quizAttempts: number;
  escalatedAnswers: number;
  lastActivityAt: string | null;
}

export interface LectStudentQuestionDetail {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  caseId: string | null;
  caseTitle: string | null;
  caseDescription: string | null;
  caseSuggestedDiagnosis?: string | null;
  caseKeyFindings?: string | null;
  caseThumbnailUrl: string | null;
  caseDifficulty: string | null;
  questionText: string;
  language: string | null;
  createdAt: string | null;
  answerId: string | null;
  answerText: string | null;
  structuredDiagnosis: string | null;
  differentialDiagnoses: string | null;
  answerStatus: string | null;
  aiConfidenceScore: number | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  isEscalated: boolean;
  escalatedByName: string | null;
  escalatedAt: string | null;
}

export interface LecturerAnswer {
  answerId: string;
  answerText: string;
  structuredDiagnosis: string | null;
  differentialDiagnoses: string | null;
  status: string;
  updatedAt: string;
}

// ── Quiz Review Types ────────────────────────────────────────────────────────────

export interface StudentQuizAttemptDto {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  isGraded: boolean;
}

export interface QuizAttemptDetailDto {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  passingScore: number | null;
  questions: QuestionWithAnswerDto[];
}

export interface QuestionWithAnswerDto {
  questionId: string;
  questionText: string;
  type: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  answerId: string;
}

export interface UpdateQuizAttemptRequestDto {
  score?: number | null;
  answers: UpdateAnswerDto[];
}

export interface UpdateAnswerDto {
  answerId: string;
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
}
