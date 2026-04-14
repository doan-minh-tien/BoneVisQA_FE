'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function StudentAssignmentsPlaceholderPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Assignments"
        subtitle="Course cases and quizzes assigned by your lecturers will appear here."
      />
      <div className="mx-auto max-w-xl px-4 py-12">
        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-primary" />}
          title="Coming soon"
          description="This page is a placeholder so short links and search results do not 404. Use Classes to open quizzes and case work for each cohort."
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/student/classes"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            My classes
          </Link>
          <Link
            href="/student/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
