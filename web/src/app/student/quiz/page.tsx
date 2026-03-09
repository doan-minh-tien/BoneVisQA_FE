'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Filter,
} from 'lucide-react';

type QuizStatus = 'completed' | 'not_started';
type Difficulty = 'basic' | 'intermediate' | 'advanced';
type TabKey = 'all' | 'not_started' | 'completed';

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  totalQuestions: number;
  duration: string;
  status: QuizStatus;
  score?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  completedAt?: string;
}

const difficultyConfig: Record<Difficulty, { color: string; label: string }> = {
  basic: { color: 'text-success bg-success/10', label: 'Basic' },
  intermediate: { color: 'text-warning bg-warning/10', label: 'Intermediate' },
  advanced: { color: 'text-destructive bg-destructive/10', label: 'Advanced' },
};

// Mock data
const quizzes: Quiz[] = [
  {
    id: '1',
    title: 'Fracture Classification',
    topic: 'Long Bone Fractures',
    difficulty: 'basic',
    totalQuestions: 10,
    duration: '10 min',
    status: 'completed',
    score: 90,
    correctAnswers: 9,
    wrongAnswers: 1,
    completedAt: '2 days ago',
  },
  {
    id: '2',
    title: 'Knee Joint Pathology',
    topic: 'Joint Diseases',
    difficulty: 'intermediate',
    totalQuestions: 15,
    duration: '15 min',
    status: 'completed',
    score: 73,
    correctAnswers: 11,
    wrongAnswers: 4,
    completedAt: '5 days ago',
  },
  {
    id: '3',
    title: 'Spine Lesion Identification',
    topic: 'Spine Lesions',
    difficulty: 'advanced',
    totalQuestions: 20,
    duration: '20 min',
    status: 'completed',
    score: 60,
    correctAnswers: 12,
    wrongAnswers: 8,
    completedAt: '1 week ago',
  },
  {
    id: '4',
    title: 'Shoulder Dislocation Types',
    topic: 'Upper Extremity',
    difficulty: 'basic',
    totalQuestions: 10,
    duration: '10 min',
    status: 'not_started',
  },
  {
    id: '5',
    title: 'Osteoarthritis vs Rheumatoid Arthritis',
    topic: 'Joint Diseases',
    difficulty: 'intermediate',
    totalQuestions: 12,
    duration: '12 min',
    status: 'not_started',
  },
  {
    id: '6',
    title: 'Bone Tumor Recognition',
    topic: 'Bone Tumors',
    difficulty: 'advanced',
    totalQuestions: 15,
    duration: '18 min',
    status: 'not_started',
  },
  {
    id: '7',
    title: 'Wrist Fracture Patterns',
    topic: 'Upper Extremity',
    difficulty: 'basic',
    totalQuestions: 10,
    duration: '10 min',
    status: 'not_started',
  },
  {
    id: '8',
    title: 'Hip Fracture Classification',
    topic: 'Lower Extremity',
    difficulty: 'intermediate',
    totalQuestions: 12,
    duration: '15 min',
    status: 'completed',
    score: 83,
    correctAnswers: 10,
    wrongAnswers: 2,
    completedAt: '3 days ago',
  },
];

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Quizzes' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'completed', label: 'Completed' },
];

function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-success/10 border-success/20';
  if (score >= 60) return 'bg-warning/10 border-warning/20';
  return 'bg-destructive/10 border-destructive/20';
}

export default function StudentQuizPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const filtered = quizzes.filter((q) => {
    if (activeTab !== 'all' && q.status !== activeTab) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  const completedCount = quizzes.filter((q) => q.status === 'completed').length;
  const notStartedCount = quizzes.filter((q) => q.status === 'not_started').length;
  const avgScore = quizzes
    .filter((q) => q.status === 'completed' && q.score !== undefined)
    .reduce((sum, q, _, arr) => sum + (q.score! / arr.length), 0);

  return (
    <div className="min-h-screen">
      <Header title="Quizzes" subtitle="Test your knowledge on bone & joint pathology" />

      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-card-foreground">{quizzes.length}</p>
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
            <p className={`text-2xl font-bold ${getScoreColor(Math.round(avgScore))}`}>{Math.round(avgScore)}%</p>
            <p className="text-sm text-muted-foreground">Avg. Score</p>
          </div>
        </div>

        {/* Tabs + Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 bg-card rounded-lg border border-border p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Levels</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Quiz List */}
        <div className="space-y-3">
          {filtered.map((quiz) => {
            const diff = difficultyConfig[quiz.difficulty];
            const isCompleted = quiz.status === 'completed';

            return (
              <div
                key={quiz.id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
              >
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
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No quizzes found</p>
              <p className="text-sm mt-1">Try changing the filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
