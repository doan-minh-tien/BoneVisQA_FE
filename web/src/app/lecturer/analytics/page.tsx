'use client';
import Header from '@/components/Header';
import {
  BarChart3, Users, BookOpen, Trophy, TrendingUp, TrendingDown,
  Download, Target, AlertTriangle, Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchLecturerAnalytics, type LecturerAnalyticsData } from '@/lib/api/lecturer-dashboard';

export default function LecturerAnalyticsPage() {
  const [data, setData] = useState<LecturerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLecturerAnalytics()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Analytics" subtitle="Learning outcomes and performance insights" />
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Header title="Analytics" subtitle="Learning outcomes and performance insights" />
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <p className="font-semibold text-destructive">{error ?? 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { classPerformance, topicScores, topStudents, bottomStudents } = data;

  const totalStudents = classPerformance.reduce((s, c) => s + c.studentCount, 0);
  const avgScore = classPerformance.length > 0
    ? Math.round(classPerformance.reduce((s, c) => s + (c.avgQuizScore ?? 0), 0) / classPerformance.filter(c => c.avgQuizScore != null).length || 0)
    : 0;
  const totalCases = classPerformance.reduce((s, c) => s + c.totalCasesViewed, 0);

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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium w-full justify-center">
              <Download className="w-4 h-4" />Export Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Class Performance */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />Class Performance
                </h3>
              </div>
              {classPerformance.length === 0 ? (
                <div className="flex min-h-[120px] flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">No class data available yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Class</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Students</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Cases</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Avg Score</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Completion</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Questions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {classPerformance.map((cls) => (
                        <tr key={cls.classId} className="hover:bg-input/30 transition-colors">
                          <td className="px-5 py-3">
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{cls.className}</p>
                              <p className="text-xs text-muted-foreground">{cls.semester}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{cls.studentCount}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{cls.totalCasesViewed}</td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-medium ${
                              (cls.avgQuizScore ?? 0) >= 75 ? 'text-success' :
                              (cls.avgQuizScore ?? 0) >= 60 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {cls.avgQuizScore != null ? `${Math.round(cls.avgQuizScore)}%` : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${cls.completionRate}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{cls.completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{cls.totalQuestions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Topic Scores */}
          <div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />Score by Topic
                </h3>
              </div>
              {topicScores.length === 0 ? (
                <div className="flex min-h-[120px] flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">No topic data yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {topicScores.map((topic) => (
                    <div key={topic.topic} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">{topic.topic}</span>
                        <span className={`text-sm font-bold ${
                          topic.avgScore >= 75 ? 'text-success' :
                          topic.avgScore >= 60 ? 'text-warning' : 'text-destructive'
                        }`}>{topic.avgScore}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full ${
                          topic.avgScore >= 75 ? 'bg-success' :
                          topic.avgScore >= 60 ? 'bg-warning' : 'bg-destructive'
                        }`} style={{ width: `${topic.avgScore}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {topic.attempts} attempts{topic.commonErrors.length > 0 ? ` · ${topic.commonErrors[0]}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-success" />Top Performers
              </h3>
            </div>
            {topStudents.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center text-muted-foreground p-6">
                <p className="text-sm">No student data available.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topStudents.map((student, idx) => (
                  <div key={student.studentId ?? idx} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.totalCasesViewed} cases · {student.totalQuestionsAsked} questions
                      </p>
                    </div>
                    <span className="text-sm font-bold text-success">
                      {student.averageQuizScore > 0 ? `${Math.round(student.averageQuizScore)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Needs Attention */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />Needs Attention
              </h3>
            </div>
            {bottomStudents.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center text-muted-foreground p-6">
                <p className="text-sm">All students are performing well.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {bottomStudents.map((student, idx) => (
                  <div key={student.studentId ?? idx} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.totalCasesViewed} cases · {student.totalQuestionsAsked} questions
                      </p>
                    </div>
                    <span className="text-sm font-bold text-destructive">
                      {student.averageQuizScore > 0 ? `${Math.round(student.averageQuizScore)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
