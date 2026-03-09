import { Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AssignmentCardProps {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  totalStudents: number;
  submitted: number;
  graded: number;
  status: 'active' | 'overdue' | 'completed';
}

export default function AssignmentCard({
  id,
  title,
  className,
  dueDate,
  totalStudents,
  submitted,
  graded,
  status,
}: AssignmentCardProps) {
  const submissionRate = Math.round((submitted / totalStudents) * 100);
  const gradingProgress = Math.round((graded / submitted) * 100) || 0;

  const statusConfig = {
    active: {
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      label: 'Active',
    },
    overdue: {
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      label: 'Overdue',
    },
    completed: {
      color: 'text-success',
      bgColor: 'bg-success/10',
      label: 'Completed',
    },
  };

  const config = statusConfig[status];

  return (
    <Link
      href={`/lecturer/assignments/${id}`}
      className="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-2 mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{className}</p>
        </div>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-card-foreground">Due: {dueDate}</span>
      </div>

      {/* Progress */}
      <div className="space-y-3">
        {/* Submission Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Submission Rate</span>
            <span className="text-xs font-medium text-card-foreground">
              {submitted}/{totalStudents}
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
              <span className="text-xs text-muted-foreground">Grading Progress</span>
              <span className="text-xs font-medium text-card-foreground">
                {graded}/{submitted}
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

      {/* Footer */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1 text-sm">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">{graded} graded</span>
        </div>
        {submitted - graded > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span className="text-muted-foreground">{submitted - graded} pending</span>
          </div>
        )}
      </div>
    </Link>
  );
}
