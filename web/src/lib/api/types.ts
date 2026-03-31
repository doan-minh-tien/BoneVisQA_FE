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

export interface ExpertReviewItem {
  id: string;
  studentName: string;
  className?: string;
  question: string;
  imageUrl?: string;
  askedAt: string;
  status: 'PendingExpert' | 'Approved' | 'Rejected' | string;
  report: VisualQaReport;
}
