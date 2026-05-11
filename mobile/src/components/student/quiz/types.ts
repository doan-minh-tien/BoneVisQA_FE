export type QuizStatus = 'completed' | 'not_started';
export type Difficulty = 'basic' | 'intermediate' | 'advanced';
export type TabKey = 'all' | 'not_started' | 'completed';

export interface Quiz {
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

// In React Native with NativeWind, we map Tailwind classes
export const difficultyConfig: Record<Difficulty, { color: string; label: string }> = {
  basic: { color: 'text-success bg-success/10', label: 'Basic' },
  intermediate: { color: 'text-warning bg-warning/10', label: 'Intermediate' },
  advanced: { color: 'text-destructive bg-destructive/10', label: 'Advanced' },
};

export function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

export function getScoreBg(score: number) {
  if (score >= 80) return 'bg-success/10 border-success/20';
  if (score >= 60) return 'bg-warning/10 border-warning/20';
  return 'bg-destructive/10 border-destructive/20';
}
