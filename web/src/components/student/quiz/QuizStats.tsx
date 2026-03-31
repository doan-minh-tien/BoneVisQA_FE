import React from 'react';
import { getScoreColor } from './types';

interface QuizStatsProps {
  totalQuizzes: number;
  completedCount: number;
  notStartedCount: number;
  avgScore: number;
}

export default function QuizStats({
  totalQuizzes,
  completedCount,
  notStartedCount,
  avgScore,
}: QuizStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <p className="text-2xl font-bold text-card-foreground">{totalQuizzes}</p>
        <p className="text-sm text-muted-foreground">Total Quizzes</p>
      </div>
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <p className="text-2xl font-bold text-success">{completedCount}</p>
        <p className="text-sm text-muted-foreground">Completed</p>
      </div>
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <p className="text-2xl font-bold text-warning">{notStartedCount}</p>
        <p className="text-sm text-muted-foreground">Not Started</p>
      </div>
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <p className={`text-2xl font-bold ${getScoreColor(Math.round(avgScore))}`}>
          {Math.round(avgScore)}%
        </p>
        <p className="text-sm text-muted-foreground">Avg. Score</p>
      </div>
    </div>
  );
}
