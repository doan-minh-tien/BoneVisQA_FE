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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

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
    <div
      className={`rounded-2xl border ${config.color} p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
              {config.label}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {category}
            </span>
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-1">{caseTitle}</h3>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">
          {initials(studentName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="truncate">{studentName}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>{submittedAt}</span>
          </div>
        </div>
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
      <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3">
        <span className="text-xs font-medium text-muted-foreground">AI Generated Answer:</span>
        <p className="text-sm text-card-foreground mt-1 line-clamp-2">{aiAnswer}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/expert/reviews/${id}`}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Review</span>
        </Link>
        <button className="cursor-pointer rounded-lg border border-success px-4 py-2 text-success transition-all duration-150 hover:bg-success/10 active:scale-[0.98]">
          <CheckCircle className="w-4 h-4" />
        </button>
        <button className="cursor-pointer rounded-lg border border-destructive px-4 py-2 text-destructive transition-all duration-150 hover:bg-destructive/10 active:scale-[0.98]">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
