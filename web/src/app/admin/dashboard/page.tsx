import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  Award,
  ShieldCheck,
  Activity,
  FileText,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Users',
    value: '3,156',
    change: '+84 this month',
    changeType: 'positive' as const,
    icon: Users,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Students',
    value: '2,847',
    change: '+12% from last month',
    changeType: 'positive' as const,
    icon: GraduationCap,
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'Lecturers',
    value: '156',
    change: '98% active',
    changeType: 'neutral' as const,
    icon: UserCog,
    iconColor: 'bg-warning/10 text-warning',
  },
  {
    title: 'Active Courses',
    value: '48',
    change: '+3 new this semester',
    changeType: 'positive' as const,
    icon: BookOpen,
    iconColor: 'bg-success/10 text-success',
  },
];

const recentUsers = [
  { name: 'Nguyen Van A', email: 'nguyenvana@edu.vn', role: 'Student', status: 'Active', joinedAt: '2 hours ago' },
  { name: 'Tran Thi B', email: 'tranthib@edu.vn', role: 'Student', status: 'Active', joinedAt: '5 hours ago' },
  { name: 'Le Van C', email: 'levanc@edu.vn', role: 'Lecturer', status: 'Pending', joinedAt: '1 day ago' },
  { name: 'Pham Thi D', email: 'phamthid@edu.vn', role: 'Expert', status: 'Active', joinedAt: '1 day ago' },
  { name: 'Hoang Van E', email: 'hoangvane@edu.vn', role: 'Student', status: 'Active', joinedAt: '2 days ago' },
];

const systemActivity = [
  { type: 'user', message: '12 new student registrations approved', time: '30 min ago' },
  { type: 'alert', message: 'RAG indexing pipeline completed successfully', time: '1 hour ago' },
  { type: 'course', message: 'New course "Advanced Radiology" created by Dr. Tran', time: '2 hours ago' },
  { type: 'system', message: 'System backup completed', time: '4 hours ago' },
  { type: 'alert', message: 'AI model updated to latest version', time: '6 hours ago' },
];

const roleDistribution = [
  { role: 'Students', count: 2847, percentage: 90.2, color: 'bg-primary' },
  { role: 'Lecturers', count: 156, percentage: 4.9, color: 'bg-accent' },
  { role: 'Experts', count: 89, percentage: 2.8, color: 'bg-warning' },
  { role: 'Curators', count: 52, percentage: 1.7, color: 'bg-secondary' },
  { role: 'Admins', count: 12, percentage: 0.4, color: 'bg-destructive' },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="System overview and management" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Users Table */}
            <div className="bg-card rounded-xl border border-border">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-card-foreground">Recent Users</h2>
                </div>
                <a href="/admin/users" className="text-sm text-primary hover:underline">
                  View all
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Role</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentUsers.map((user, idx) => (
                      <tr key={idx} className="hover:bg-input/50 transition-colors duration-150">
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'Student'
                              ? 'bg-primary/10 text-primary'
                              : user.role === 'Lecturer'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            user.status === 'Active' ? 'text-success' : 'text-warning'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'Active' ? 'bg-success' : 'bg-warning'
                            }`} />
                            {user.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{user.joinedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">User Distribution by Role</h2>
              </div>
              <div className="space-y-3">
                {roleDistribution.map((item) => (
                  <div key={item.role}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-card-foreground">{item.role}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-300 rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* System Activity */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">System Activity</h2>
              </div>
              <div className="space-y-3">
                {systemActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'alert'
                        ? 'bg-warning/10 text-warning'
                        : activity.type === 'system'
                        ? 'bg-success/10 text-success'
                        : activity.type === 'course'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {activity.type === 'alert' && <AlertCircle className="w-4 h-4" />}
                      {activity.type === 'user' && <Users className="w-4 h-4" />}
                      {activity.type === 'course' && <BookOpen className="w-4 h-4" />}
                      {activity.type === 'system' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-card-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">Platform Stats</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground">Total Cases</span>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">1,245</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground">Quizzes Created</span>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">328</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground">AI Q&A Sessions</span>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">5,672</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground">Avg. Response Time</span>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">1.2s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-primary">99.8%</p>
            <p className="text-sm text-muted-foreground mt-1">System Uptime</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-success">94.2%</p>
            <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-warning">4.6</p>
            <p className="text-sm text-muted-foreground mt-1">Avg. AI Rating</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border text-center">
            <p className="text-3xl font-bold text-accent">847</p>
            <p className="text-sm text-muted-foreground mt-1">Certificates Issued</p>
          </div>
        </div>
      </div>
    </div>
  );
}
