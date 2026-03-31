'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Filter, Trophy } from 'lucide-react';
import QuizStats from '@/components/student/quiz/QuizStats';
import QuizCard from '@/components/student/quiz/QuizCard';
import { Quiz, TabKey } from '@/components/student/quiz/types';



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
        <QuizStats 
          totalQuizzes={quizzes.length}
          completedCount={completedCount}
          notStartedCount={notStartedCount}
          avgScore={avgScore}
        />

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
          {filtered.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}

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
