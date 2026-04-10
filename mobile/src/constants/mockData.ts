import { Quiz } from '../components/student/quiz/types';

export const mockQuizzes: Quiz[] = [
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
    id: '4',
    title: 'Shoulder Dislocation Types',
    topic: 'Upper Extremity',
    difficulty: 'basic',
    totalQuestions: 10,
    duration: '10 min',
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
  }
];
