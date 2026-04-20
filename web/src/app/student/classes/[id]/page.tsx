'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { StudentClassWorkbench } from '@/components/student/StudentClassWorkbench';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { fetchStudentClasses } from '@/lib/api/student';
import { useEffect, useState } from 'react';

export default function StudentClassDetailPage() {
  const params = useParams();
  const classId = String(params?.id ?? '');
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (!classId) return;
    (async () => {
      try {
        const classes = await fetchStudentClasses();
        const found = classes.find((c) => c.classId === classId);
        if (found) setClassName(found.className);
      } catch {
        // silent
      }
    })();
  }, [classId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title={className || 'Class'}
        subtitle="Class roster, case assignments, quizzes, and announcements."
      />

      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/student/classes" className="hover:text-foreground">
            Classes
          </Link>
          <ChevronRight className="h-4 w-4 opacity-60" aria-hidden />
          <span className="truncate text-foreground">{className || 'Class'}</span>
        </nav>

        <StudentClassWorkbench classId={classId} />
      </div>
    </div>
  );
}
