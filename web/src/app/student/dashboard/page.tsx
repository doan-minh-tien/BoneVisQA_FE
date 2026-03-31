import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import CaseCard from '@/components/student/CaseCard';
import QuickActionCard from '@/components/student/QuickActionCard';
import TopicProgressCard from '@/components/student/dashboard/TopicProgressCard';
import RecentActivityCard from '@/components/student/dashboard/RecentActivityCard';
import LearningInsights from '@/components/student/dashboard/LearningInsights';
import OverallProgressCard from '@/components/student/dashboard/OverallProgressCard';
import {
  BookOpen,
  Trophy,
  Target,
  Flame,
  Play,
  BotMessageSquare,
  ImageUp,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
} from 'lucide-react';

// Mock data - sẽ thay bằng API calls
const studentStats = [
  {
    title: 'Cases Studied',
    value: '24',
    change: '+6 this week',
    changeType: 'positive' as const,
    icon: BookOpen,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Quiz Score',
    value: '87%',
    change: '+5% improvement',
    changeType: 'positive' as const,
    icon: Trophy,
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Study Streak',
    value: '12 days',
    change: 'Keep it up!',
    changeType: 'positive' as const,
    icon: Flame,
    iconColor: 'bg-destructive/10 text-destructive',
  },
  {
    title: 'Accuracy Rate',
    value: '92%',
    change: '+3% from last month',
    changeType: 'positive' as const,
    icon: Target,
    iconColor: 'bg-success/10 text-success',
  },
];

const quickActions = [
  {
    title: 'AI Q&A by Topic',
    description: 'Ask about bone regions using RAG chatbot',
    icon: BotMessageSquare,
    href: '/student/qa?mode=topic',
    iconColor: 'bg-primary/10 text-primary',
    badge: 'New',
  },
  {
    title: 'AI Q&A by Image',
    description: 'Upload X-ray/CT/MRI for AI analysis',
    icon: ImageUp,
    href: '/student/qa?mode=image',
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Start Quick Quiz',
    description: '5-minute quiz on long bone fractures',
    icon: Play,
    href: '/student/quiz/quick',
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'View Schedule',
    description: 'Check upcoming assignments',
    icon: Calendar,
    href: '/student/schedule',
    iconColor: 'bg-secondary/10 text-secondary',
  },
];

const recentCases = [
  {
    id: '1',
    title: 'Distal Radius Fracture - Case Study',
    thumbnail: '/cases/case1.jpg',
    boneLocation: 'Wrist',
    lesionType: 'Fracture',
    difficulty: 'basic' as const,
    duration: '12 min',
    progress: 75,
  },
  {
    id: '2',
    title: 'Osteoarthritis of the Knee Joint',
    thumbnail: '/cases/case2.jpg',
    boneLocation: 'Knee',
    lesionType: 'Degenerative',
    difficulty: 'intermediate' as const,
    duration: '18 min',
    progress: 45,
  },
  {
    id: '3',
    title: 'Complex Tibial Plateau Fracture',
    thumbnail: '/cases/case3.jpg',
    boneLocation: 'Tibia',
    lesionType: 'Fracture',
    difficulty: 'advanced' as const,
    duration: '25 min',
    progress: 0,
  },
  {
    id: '4',
    title: 'Shoulder Dislocation Analysis',
    thumbnail: '/cases/case4.jpg',
    boneLocation: 'Shoulder',
    lesionType: 'Dislocation',
    difficulty: 'intermediate' as const,
    duration: '15 min',
    progress: 100,
  },
];

const topicProgress = [
  { name: 'Long Bone Fractures', progress: 85, total: 20, completed: 17 },
  { name: 'Spine Lesions', progress: 60, total: 15, completed: 9 },
  { name: 'Joint Diseases', progress: 40, total: 18, completed: 7 },
  { name: 'Bone Tumors', progress: 25, total: 12, completed: 3 },
];

const recentActivity = [
  { type: 'quiz', message: 'Completed "Fracture Classification" quiz', score: 90, time: '2 hours ago' },
  { type: 'case', message: 'Studied Hip Fracture case', time: '5 hours ago' },
  { type: 'achievement', message: 'Earned "Week Warrior" badge', time: '1 day ago' },
  { type: 'qa', message: 'Asked question on Spine X-ray', time: '1 day ago' },
];

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Welcome back, Student!"
        subtitle="Continue your learning journey"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {studentStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Continue Learning */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.title} {...action} />
                ))}
              </div>
            </div>

            {/* Continue Learning */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">Continue Learning</h2>
                <a href="/student/cases" className="text-sm text-primary hover:underline">
                  View all cases
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentCases.map((case_) => (
                  <CaseCard key={case_.id} {...case_} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Activity */}
          <div className="space-y-6">
            {/* Overall Progress */}
            <OverallProgressCard progress={68} completedCases={68} totalCases={100} />

            {/* Topic Progress */}
            <TopicProgressCard topics={topicProgress} />

            {/* Recent Activity */}
            <RecentActivityCard activities={recentActivity} />
          </div>
        </div>

        {/* Learning Insights */}
        <LearningInsights />
      </div>
    </div>
  );
}
