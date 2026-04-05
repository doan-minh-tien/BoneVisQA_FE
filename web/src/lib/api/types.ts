/** Normalized Visual QA report (accepts camelCase or PascalCase from backend). */
export interface VisualQaCitation {
  documentUrl?: string;
  chunkOrder?: number;
  title?: string;
}

export interface VisualQaReport {
  answerText: string;
  suggestedDiagnosis: string;
  keyFindings: string[];
  differentialDiagnoses: string[];
  recommendedReadings: Array<{ title?: string; url?: string } | string>;
  citations: VisualQaCitation[];
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
  indexingStatus?: string;
  message?: string;
}

export interface LecturerTriageRow {
  id: string;
  studentName: string;
  questionSnippet: string;
  thumbnailUrl: string;
  askedAt: string;
  similarityScore: number;
  escalated?: boolean;
}

export interface ClassItem {
  id: string;
  className: string;
  semester: string;
  lecturerId: string;
  createdAt: string;
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
}

export interface Announcement {
  id: string;
  classId: string;
  className: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface ClassStats {
  classId: string;
  totalStudents: number;
  totalCasesViewed: number;
  totalQuestionsAsked: number;
  avgQuizScore: number | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userId: string;
  fullName: string;
  email: string;
  token: string;
  roles: string[];
  requiresMedicalVerification?: boolean;
}

export interface LecturerDashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalQuestions: number;
  escalatedItems: number;
  pendingReviews: number;
  averageQuizScore: number;
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
}

export interface StudentProfileUpdatePayload {
  fullName: string;
  schoolCohort: string;
  avatarUrl: string;
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

export interface StudentCaseHistoryItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  duration?: string;
  progress?: number;
  status?: 'Pending' | 'PendingExpert' | 'Approved' | 'Revised' | string;
  askedAt?: string;
}

export interface StudentCaseCatalogItem {
  id: string;
  title: string;
  imageUrl?: string;
  location: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt?: string;
  schoolCohort?: string;
}

export interface PercentageBoundingBox {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface ExpertReviewItem {
  id: string;
  studentName: string;
  className?: string;
  question: string;
  imageUrl?: string;
  customCoordinates?: PercentageBoundingBox | null;
  askedAt: string;
  status: 'PendingExpert' | 'Approved' | 'Rejected' | string;
  report: VisualQaReport;
  citations?: ExpertReviewCitation[];
}

export interface ExpertReviewCitation {
  chunkId: string;
  sourceText: string;
  referenceUrl?: string;
  pageNumber?: number;
  flagged?: boolean;
}

// ========== Lecturer Quiz Types ==========

export interface QuizDto {
  id: string;
  classId: string;
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
}

export interface ClassQuizDto {
  classId: string;
  quizId: string;
  quizName: string | null;
  className: string | null;
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
    caseId?: string;
    caseTitle?: string;
    caseDescription?: string;
    imageUrl?: string;
    modality?: string;
    keyFindings?: string;
    suggestedDiagnosis?: string;
    difficulty?: string;
  }>;
  questionsPerCase?: number;
  difficulty?: string;
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

// ========== Lecturer Missing Types ==========

export interface UpdateClassRequest {
  className: string;
  semester: string;
  expertId?: string;
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
