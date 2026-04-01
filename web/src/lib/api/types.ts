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
  avgQuizScore: number;
  totalQuizAttempts: number;
  completedQuizzes: number;
  escalatedAnswers: number;
  latestQuizScore: number;
  quizAccuracyRate: number;
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
  questions: StudentQuizQuestion[];
}

export interface StudentQuizAnswer {
  questionId: string;
  studentAnswer: string;
}

export interface StudentQuizSubmissionResult {
  attemptId: string;
  score: number;
  passingScore: number;
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
}
