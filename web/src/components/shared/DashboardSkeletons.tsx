import type { ReactNode } from 'react';

/**
 * Generic page loading shell — use instead of full-page spinners.
 * Wrap preset skeleton layouts or custom `children` blocks.
 */
export function PageLoadingSkeleton({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`w-full ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** Single pulsing block for custom page skeletons. */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-muted/80 ${className}`.trim()} />
  );
}

function Sk({ className }: { className?: string }) {
  return <SkeletonBlock className={className} />;
}

/** Minimal shell-session placeholder (e.g. AppShell token check). */
export function SessionGateSkeleton() {
  return (
    <PageLoadingSkeleton className="flex min-h-screen items-start justify-center bg-background px-6 py-16">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <Sk className="mx-auto h-10 w-48 max-w-full" />
          <Sk className="mx-auto h-4 w-72 max-w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <Sk className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-10" aria-hidden>
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-3">
            <Sk className="h-10 w-72 max-w-full" />
            <Sk className="h-5 w-full max-w-xl" />
            <Sk className="h-5 w-2/3 max-w-lg" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Sk className="h-12 w-40 rounded-full" />
            <Sk className="h-12 w-32 rounded-full" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-8 shadow-sm"
            >
              <Sk className="h-12 w-12 rounded-full" />
              <Sk className="h-10 w-24" />
              <Sk className="h-4 w-40" />
              <Sk className="mt-2 h-2 w-full rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Sk className="h-4 w-28" />
                  <Sk className="h-8 w-20" />
                  <Sk className="h-3 w-full max-w-[180px]" />
                </div>
                <Sk className="h-10 w-10 shrink-0 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Sk className="mb-4 h-6 w-40" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex gap-4">
                      <Sk className="h-12 w-12 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Sk className="h-5 w-3/4" />
                        <Sk className="h-4 w-full" />
                        <Sk className="h-4 w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Sk className="mb-2 h-6 w-36" />
              <Sk className="mb-6 h-4 w-full max-w-md" />
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <Sk className="h-4 w-48" />
                        <Sk className="h-3 w-32" />
                      </div>
                      <Sk className="h-6 w-20 rounded-full" />
                    </div>
                    <Sk className="mt-3 h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Sk className="mx-auto mb-4 h-6 w-44" />
              <div className="mx-auto flex h-[140px] w-[140px] items-center justify-center rounded-full border-4 border-muted">
                <Sk className="h-24 w-24 rounded-full" />
              </div>
              <div className="mx-auto mt-4 max-w-xs space-y-2 text-center">
                <Sk className="mx-auto h-4 w-full" />
                <Sk className="mx-auto h-3 w-3/4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
                  <Sk className="mx-auto mb-2 h-12 w-12 rounded-lg" />
                  <Sk className="mx-auto h-8 w-12" />
                  <Sk className="mx-auto mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Sk className="mb-2 h-6 w-40" />
              <Sk className="mb-4 h-4 w-full max-w-sm" />
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Sk className="h-4 w-2/3" />
                        <Sk className="h-3 w-full" />
                      </div>
                      <Sk className="h-3 w-16 shrink-0" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Sk className="h-5 w-20 rounded-full" />
                      <Sk className="h-5 w-28 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

export function LecturerDashboardSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Sk className="h-4 w-28" />
                  <Sk className="h-9 w-16" />
                  <Sk className="h-3 w-36" />
                </div>
                <Sk className="h-10 w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Sk className="mb-5 h-6 w-48" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
                  <Sk className="mb-3 h-10 w-10 rounded-xl" />
                  <Sk className="h-4 w-24" />
                  <Sk className="mt-2 h-8 w-16" />
                  <Sk className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Sk className="mb-2 h-6 w-52" />
            <Sk className="mb-4 h-4 w-full max-w-sm" />
            <Sk className="mb-4 h-10 w-full max-w-sm rounded-xl" />
            <LecturerLeaderboardSkeleton />
          </div>
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

export function LecturerLeaderboardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-4 gap-2 border-b border-border bg-muted/30 px-4 py-3">
        {[0, 1, 2, 3].map((i) => (
          <Sk key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-4 items-center gap-2 px-4 py-3">
            <Sk className="h-4 w-28" />
            <Sk className="h-4 w-10" />
            <Sk className="h-4 w-10" />
            <Sk className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Student history: tab bar + search + card grid. */
export function StudentHistoryPageSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            <Sk className="h-9 w-36 rounded-full" />
            <Sk className="h-9 w-40 rounded-full" />
          </div>
          <Sk className="h-12 w-full max-w-md rounded-xl" />
          <div className="flex flex-wrap gap-2 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <Sk key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <Sk className="h-48 w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Sk className="h-5 w-4/5 max-w-full" />
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-2/3" />
                <Sk className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

/** Case catalog filter row + card grid. */
export function StudentCatalogSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Sk className="mb-4 h-4 w-40" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Sk className="h-10 w-full rounded-xl" />
            <Sk className="h-10 w-full rounded-xl" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Sk className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Sk className="h-5 w-[92%] max-w-full" />
                <Sk className="h-3 w-full" />
                <Sk className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

/** Student case detail hero + body. */
export function StudentCaseDetailSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="grid gap-6 lg:grid-cols-2">
          <Sk className="aspect-[4/3] w-full rounded-xl lg:min-h-[320px]" />
          <div className="space-y-4">
            <Sk className="h-8 w-3/4 max-w-md" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Sk className="h-10 w-32 rounded-lg" />
              <Sk className="h-10 w-36 rounded-lg" />
            </div>
          </div>
        </div>
        <Sk className="h-40 w-full rounded-xl" />
      </div>
    </PageLoadingSkeleton>
  );
}

/** Lecturer QA triage: class select + two-column workbench. */
export function TriageWorkbenchSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Sk className="h-4 w-full max-w-xl" />
          <Sk className="h-10 w-full max-w-sm rounded-lg" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Sk className="h-5 w-48" />
            <div className="max-h-[70vh] space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/20 p-4">
                  <Sk className="h-4 w-3/4" />
                  <Sk className="mt-2 h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-[320px] rounded-xl border border-border bg-card p-6">
            <Sk className="mb-4 h-6 w-56" />
            <Sk className="h-4 w-full" />
            <Sk className="mt-2 h-4 w-full" />
            <Sk className="mt-4 h-32 w-full rounded-lg" />
            <div className="mt-6 flex gap-2">
              <Sk className="h-10 w-28 rounded-lg" />
              <Sk className="h-10 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

/** Expert review queue accordion list. */
export function ExpertReviewQueueSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-start gap-3 px-5 py-5">
              <Sk className="h-14 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-5 w-2/3 max-w-md" />
                <Sk className="h-4 w-full" />
                <Sk className="h-4 w-4/5" />
              </div>
              <Sk className="h-8 w-8 shrink-0 rounded" />
            </div>
          </div>
        ))}
      </div>
    </PageLoadingSkeleton>
  );
}

