'use client';

import { Clock, Users, FileQuestion, Calendar } from 'lucide-react';
import Link from 'next/link';

interface QuizCardProps {
  id: string;
  classId: string;
  className: string;
  title: string;
  questionCount: number;
  studentCount: number;
  timeLimit: number | null;
  openTime: string | null;
  closeTime: string | null;
  createdAt: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function QuizCard({
  id,
  className,
  title,
  questionCount,
  studentCount,
  timeLimit,
  openTime,
  closeTime,
  createdAt,
}: QuizCardProps) {
  return (
    <Link
      href={`/lecturer/quizzes/${id}`}
      className="block bg-card rounded-2xl border-2 border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
              {className}
            </span>
          </div>
          <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Created {formatDate(createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Edit action
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Delete action
            }}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileQuestion className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-card-foreground">{questionCount}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-success/10">
            <Users className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-lg font-bold text-card-foreground">{studentCount}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        {timeLimit && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{timeLimit} min</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {openTime ? `Opens ${formatDate(openTime)}` : 'Not scheduled'}
          </span>
        </div>
      </div>
    </Link>
  );
}
