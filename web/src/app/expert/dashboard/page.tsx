import Header from '@/components/Header';
import QuickStatsCard from '@/components/expert/QuickStatsCard';
import ReviewCard from '@/components/expert/ReviewCard';
import CaseManagementCard from '@/components/expert/CaseManagementCard';
import {
  FolderOpen,
  MessageSquareText,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  Plus,
  Filter,
} from 'lucide-react';

// Mock data
const expertStats = [
  {
    title: 'Total Cases',
    value: '156',
    change: 12,
    trend: 'up' as const,
    icon: FolderOpen,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Pending Reviews',
    value: '23',
    change: -15,
    trend: 'down' as const,
    icon: Clock,
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Approved This Month',
    value: '48',
    change: 8,
    trend: 'up' as const,
    icon: CheckCircle,
    iconColor: 'bg-success/10 text-success',
  },
  {
    title: 'Student Interactions',
    value: '2,847',
    change: 23,
    trend: 'up' as const,
    icon: Users,
    iconColor: 'bg-accent/10 text-accent',
  },
];

const pendingReviews = [
  {
    id: '1',
    studentName: 'Nguyen Van A',
    caseTitle: 'Complex Distal Radius Fracture Case Study',
    question: 'What type of fracture classification should be applied here? I see multiple fragments but unsure about the intra-articular involvement.',
    aiAnswer: 'Based on the radiographic findings, this appears to be an AO/OTA type C3 fracture (complete articular, multifragmentary). The key features include...',
    submittedAt: '2 hours ago',
    priority: 'high' as const,
    category: 'Fracture Classification',
  },
  {
    id: '2',
    studentName: 'Tran Thi B',
    caseTitle: 'Knee Osteoarthritis Progression',
    question: 'How to differentiate between Grade 3 and Grade 4 osteoarthritis in this case?',
    aiAnswer: 'The classification is based on the Kellgren-Lawrence grading system. In this image, we observe...',
    submittedAt: '5 hours ago',
    priority: 'normal' as const,
    category: 'Degenerative Disease',
  },
  {
    id: '3',
    studentName: 'Le Van C',
    caseTitle: 'Shoulder Dislocation Analysis',
    question: 'Is there a Hill-Sachs lesion present in this case?',
    aiAnswer: 'Yes, there is evidence of a Hill-Sachs lesion. This is characterized by...',
    submittedAt: '1 day ago',
    priority: 'low' as const,
    category: 'Dislocation',
  },
];

const recentCases = [
  {
    id: '1',
    title: 'Tibial Plateau Fracture - Schatzker Type IV',
    boneLocation: 'Tibia',
    lesionType: 'Fracture',
    difficulty: 'advanced' as const,
    status: 'approved' as const,
    addedBy: 'Dr. Smith',
    addedDate: '2024-01-20',
    viewCount: 245,
    usageCount: 89,
  },
  {
    id: '2',
    title: 'Osteoporosis with Compression Fracture',
    boneLocation: 'Spine',
    lesionType: 'Degenerative',
    difficulty: 'intermediate' as const,
    status: 'pending' as const,
    addedBy: 'Dr. Johnson',
    addedDate: '2024-01-25',
    viewCount: 56,
    usageCount: 12,
  },
  {
    id: '3',
    title: 'Hip Fracture - Intracapsular',
    boneLocation: 'Hip',
    lesionType: 'Fracture',
    difficulty: 'basic' as const,
    status: 'approved' as const,
    addedBy: 'Dr. Chen',
    addedDate: '2024-01-18',
    viewCount: 412,
    usageCount: 156,
  },
  {
    id: '4',
    title: 'Bone Tumor - Osteosarcoma Study',
    boneLocation: 'Femur',
    lesionType: 'Tumor',
    difficulty: 'advanced' as const,
    status: 'draft' as const,
    addedBy: 'Dr. Expert',
    addedDate: '2024-01-28',
    viewCount: 8,
    usageCount: 0,
  },
];

const weeklyActivity = [
  { day: 'Mon', reviews: 8, cases: 3 },
  { day: 'Tue', reviews: 12, cases: 5 },
  { day: 'Wed', reviews: 6, cases: 2 },
  { day: 'Thu', reviews: 15, cases: 7 },
  { day: 'Fri', reviews: 10, cases: 4 },
  { day: 'Sat', reviews: 4, cases: 1 },
  { day: 'Sun', reviews: 2, cases: 0 },
];

export default function ExpertDashboardPage() {
  const totalWeeklyReviews = weeklyActivity.reduce((sum, day) => sum + day.reviews, 0);
  const avgDailyReviews = (totalWeeklyReviews / 7).toFixed(1);

  return (
    <div className="min-h-screen">
      <Header
        title="Clinical Expert Dashboard"
        subtitle="Manage cases and review student questions"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {expertStats.map((stat) => (
            <QuickStatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Case</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filter Cases</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Pending Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Pending Q&A Reviews
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {pendingReviews.length} questions awaiting your review
                  </p>
                </div>
                <a
                  href="/expert/reviews"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  View all
                </a>
              </div>
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </div>
            </div>

            {/* Recent Cases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">
                  Case Management
                </h2>
                <a
                  href="/expert/cases"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  View all cases
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentCases.map((case_) => (
                  <CaseManagementCard key={case_.id} {...case_} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Insights */}
          <div className="space-y-6">
            {/* This Week Activity */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                This Week Activity
              </h2>
              <div className="space-y-3 mb-4">
                {weeklyActivity.map((day, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-card-foreground">
                        {day.day}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {day.reviews} reviews
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(day.reviews / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Average: {avgDailyReviews} reviews/day
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">
                Performance Metrics
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Review Time</p>
                    <p className="text-2xl font-bold text-card-foreground">8.5 min</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approval Rate</p>
                    <p className="text-2xl font-bold text-card-foreground">94%</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quality Score</p>
                    <p className="text-2xl font-bold text-card-foreground">4.8/5</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-card rounded-xl border border-destructive/20 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Attention Required
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    5 high-priority reviews pending for more than 24 hours
                  </p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors duration-150 cursor-pointer">
                <span className="text-sm font-medium">Review Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <MessageSquareText className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">347</p>
            <p className="text-sm text-muted-foreground">Total Q&A Reviewed</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">156</p>
            <p className="text-sm text-muted-foreground">Cases Approved</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">89%</p>
            <p className="text-sm text-muted-foreground">Student Satisfaction</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">Top 5%</p>
            <p className="text-sm text-muted-foreground">Expert Ranking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
