import React from 'react';
import { Clock, CheckCircle, Award, AlertTriangle } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      {/* This Week Activity */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">
          This Week Activity
        </h2>
        <div className="space-y-3 mb-4">
          {weeklyActivity.map((day, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-card-foreground">
                  {day.day}
                </span>
                <span className="text-xs text-muted-foreground">
                  {day.reviews} reviews
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(day.reviews / 15) * 100}%` }}
                />
              </div>
            </div>
          ))}
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
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-2xl font-bold text-card-foreground">4.8/5</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-card rounded-xl border border-destructive/20 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground mb-1">
              Attention Required
            </h3>
            <p className="text-sm text-muted-foreground">
              5 high-priority reviews pending for more than 24 hours
            </p>
          </div>
        </div>
        <button className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors duration-150 cursor-pointer">
          <span className="text-sm font-medium">Review Now</span>
        </button>
      </div>
    </div>
  );
}
