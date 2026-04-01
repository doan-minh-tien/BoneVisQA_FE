'use client';
import Header from '@/components/Header';
import {
  BarChart3, Users, BookOpen, Trophy, TrendingUp, TrendingDown,
  Download, Target, AlertTriangle,
} from 'lucide-react';

interface ClassStat {
  className: string;
  studentCount: number;
  casesStudied: number;
  avgQuizScore: number;
  completionRate: number;
  trend: number;
}

interface TopicScore {
  topic: string;
  avgScore: number;
  attempts: number;
  commonErrors: string[];
}

interface StudentStat {
  name: string;
  casesStudied: number;
  quizScore: number;
  className: string;
  lastActive: string;
}

const classStats: ClassStat[] = [
  { className: 'SE1801', studentCount: 35, casesStudied: 156, avgQuizScore: 78, completionRate: 82, trend: 5 },
  { className: 'SE1802', studentCount: 32, casesStudied: 128, avgQuizScore: 72, completionRate: 75, trend: -3 },
  { className: 'SE1803', studentCount: 30, casesStudied: 142, avgQuizScore: 81, completionRate: 88, trend: 8 },
  { className: 'SE1804', studentCount: 28, casesStudied: 98, avgQuizScore: 68, completionRate: 65, trend: -5 },
];

const topicScores: TopicScore[] = [
  { topic: 'Fracture Classification', avgScore: 82, attempts: 120, commonErrors: ['Confusing AO Type B and C', 'Missing Schatzker subtypes'] },
  { topic: 'Degenerative Disease', avgScore: 75, attempts: 95, commonErrors: ['Kellgren-Lawrence grading inconsistency', 'Missing subchondral changes'] },
  { topic: 'Bone Tumor', avgScore: 65, attempts: 45, commonErrors: ['Periosteal reaction patterns', 'Benign vs malignant differentiation'] },
  { topic: 'Spine', avgScore: 78, attempts: 80, commonErrors: ['Compression vs burst fracture', 'Disc herniation classification'] },
  { topic: 'Trauma', avgScore: 71, attempts: 68, commonErrors: ['Dislocation direction', 'Associated fracture identification'] },
];

const topStudents: StudentStat[] = [
  { name: 'Nguyen Van A', casesStudied: 24, quizScore: 92, className: 'SE1801', lastActive: '2 hours ago' },
  { name: 'Vo Thi F', casesStudied: 22, quizScore: 88, className: 'SE1803', lastActive: '1 hour ago' },
  { name: 'Tran Thi B', casesStudied: 20, quizScore: 85, className: 'SE1801', lastActive: '3 hours ago' },
  { name: 'Hoang Van E', casesStudied: 18, quizScore: 82, className: 'SE1803', lastActive: '5 hours ago' },
  { name: 'Le Van C', casesStudied: 15, quizScore: 78, className: 'SE1802', lastActive: '1 day ago' },
];

const bottomStudents: StudentStat[] = [
  { name: 'Dang Van G', casesStudied: 3, quizScore: 42, className: 'SE1801', lastActive: '5 days ago' },
  { name: 'Pham Thi D', casesStudied: 5, quizScore: 48, className: 'SE1802', lastActive: '3 days ago' },
  { name: 'Ngo Van I', casesStudied: 6, quizScore: 52, className: 'SE1804', lastActive: '4 days ago' },
];

export default function LecturerAnalyticsPage() {
  const totalStudents = classStats.reduce((s, c) => s + c.studentCount, 0);
  const avgScore = Math.round(classStats.reduce((s, c) => s + c.avgQuizScore, 0) / classStats.length);
  const totalCases = classStats.reduce((s, c) => s + c.casesStudied, 0);

  return (
    <div className="min-h-screen">
      <Header title="Analytics" subtitle="Learning outcomes and performance insights" />
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-lg font-bold text-card-foreground">{totalStudents}</p><p className="text-xs text-muted-foreground">Total Students</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-accent" /></div>
            <div><p className="text-lg font-bold text-card-foreground">{totalCases}</p><p className="text-xs text-muted-foreground">Cases Studied</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-success" /></div>
            <div><p className="text-lg font-bold text-card-foreground">{avgScore}%</p><p className="text-xs text-muted-foreground">Avg Quiz Score</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium w-full justify-center"><Download className="w-4 h-4" />Export Report</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Class Performance */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-card-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Class Performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Class</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Students</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Cases</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Avg Score</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Completion</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Trend</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {classStats.map((cls) => (
                      <tr key={cls.className} className="hover:bg-input/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-card-foreground">{cls.className}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{cls.studentCount}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{cls.casesStudied}</td>
                        <td className="px-5 py-3"><span className={`text-sm font-medium ${cls.avgQuizScore >= 75 ? 'text-success' : cls.avgQuizScore >= 60 ? 'text-warning' : 'text-destructive'}`}>{cls.avgQuizScore}%</span></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${cls.completionRate}%` }} /></div><span className="text-xs text-muted-foreground">{cls.completionRate}%</span></div>
                        </td>
                        <td className="px-5 py-3"><span className={`flex items-center gap-1 text-xs font-medium ${cls.trend >= 0 ? 'text-success' : 'text-destructive'}`}>{cls.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(cls.trend)}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Topic Scores */}
          <div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-card-foreground flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Score by Topic</h3></div>
              <div className="divide-y divide-border">
                {topicScores.map((topic) => (
                  <div key={topic.topic} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-card-foreground">{topic.topic}</span>
                      <span className={`text-sm font-bold ${topic.avgScore >= 75 ? 'text-success' : topic.avgScore >= 60 ? 'text-warning' : 'text-destructive'}`}>{topic.avgScore}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${topic.avgScore >= 75 ? 'bg-success' : topic.avgScore >= 60 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${topic.avgScore}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{topic.attempts} attempts &middot; Common: {topic.commonErrors[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Student Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-card-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-success" />Top Performers</h3></div>
            <div className="divide-y divide-border">
              {topStudents.map((s, i) => (
                <div key={s.name} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                    <div><p className="text-sm font-medium text-card-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.className} &middot; {s.casesStudied} cases &middot; {s.lastActive}</p></div>
                  </div>
                  <span className="text-sm font-bold text-success">{s.quizScore}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-card-foreground flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" />Needs Attention</h3></div>
            <div className="divide-y divide-border">
              {bottomStudents.map((s) => (
                <div key={s.name} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-3 h-3 text-destructive" /></div>
                    <div><p className="text-sm font-medium text-card-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.className} &middot; {s.casesStudied} cases &middot; Last: {s.lastActive}</p></div>
                  </div>
                  <span className="text-sm font-bold text-destructive">{s.quizScore}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
