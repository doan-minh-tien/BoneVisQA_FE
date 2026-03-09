import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import CaseCard from '@/components/student/CaseCard';
import QuickActionCard from '@/components/student/QuickActionCard';
import ProgressRing from '@/components/student/ProgressRing';
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
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Overall Progress</h2>
              <div className="flex flex-col items-center">
                <ProgressRing progress={68} size={140} strokeWidth={10} />
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">68 of 100 cases completed</p>
                  <p className="text-xs text-muted-foreground mt-1">You're doing great!</p>
                </div>
              </div>
            </div>

            {/* Topic Progress */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Progress by Topic</h2>
              <div className="space-y-4">
                {topicProgress.map((topic) => (
                  <div key={topic.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">{topic.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {topic.completed}/{topic.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'quiz'
                          ? 'bg-warning/10 text-warning'
                          : activity.type === 'achievement'
                          ? 'bg-success/10 text-success'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {activity.type === 'quiz' && <Trophy className="w-4 h-4" />}
                      {activity.type === 'case' && <BookOpen className="w-4 h-4" />}
                      {activity.type === 'achievement' && <Award className="w-4 h-4" />}
                      {activity.type === 'qa' && <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-card-foreground">
                        {activity.message}
                        {'score' in activity && (
                          <span className="ml-2 text-success font-medium">
                            {activity.score}%
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Insights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">+15%</p>
            <p className="text-sm text-muted-foreground">Accuracy This Week</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">4.5h</p>
            <p className="text-sm text-muted-foreground">Study Time This Week</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">12</p>
            <p className="text-sm text-muted-foreground">Badges Earned</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">87%</p>
            <p className="text-sm text-muted-foreground">Goal Achievement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