/** Admin users table (toolbar + rows). */
export function UserManagementTableSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="w-full p-4" aria-hidden>
        <div className="mb-4 grid grid-cols-5 gap-3 border-b border-border pb-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk key={i} className="h-3 w-20" />
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="grid grid-cols-5 items-center gap-3 border-b border-border py-3">
            <Sk className="h-4 w-36" />
            <Sk className="h-4 w-44" />
            <Sk className="h-6 w-20 rounded-full" />
            <Sk className="h-6 w-16 rounded-full" />
            <Sk className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </PageLoadingSkeleton>
  );
}

/** Lecturer quiz list / workbench initial load. */
export function QuizWorkbenchListSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="mx-auto max-w-7xl space-y-8 px-8 pb-16" aria-hidden>
        <div className="space-y-2">
          <Sk className="h-4 w-40" />
          <Sk className="h-12 w-full max-w-xl" />
          <Sk className="h-5 w-full max-w-2xl" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Sk className="h-12 w-48 rounded-full" />
          <Sk className="h-12 w-40 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Sk className="h-5 w-4/5" />
              <Sk className="mt-3 h-4 w-full" />
              <Sk className="mt-2 h-4 w-2/3" />
              <div className="mt-4 flex gap-2">
                <Sk className="h-9 w-24 rounded-lg" />
                <Sk className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

/** Lecturer cases table + toolbar. */
export function LecturerCasesPageSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Sk className="h-10 w-64 max-w-full rounded-lg" />
          <Sk className="h-10 w-40 rounded-lg" />
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-6 gap-2 border-b border-border bg-muted/30 px-4 py-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Sk key={i} className="h-3 w-16" />
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 items-center gap-2 border-b border-border px-4 py-4">
              <Sk className="h-4 w-8" />
              <Sk className="col-span-2 h-4 w-full" />
              <Sk className="h-4 w-20" />
              <Sk className="h-6 w-16 rounded-full" />
              <Sk className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

/** Settings pages (admin / expert / lecturer) profile form shell. */
export function SettingsFormSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="space-y-2">
          <Sk className="h-3 w-32" />
          <Sk className="h-8 w-48" />
          <Sk className="h-4 w-96 max-w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row">
            <Sk className="mx-auto h-24 w-24 shrink-0 rounded-full sm:mx-0" />
            <div className="min-w-0 flex-1 space-y-4">
              <Sk className="h-10 w-full" />
              <Sk className="h-10 w-full" />
              <Sk className="h-28 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <PageLoadingSkeleton>
      <div className="space-y-6" aria-hidden>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Sk className="h-4 w-28" />
                  <Sk className="h-9 w-20" />
                  <Sk className="h-3 w-32" />
                </div>
                <Sk className="h-10 w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Sk className="mb-4 h-6 w-40" />
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 border-b border-border pb-3 last:border-0">
                    <Sk className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Sk className="h-4 w-48" />
                      <Sk className="h-3 w-64 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Sk className="mb-4 h-6 w-48" />
              <Sk className="h-48 w-full max-w-md rounded-xl" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Sk className="mb-4 h-6 w-36" />
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Sk key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <Sk className="mb-4 h-6 w-28" />
              <Sk className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </PageLoadingSkeleton>
  );
}
