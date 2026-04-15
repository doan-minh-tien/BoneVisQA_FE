'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { StudentCaseDetailSkeleton } from '@/components/shared/DashboardSkeletons';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchCaseCatalogDetail } from '@/lib/api/student';
import type { StudentCaseCatalogDetail } from '@/lib/api/types';
import { AlertCircle, BookOpen, ChevronRight } from 'lucide-react';
import { isNextImageRemoteOptimized } from '@/lib/images/remote-image';

export default function StudentCaseDetailPage() {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const rawParam = params?.id;
  const caseId = Array.isArray(rawParam) ? String(rawParam[0] ?? '') : String(rawParam ?? '');
  const [item, setItem] = useState<StudentCaseCatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundCase, setNotFoundCase] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setNotFoundCase(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setNotFoundCase(false);
      try {
        const detail = await fetchCaseCatalogDetail(caseId);
        if (!cancelled) setItem(detail);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load case detail.';
          const is404 = /404|not found/i.test(message);
          if (is404) {
            setNotFoundCase(true);
            setItem(null);
          } else {
            toast.error(message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId, toast]);

  const qaHref = useMemo(() => {
    if (!item?.imageUrl) return `/student/qa/image?caseId=${encodeURIComponent(caseId)}`;
    const context = `${item.title} | ${item.location} | ${item.lesionType} | ${item.difficulty}`;
    return `/student/qa/image?catalogImageUrl=${encodeURIComponent(item.imageUrl)}&catalogTitle=${encodeURIComponent(
      item.title,
    )}&catalogContext=${encodeURIComponent(context)}&caseId=${encodeURIComponent(caseId)}`;
  }, [caseId, item]);

  return (
    <div className="min-h-screen">
      <Header
        title="Case Library Detail"
        subtitle="Review expert-approved context first, then open this case in Visual QA for your own diagnostic request."
      />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        {loading ? (
          <StudentCaseDetailSkeleton />
        ) : notFoundCase ? (
          <EmptyState
            icon={<AlertCircle className="h-6 w-6 text-amber-600" />}
            title="Case not found"
            description="This case may have been removed or is no longer available. Please return to the catalog and choose another case."
          />
        ) : !item ? (
          <EmptyState
            icon={<AlertCircle className="h-6 w-6 text-slate-500" />}
            title="Case detail unavailable"
            description="We could not load this case right now. Please try again in a moment."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Medical image
              </div>
              <div className="flex w-full justify-center overflow-hidden rounded-lg border border-border bg-muted p-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={1600}
                    height={1200}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="h-auto max-h-[600px] w-full object-contain"
                    priority
                    unoptimized={!isNextImageRemoteOptimized(item.imageUrl)}
                  />
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
                    No case image available.
                  </div>
                )}
              </div>
            </section>
            <section className="space-y-4">
              <article className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold text-card-foreground">{item.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {item.location}
                  </span>
                  <span className="rounded-full bg-cyan-accent/10 px-2.5 py-1 text-xs font-medium text-cyan-accent">
                    {item.lesionType}
                  </span>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium capitalize text-success">
                    {item.difficulty}
                  </span>
                </div>
                {item.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                ) : null}
              </article>

              <article className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Expert-approved metadata
                </h3>
                <p className="mt-2 text-sm text-card-foreground">
                  {item.expertSummary || 'No expert summary provided.'}
                </p>
                {item.keyFindings && item.keyFindings.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {item.keyFindings.map((finding, index) => (
                      <li key={`${finding}-${index}`}>{finding}</li>
                    ))}
                  </ul>
                ) : null}
                {item.approvedAt ? (
                  <p className="mt-3 text-xs text-muted-foreground">Approved at: {item.approvedAt}</p>
                ) : null}
              </article>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">
                  Open this case in Visual QA to draw ROI annotations and ask custom AI diagnostic questions.
                </p>
                <Link href={qaHref} className="mt-4 inline-flex">
                  <Button>
                    Ask AI about this case
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
