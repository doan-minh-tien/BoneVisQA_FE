'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { EmptyState } from '@/components/shared/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function StudentAnalyticsPlaceholderPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Analytics"
        subtitle="Deeper progress charts and cohort comparisons will live here."
      />
      <div className="mx-auto max-w-xl px-4 py-12">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6 text-primary" />}
          title="Coming soon"
          description="Your dashboard already shows headline stats. This area is reserved for expanded analytics without breaking navigation."
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/student/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            Back to dashboard
          </Link>
          <Link
            href="/student/quiz"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Practice quizzes
          </Link>
        </div>
      </div>
    </div>
  );
}
