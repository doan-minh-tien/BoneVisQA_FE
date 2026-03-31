import React from 'react';
import Link from 'next/link';
import { Trophy, Clock, CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react';
import { Quiz, difficultyConfig, getScoreBg, getScoreColor } from './types';

interface QuizCardProps {
  quiz: Quiz;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const diff = difficultyConfig[quiz.difficulty];
  const isCompleted = quiz.status === 'completed';

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-card-foreground truncate">{quiz.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${diff.color}`}>
              {diff.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{quiz.topic}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              {quiz.totalQuestions} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {quiz.duration}
            </span>
            {isCompleted && quiz.completedAt && (
              <span>Completed {quiz.completedAt}</span>
            )}
          </div>
        </div>

        {/* Right: Score or Action */}
        {isCompleted ? (
          <div className="flex items-center gap-4">
            {/* Score */}
            <div className={`rounded-xl border px-5 py-3 text-center min-w-[100px] ${getScoreBg(quiz.score!)}`}>
              <p className={`text-2xl font-bold ${getScoreColor(quiz.score!)}`}>{quiz.score}%</p>
              <p className="text-[11px] text-muted-foreground">Score</p>
            </div>

            {/* Correct / Wrong */}
            <div className="hidden sm:flex flex-col gap-1 min-w-[90px]">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-success font-medium">{quiz.correctAnswers}</span>
                <span className="text-muted-foreground">correct</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-destructive font-medium">{quiz.wrongAnswers}</span>
                <span className="text-muted-foreground">wrong</span>
              </div>
            </div>

            {/* Retry */}
            <Link
              href={`/student/quiz/${quiz.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input/50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </Link>
          </div>
        ) : (
          <Link
            href={`/student/quiz/${quiz.id}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Quiz
          </Link>
        )}
      </div>
    </div>
  );
}
