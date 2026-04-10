import React from 'react';
import { MessageSquareText, CheckCircle, TrendingUp, Award } from 'lucide-react';

interface ExpertBottomStatsProps {
  totalReviews?: number;
  casesApproved?: number;
  avgStudentScore?: number;
}

export default function ExpertBottomStats({
  totalReviews = 0,
  casesApproved = 0,
  avgStudentScore = 0,
}: ExpertBottomStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          {avgStudentScore > 0 ? `${avgStudentScore.toFixed(0)}%` : '—'}
        </p>
        <p className="text-sm text-muted-foreground">Avg Student Score</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
          <Award className="w-6 h-6 text-warning" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">—</p>
        <p className="text-sm text-muted-foreground">Expert Ranking</p>
      </div>
    </div>
  );
}
