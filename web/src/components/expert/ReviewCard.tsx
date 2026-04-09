import { MessageSquare, User, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ReviewCardProps {
  id: string;
  studentName: string;
  caseTitle: string;
  question: string;
  aiAnswer: string;
  submittedAt: string;
  priority: 'high' | 'normal' | 'low';
  category: string;
}

// Review status options (expert action)
const REVIEW_STATUS_OPTIONS = [
  { value: '', label: '— Review Status —' },
  { value: 'Approve', label: 'Approve' },
  { value: 'Reject', label: 'Reject' },
  { value: 'Edit', label: 'Edit' },
] as const;

// Case answer action status options
const ANSWER_STATUS_OPTIONS = [
  { value: '', label: '— Answer Status —' },
  { value: 'Pending', label: 'Pending' },
  { value: 'RequiresLecturerReview', label: 'Requires Lecturer Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Edited', label: 'Edited' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Escalated', label: 'Escalated' },
  { value: 'EscalatedToExpert', label: 'Escalated to Expert' },
  { value: 'ExpertApproved', label: 'Expert Approved' },
  { value: 'Revised', label: 'Revised' },
] as const;

const priorityConfig = {
  high: {
    color: 'border-destructive/50 bg-destructive/5',
    badge: 'bg-destructive/10 text-destructive',
    label: 'High Priority',
  },
  normal: {
    color: 'border-border bg-card',
    badge: 'bg-warning/10 text-warning',
    label: 'Normal',
  },
  low: {
    color: 'border-border bg-card',
    badge: 'bg-muted text-muted-foreground',
    label: 'Low Priority',
  },
};

export default function ReviewCard({
  id,
  studentName,
  caseTitle,
  question,
  aiAnswer,
  submittedAt,
  priority,
  category,
}: ReviewCardProps) {
  const config = priorityConfig[priority];
  const [reviewStatus, setReviewStatus] = useState('');
  const [answerStatus, setAnswerStatus] = useState('');

  const reviewSelectColor =
    reviewStatus === 'Approve'
      ? 'border-success text-success'
      : reviewStatus === 'Reject'
      ? 'border-destructive text-destructive'
      : 'border-border text-muted-foreground';

  return (
    <div className={`rounded-xl border-2 ${config.color} p-5 transition-all duration-200 hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.badge}`}>
              {config.label}
            </span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
              {category}
            </span>
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-1">{caseTitle}</h3>
        </div>
      </div>

      {/* Student Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <User className="w-4 h-4" />
        <span>{studentName}</span>
        <span className="mx-1">•</span>
        <Clock className="w-4 h-4" />
        <span>{submittedAt}</span>
      </div>

      {/* Question */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-card-foreground">Student Question:</span>
        </div>
        <p className="text-sm text-card-foreground line-clamp-2 pl-6">{question}</p>
      </div>

      {/* AI Answer Preview */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
        <span className="text-xs font-medium text-muted-foreground">AI Generated Answer:</span>
        <p className="text-sm text-card-foreground mt-1 line-clamp-2">{aiAnswer}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Review + Detail */}
        <div className="flex items-center gap-2">
          {/* Review Status dropdown */}
          <select
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium bg-card focus:outline-none appearance-none cursor-pointer transition-colors ${reviewSelectColor}`}
          >
            {REVIEW_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View detail */}
          <Link
            href={`/expert/reviews/${id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Detail
          </Link>
        </div>

        {/* Row 2: Answer Status dropdown */}
        <select
          value={answerStatus}
          onChange={(e) => setAnswerStatus(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-card text-muted-foreground focus:outline-none appearance-none cursor-pointer hover:border-primary/50 transition-colors"
        >
          {ANSWER_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
