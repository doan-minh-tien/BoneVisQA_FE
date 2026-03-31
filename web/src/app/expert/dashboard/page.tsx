import Header from '@/components/Header';
import QuickStatsCard from '@/components/expert/QuickStatsCard';
import ReviewCard from '@/components/expert/ReviewCard';
import CaseManagementCard from '@/components/expert/CaseManagementCard';
import ExpertActivityPanel from '@/components/expert/dashboard/ExpertActivityPanel';
import ExpertBottomStats from '@/components/expert/dashboard/ExpertBottomStats';
import {
  FolderOpen,
  CheckCircle,
  Clock,
  Users,
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
            <ExpertActivityPanel 
              weeklyActivity={weeklyActivity} 
              avgDailyReviews={avgDailyReviews} 
            />
          </div>
        </div>

        {/* Bottom Stats */}
        <ExpertBottomStats />
      </div>
    </div>
  );
}
