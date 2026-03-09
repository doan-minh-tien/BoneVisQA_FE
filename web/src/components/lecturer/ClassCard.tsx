import { Users, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ClassCardProps {
  id: string;
  name: string;
  code: string;
  cohort: string;
  studentCount: number;
  completionRate: number;
  nextSession: string;
  status: 'active' | 'upcoming' | 'completed';
}

const statusConfig = {
  active: {
    color: 'bg-success/10 text-success border-success/20',
    label: 'Active',
  },
  upcoming: {
    color: 'bg-warning/10 text-warning border-warning/20',
    label: 'Upcoming',
  },
  completed: {
    color: 'bg-muted text-muted-foreground border-border',
    label: 'Completed',
  },
};

export default function ClassCard({
  id,
  name,
  code,
  cohort,
  studentCount,
  completionRate,
  nextSession,
  status,
}: ClassCardProps) {
  const config = statusConfig[status];

  return (
    <Link
      href={`/lecturer/classes/${id}`}
      className="block bg-card rounded-xl border-2 border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">{code}</span>
          </div>
          <h3 className="font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{cohort}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-card-foreground">{studentCount}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-bold text-card-foreground">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <p className="text-xl font-bold text-card-foreground">24</p>
          <p className="text-xs text-muted-foreground">Cases</p>
        </div>
      </div>

      {/* Next Session */}
      {status === 'active' && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Next Session</p>
            <p className="text-sm font-medium text-card-foreground">{nextSession}</p>
          </div>
        </div>
      )}
    </Link>
  );
}
