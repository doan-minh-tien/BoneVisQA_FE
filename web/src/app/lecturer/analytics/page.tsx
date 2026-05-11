'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { fetchLecturerAnalytics, type LecturerAnalyticsData } from '@/lib/api/lecturer-dashboard';
import { lecturerAnalyticsApi, type ClassOverview, type StudentAnalytics } from '@/lib/api/lecturer-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Trophy, 
  AlertTriangle, 
  Target,
  TrendingUp,
  ChevronRight,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function EnhancedLecturerAnalyticsPage() {
  const [existingAnalytics, setExistingAnalytics] = useState<LecturerAnalyticsData | null>(null);
  const [myClasses, setMyClasses] = useState<{ id: string; className: string; semester: string | null; studentCount: number }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classOverview, setClassOverview] = useState<ClassOverview | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<StudentAnalytics[]>([]);
  const [errorDistribution, setErrorDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analytics, classes] = await Promise.all([
          fetchLecturerAnalytics().catch(() => null),
          lecturerAnalyticsApi.getMyClasses().catch(() => []),
        ]);
        
        setExistingAnalytics(analytics);
        setMyClasses(classes);
        
        if (classes.length > 0) {
          setSelectedClass(classes[0].id);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchClassData = async () => {
      try {
        const [overview, atRisk, errors] = await Promise.all([
          lecturerAnalyticsApi.getClassOverview(selectedClass).catch(() => null),
          lecturerAnalyticsApi.getAtRiskStudents(selectedClass).catch(() => []),
          lecturerAnalyticsApi.getErrorDistribution(selectedClass).catch(() => ({})),
        ]);
        
        setClassOverview(overview);
        setAtRiskStudents(atRisk);
        setErrorDistribution(errors);
      } catch (error) {
        console.error('Error fetching class data:', error);
      }
    };

    fetchClassData();
  }, [selectedClass]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Enhanced Analytics" subtitle="Deep learning insights and student performance" />
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const totalStudents = myClasses.reduce((sum, c) => sum + c.studentCount, 0);
  const avgScore = classOverview?.averageScore ?? existingAnalytics?.classPerformance?.[0]?.avgQuizScore ?? 0;

  return (
    <div className="min-h-screen">
      <Header 
        title="Enhanced Analytics" 
        subtitle="Deep learning insights and advanced student performance analytics" 
      />
      
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Class Selector */}
        {myClasses.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {myClasses.map((cls) => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? 'default' : 'outline'}
                onClick={() => setSelectedClass(cls.id)}
                className="capitalize"
              >
                {cls.className}
                <span className="ml-2 text-xs opacity-70">({cls.studentCount})</span>
              </Button>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-success/10 p-3">
                  <Trophy className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{avgScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold">{classOverview?.atRiskStudentCount ?? atRiskStudents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-accent/10 p-3">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">{classOverview?.completionRate.toFixed(0) ?? 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* At-Risk Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Students Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atRiskStudents.length > 0 ? (
                <div className="space-y-3">
                  {atRiskStudents.slice(0, 5).map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {student.averageScore.toFixed(1)}% · {student.totalQuizzesTaken} quizzes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{student.masteryLevel}</Badge>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/lecturer/students/${student.studentId}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                  <p>All students are performing well!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-destructive" />
                Common Error Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(errorDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(errorDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([topic, count]) => (
                      <div key={topic} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{topic}</span>
                          <span className="text-muted-foreground">{count} errors</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-destructive rounded-full"
                            style={{ width: `${Math.min(100, (count / Math.max(...Object.values(errorDistribution))) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No error data available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Topic Averages */}
        {classOverview && Object.keys(classOverview.topicAverages).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Score by Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(classOverview.topicAverages).map(([topic, score]) => (
                  <div key={topic} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{topic}</span>
                      <Badge variant={
                        score >= 75 ? 'default' as const :
                        score >= 60 ? 'secondary' as const :
                        'destructive' as const
                      }>
                        {score.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          score >= 75 ? 'bg-success' :
                          score >= 60 ? 'bg-warning' :
                          'bg-destructive'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-4 flex-wrap">
          <Button asChild>
            <Link href="/lecturer/analytics">
              View Basic Analytics
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/lecturer/classes">
              Manage Classes
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
