import { Activity, AlertCircle, Users, BookOpen, ShieldCheck } from 'lucide-react';
import type { AdminActivityStat } from '@/lib/api/admin-dashboard';

interface SystemActivityFeedProps {
  activityStats?: AdminActivityStat | null;
}

export default function SystemActivityFeed({ activityStats }: SystemActivityFeedProps) {
  const today = new Date().toDateString();
  const todayData = activityStats?.dailyActivity?.find(
    (d) => new Date(d.date).toDateString() === today,
  );

  const caseViewsToday = todayData?.caseViews ?? 0;
  const questionsToday = todayData?.questions ?? 0;
  const quizAttemptsToday = todayData?.quizAttempts ?? 0;

  const feedItems = [
    {
      type: 'user' as const,
      message: `${activityStats ? '+' + (activityStats.totalCaseViews - caseViewsToday) : '—'} case views this month`,
      time: 'all time',
    },
    {
      type: 'course' as const,
      message: `${caseViewsToday} case views today`,
      time: 'today',
    },
    {
      type: 'system' as const,
      message: `${questionsToday} questions asked today`,
      time: 'today',
    },
    {
      type: 'alert' as const,
      message: `${quizAttemptsToday} quiz attempts today`,
      time: 'today',
    },
    {
      type: 'user' as const,
      message: `Avg quiz score: ${(activityStats?.avgQuizScore ?? 0).toFixed(1)}%`,
      time: 'overall',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-card-foreground">System Activity</h2>
      </div>
      <div className="space-y-3">
        {feedItems.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              activity.type === 'alert'
                ? 'bg-warning/10 text-warning'
                : activity.type === 'system'
                ? 'bg-success/10 text-success'
                : activity.type === 'course'
                ? 'bg-accent/10 text-accent'
                : 'bg-primary/10 text-primary'
            }`}>
              {activity.type === 'alert' && <AlertCircle className="w-4 h-4" />}
              {activity.type === 'user' && <Users className="w-4 h-4" />}
              {activity.type === 'course' && <BookOpen className="w-4 h-4" />}
              {activity.type === 'system' && <ShieldCheck className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
