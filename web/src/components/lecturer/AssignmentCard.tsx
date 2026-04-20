'use client';

import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface AssignmentCardProps {
  id: string;
  title: string;
  className?: string;
  dueDate?: string | null;
  totalStudents?: number;
  submitted?: number;
  graded?: number;
  status?: 'active' | 'overdue' | 'completed';
  /** Badge showing assignment type */
  type?: string;
  isMandatory?: boolean;
  assignedAt?: string | null;
  /** Show checkbox to select/deselect assignment */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  /** Highlight newly assigned assignment */
  isNew?: boolean;
}

function computeStatus(
  dueDate: string | null | undefined,
  submitted: number,
  total: number,
): 'active' | 'overdue' | 'completed' {
  if (submitted > 0 && submitted >= total) return 'completed';
  if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
  return 'active';
}

function formatDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return '—';
  const d = new Date(dueDate);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssignmentCard({
  id,
  title,
  className,
  dueDate,
  totalStudents = 0,
  submitted = 0,
  graded = 0,
  type,
  isMandatory = false,
  assignedAt,
  selectable = false,
  selected = false,
  onSelect,
  isNew = false,
}: AssignmentCardProps) {
  const status = computeStatus(dueDate ?? null, submitted, totalStudents);

  const statusConfig = {
    active: { color: 'text-primary', bgColor: 'bg-primary/10', label: 'Active' },
    overdue: { color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Overdue' },
    completed: { color: 'text-success', bgColor: 'bg-success/10', label: 'Completed' },
  };

  const config = statusConfig[status];
  const submissionRate = totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0;
  const gradingProgress = submitted > 0 ? Math.round((graded / submitted) * 100) : 0;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(id, !selected);
  };

  return (
    <Link
      href={`/lecturer/assignments/${id}?type=${type ?? 'quiz'}`}
      className={`block bg-card rounded-xl border p-5 hover:shadow-md transition-all duration-200 ${
        selected ? 'border-primary ring-2 ring-primary/20' :
        isNew ? 'border-green-500 ring-2 ring-green-500/20 shadow-green-500/10 shadow-lg' :
        'border-border hover:border-primary/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* NEW Badge */}
        {isNew && (
          <div className="flex-shrink-0">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white animate-pulse">
              NEW
            </span>
          </div>
        )}

        {/* Checkbox for selection */}
        {selectable && (
          <button
            type="button"
            onClick={handleCheckboxClick}
            className="flex-shrink-0 mt-1 cursor-pointer transition-colors"
            title={selected ? 'Deselect' : 'Select'}
          >
            {selected ? (
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 hover:border-primary transition-colors" />
            )}
          </button>
        )}

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
            {type && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                {type === 'case' ? 'Case' : 'Quiz'}
              </span>
            )}
            {isMandatory && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning">
                Mandatory
              </span>
            )}
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-2 mb-1">{title}</h3>
          {className && <p className="text-sm text-muted-foreground">{className}</p>}
        </div>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded">
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-card-foreground">
          Due: {formatDueDate(dueDate)}
        </span>
      </div>

      {/* Progress */}
      {totalStudents > 0 && (
        <div className="space-y-3">
          {/* Submission Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Submitted</span>
              <span className="text-xs font-medium text-card-foreground">
                {submitted}/{totalStudents} ({submissionRate}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
          </div>

          {/* Grading Progress */}
          {submitted > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Graded</span>
                <span className="text-xs font-medium text-card-foreground">
                  {graded}/{submitted} ({gradingProgress}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: `${gradingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {totalStudents > 0 && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">{graded} graded</span>
          </div>
          {submitted - graded > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="text-muted-foreground">{submitted - graded} pending grading</span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
