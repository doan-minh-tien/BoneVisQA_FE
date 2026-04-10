'use client';

import { useEffect, useState } from 'react';
import { StudentAppChrome, StudentDashboardFab } from '@/components/student/StudentAppChrome';
import {
  StudentClinicalBento,
  StudentClinicalBentoSkeleton,
} from '@/components/student/dashboard/StudentClinicalBento';
import {
  fetchStudentProgress,
  fetchStudentTopicStats,
  fetchStudentCases,
} from '@/lib/api/student';
import type { StudentCaseHistoryItem, StudentProgress, StudentTopicStat } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { BookOpen } from 'lucide-react';

export default function StudentDashboardPage() {
  const toast = useToast();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [topicStats, setTopicStats] = useState<StudentTopicStat[]>([]);
  const [caseHistory, setCaseHistory] = useState<StudentCaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [progressData, topicData, historyData] = await Promise.all([
          fetchStudentProgress(),
          fetchStudentTopicStats(),
          fetchStudentCases(),
        ]);
        if (!cancelled) {
          setProgress(progressData);
          setTopicStats(topicData);
          setCaseHistory(historyData);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load student dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <div className="min-h-screen text-[#191c1e]">
      <StudentAppChrome breadcrumb="Student Dashboard" />

      <div className="px-6 pb-16 pt-6 md:px-10">
        {loading ? (
          <StudentClinicalBentoSkeleton />
        ) : !progress ? (
          <div className="rounded-3xl border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center dark:border-white/20 dark:bg-slate-900/40">
            <BookOpen className="mx-auto h-10 w-10 text-[#727783]" />
            <h2 className="mt-4 text-lg font-semibold text-[#191c1e] dark:text-slate-100">
              No progress data available
            </h2>
            <p className="mt-2 text-sm text-[#424752] dark:text-slate-400">
              The progress API did not return data for this session. Try refreshing or contact support if the problem
              persists.
            </p>
          </div>
        ) : (
          <StudentClinicalBento progress={progress} topicStats={topicStats} caseHistory={caseHistory} />
        )}
      </div>

      <StudentDashboardFab />
    </div>
  );
}
