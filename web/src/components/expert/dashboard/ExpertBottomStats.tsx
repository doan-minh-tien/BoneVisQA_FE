import React from 'react';
import { MessageSquareText, CheckCircle, TrendingUp, Award, Clock, Target, BrainCircuit } from 'lucide-react';
import type { ExpertPerformanceMetrics, ExpertAiConfidenceInsights } from '@/lib/api/expert-dashboard';

interface ExpertBottomStatsProps {
  totalReviews?: number;
  casesApproved?: number;
  avgStudentScore?: number;
  expertRanking?: number;
  performanceMetrics?: ExpertPerformanceMetrics | null;
  aiConfidenceInsights?: ExpertAiConfidenceInsights | null;
}

export default function ExpertBottomStats({
  totalReviews = 0,
  casesApproved = 0,
  avgStudentScore = 0,
  expertRanking = 0,
  performanceMetrics,
  aiConfidenceInsights,
}: ExpertBottomStatsProps) {
  const metrics = performanceMetrics;
  const confidence = aiConfidenceInsights;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <MessageSquareText className="w-6 h-6 text-primary" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">{totalReviews.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">Total Q&A Reviewed</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
          <CheckCircle className="w-6 h-6 text-success" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">{casesApproved.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">Cases Approved</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <TrendingUp className="w-6 h-6 text-accent" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">
          {avgStudentScore > 0 ? `${avgStudentScore.toFixed(0)}%` : (metrics?.avgStudentScore ? `${metrics.avgStudentScore.toFixed(0)}%` : '—')}
        </p>
        <p className="text-sm text-muted-foreground">Avg Student Score</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
          <Award className="w-6 h-6 text-warning" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">
          {expertRanking > 0 ? `#${expertRanking}` : (metrics?.expertRanking ? `#${metrics.expertRanking}` : '—')}
        </p>
        <p className="text-sm text-muted-foreground">Expert Ranking</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
          <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">
          {metrics ? `${metrics.avgReviewTimeMinutes.toFixed(1)}m` : '—'}
        </p>
        <p className="text-sm text-muted-foreground">Avg Review Time</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
          <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">
          {metrics ? `${metrics.approvalRate.toFixed(0)}%` : '—'}
        </p>
        <p className="text-sm text-muted-foreground">Approval Rate</p>
      </div>
    </div>
  );
}
