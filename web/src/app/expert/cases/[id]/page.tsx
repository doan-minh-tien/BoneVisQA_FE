'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import { useToast } from '@/components/ui/toast';
import { fetchExpertCase, formatCaseDateForDisplay, type CaseStatus } from '@/lib/api/expert-cases';
import { getApiProblemDetails, resolveApiAssetUrl } from '@/lib/api/client';
import { Pencil, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusBadge: Record<
  CaseStatus,
  { label: string; className: string; Icon: typeof CheckCircle }
> = {
  draft: {
    label: 'Draft',
    className: 'border-border bg-muted/60 text-muted-foreground',
    Icon: Clock,
  },
  pending: {
    label: 'Pending',
    className: 'border-warning/30 bg-warning/10 text-warning',
    Icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    className: 'border-success/30 bg-success/10 text-success',
    Icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
    Icon: AlertCircle,
  },
};

export default function ExpertCaseDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const toast = useToast();
  const toastedErrorRef = useRef<string | null>(null);

  const { data: caseRow, isPending, isError, error } = useQuery({
    queryKey: ['expert', 'case', id],
    queryFn: () => fetchExpertCase(id),
    enabled: Boolean(id),
  });

  const errorMsg = isError
    ? error instanceof Error
      ? error.message
      : 'Could not load this case.'
    : null;

  useEffect(() => {
    if (!errorMsg) {
      toastedErrorRef.current = null;
      return;
    }
    const { title: errTitle, detail } = getApiProblemDetails(error);
    const combined = detail ? `${errTitle}: ${detail}` : errTitle;
    if (toastedErrorRef.current === combined) return;
    toastedErrorRef.current = combined;
    toast.error(combined);
  }, [error, errorMsg, toast]);

  const headerSubtitle = useMemo(() => {
    if (isPending) return 'Loading case…';
    if (!caseRow) return '';
    const parts = [
      caseRow.categoryName,
      caseRow.boneLocation !== '—' ? caseRow.boneLocation : null,
      caseRow.expertName !== '—' ? caseRow.expertName : null,
    ].filter(Boolean);
    return parts.join(' · ') || 'Expert medical case';
  }, [caseRow, isPending]);

  const st = caseRow ? statusBadge[caseRow.status] : null;
  const StatusIcon = st?.Icon ?? Clock;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title={caseRow?.title ?? 'Case detail'} subtitle={headerSubtitle || undefined} />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {isPending ? (
          <PageLoadingSkeleton>
            <SkeletonBlock className="h-8 w-2/3 max-w-md" />
            <SkeletonBlock className="mt-4 h-24 w-full rounded-xl" />
            <SkeletonBlock className="mt-4 h-40 w-full rounded-xl" />
          </PageLoadingSkeleton>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {errorMsg}
          </div>
        ) : caseRow ? (
          <article className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {st ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${st.className}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                      {st.label}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                    {caseRow.difficulty}
                  </span>
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created {formatCaseDateForDisplay(caseRow.addedDate)}
                </p>
              </div>
              <Link
                href={`/expert/cases/${caseRow.id}/edit`}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </div>

            {caseRow.tags && caseRow.tags.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-card-foreground">Tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {caseRow.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {caseRow.medicalImages && caseRow.medicalImages.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-card-foreground">Medical images</h2>
                <ul className="mt-4 space-y-4">
                  {caseRow.medicalImages.map((img, idx) => {
                    const src = resolveApiAssetUrl(img.imageUrl);
                    return (
                      <li key={`${img.imageUrl}-${idx}`} className="rounded-xl border border-border bg-muted/20 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          {img.modality?.trim() || 'Imaging'} · Image {idx + 1}
                        </p>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt=""
                            className="max-h-[min(420px,55vh)] w-full rounded-lg border border-border bg-background object-contain"
                          />
                        ) : null}
                        {img.annotations && img.annotations.length > 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Annotations:{' '}
                            {img.annotations.map((a) => a.label).filter(Boolean).join(', ') || '—'}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <dl className="space-y-4 rounded-2xl border border-border bg-card p-6 text-sm shadow-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Bone / region</dt>
                <dd className="mt-1 text-card-foreground">
                  {caseRow.boneLocation === '—' ? '—' : caseRow.boneLocation}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Category</dt>
                <dd className="mt-1 text-card-foreground">{caseRow.categoryName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Expert</dt>
                <dd className="mt-1 text-card-foreground">{caseRow.expertName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-card-foreground">{caseRow.description || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Suggested diagnosis</dt>
                <dd className="mt-1 text-card-foreground">{caseRow.suggestedDiagnosis || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Key findings</dt>
                <dd className="mt-1 whitespace-pre-wrap text-card-foreground">{caseRow.keyFindings || '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Reflective questions</dt>
                <dd className="mt-1 whitespace-pre-wrap text-card-foreground">{caseRow.reflectiveQuestions || '—'}</dd>
              </div>
            </dl>
          </article>
        ) : null}
      </div>
    </div>
  );
}
