import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

interface StudentPerformanceCardProps {
  studentName: string;
  studentId: string;
  avatar?: string;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  completedCases: number;
  totalCases: number;
  lastActivity: string;
  status: 'excellent' | 'good' | 'needs-attention';
}

export default function StudentPerformanceCard({
  studentName,
  studentId,
  averageScore,
  trend,
  completedCases,
  totalCases,
  lastActivity,
  status,
}: StudentPerformanceCardProps) {
  const statusConfig = {
    excellent: {
      color: 'text-success',
      bgColor: 'bg-success/10',
      icon: Award,
    },
    good: {
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      icon: TrendingUp,
    },
    'needs-attention': {
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      icon: AlertTriangle,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const completionRate = Math.round((completedCases / totalCases) * 100);

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {studentName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-semibold text-card-foreground text-sm">{studentName}</h4>
            <p className="text-xs text-muted-foreground">{studentId}</p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Average Score</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-card-foreground">{averageScore}%</span>
            {TrendIcon && (
              <TrendIcon className={`w-4 h-4 ${trend === 'up' ? 'text-success' : 'text-destructive'}`} />
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-medium text-card-foreground">
            {completedCases}/{totalCases}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Last Activity */}
      <p className="text-xs text-muted-foreground">
        Last active: {lastActivity}
      </p>
    </div>
  );
}
