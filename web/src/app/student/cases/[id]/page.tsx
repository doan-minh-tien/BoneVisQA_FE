'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchCaseCatalogDetail } from '@/lib/api/student';
import type { StudentCaseCatalogDetail } from '@/lib/api/types';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';

export default function StudentCaseDetailPage() {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const caseId = String(params?.id ?? '');
  const [item, setItem] = useState<StudentCaseCatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const detail = await fetchCaseCatalogDetail(caseId);
        if (!cancelled) setItem(detail);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load case detail.');
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
    if (!item?.imageUrl) return '/student/qa/image';
    const context = `${item.title} | ${item.location} | ${item.lesionType} | ${item.difficulty}`;
    return `/student/qa/image?catalogImageUrl=${encodeURIComponent(item.imageUrl)}&catalogTitle=${encodeURIComponent(
      item.title,
    )}&catalogContext=${encodeURIComponent(context)}`;
  }, [item]);

  return (
    <div className="min-h-screen">
      <Header
        title="Case Library Detail"
        subtitle="Review expert-approved context first, then open this case in Visual QA for your own diagnostic request."
      />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !item ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
            Case detail unavailable.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Medical image
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-muted">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.title} className="max-h-[600px] w-full object-contain" />
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
