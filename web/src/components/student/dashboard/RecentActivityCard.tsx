import React from 'react';
import { Trophy, BookOpen, Award, MessageSquare } from 'lucide-react';

interface Activity {
  type: string;
  message: string;
  score?: number;
  time: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export default function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                activity.type === 'quiz'
                  ? 'bg-warning/10 text-warning'
                  : activity.type === 'achievement'
                  ? 'bg-success/10 text-success'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {activity.type === 'quiz' && <Trophy className="w-4 h-4" />}
              {activity.type === 'case' && <BookOpen className="w-4 h-4" />}
              {activity.type === 'achievement' && <Award className="w-4 h-4" />}
              {activity.type === 'qa' && <MessageSquare className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground">
                {activity.message}
                {activity.score !== undefined && (
                  <span className="ml-2 text-success font-medium">
                    {activity.score}%
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
