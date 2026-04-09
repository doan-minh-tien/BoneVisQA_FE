import React from 'react';
import { Clock, CheckCircle, Award, BarChart2 } from 'lucide-react';

interface ActivityDay {
  day: string;
  reviews: number;
  cases: number;
}

interface ExpertActivityPanelProps {
  weeklyActivity: ActivityDay[];
  avgDailyReviews: string;
}

export default function ExpertActivityPanel({
  weeklyActivity,
  avgDailyReviews,
}: ExpertActivityPanelProps) {
  // Compute the max value across all days for relative bar scaling
  const maxValue = Math.max(
    1,
    ...weeklyActivity.flatMap((d) => [d.reviews, d.cases])
  );

  return (
    <div className="space-y-6">
      {/* This Week Activity */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          This Week Activity
        </h2>

        {weeklyActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity data available.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {weeklyActivity.map((day, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-card-foreground w-8">
                    {day.day}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                      {day.reviews} reviews
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                      {day.cases} cases
                    </span>
                  </div>
                </div>
                {/* Reviews bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(day.reviews / maxValue) * 100}%` }}
                  />
                </div>
                {/* Cases bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/70 rounded-full transition-all duration-500"
                    style={{ width: `${(day.cases / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded bg-primary" /> Reviews
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded bg-accent/70" /> Cases
          </span>
        </div>

        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">
            Average: {avgDailyReviews} reviews/day
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          Performance Metrics
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Review Time</p>
              <p className="text-2xl font-bold text-card-foreground">8.5 min</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-2xl font-bold text-card-foreground">94%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Reviews</p>
              <p className="text-2xl font-bold text-card-foreground">
                {weeklyActivity.reduce((sum, d) => sum + d.reviews, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-2xl font-bold text-card-foreground">4.8/5</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
