import { MessageSquare, User, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';

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

const priorityConfig = {
  high: {
    color: 'border-destructive/50 bg-destructive/5',
    badge: 'bg-destructive/10 text-destructive',
    label: 'High Priority'
  },
  normal: {
    color: 'border-border bg-card',
    badge: 'bg-warning/10 text-warning',
    label: 'Normal'
  },
  low: {
    color: 'border-border bg-card',
    badge: 'bg-muted text-muted-foreground',
    label: 'Low Priority'
  }
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
      <div className="flex items-center gap-2">
        <Link
          href={`/expert/reviews/${id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Review</span>
        </Link>
        <button className="px-4 py-2 border border-success text-success rounded-lg hover:bg-success/10 transition-colors duration-150 cursor-pointer">
          <CheckCircle className="w-4 h-4" />
        </button>
        <button className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors duration-150 cursor-pointer">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
