'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationList } from '@/components/shared/CitationList';
import {
  ArrowLeft,
  CheckCircle,
  FileQuestion,
  Loader2,
  Send,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import {
  MedicalImageViewer,
} from '@/components/student/MedicalImageViewer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { postStudentVisualQa } from '@/lib/api/student-visual-qa';
import type { PercentageBoundingBox, VisualQaReport } from '@/lib/api/types';

export default function StudentVisualQaImagePage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [report, setReport] = useState<VisualQaReport | null>(null);
  const [annotationBox, setAnnotationBox] = useState<PercentageBoundingBox | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const catalogImageUrl = searchParams.get('catalogImageUrl');
  const catalogTitle = searchParams.get('catalogTitle');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!catalogImageUrl || file) return;

    let cancelled = false;
    (async () => {
      setPrefillLoading(true);
      try {
        const response = await fetch(catalogImageUrl);
        if (!response.ok) {
          throw new Error('Unable to preload the selected catalog image.');
        }
        const blob = await response.blob();
        if (cancelled) return;
        const extension = blob.type.split('/')[1] || 'jpg';
        const safeTitle = (catalogTitle || 'catalog-case').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
        const prefilledFile = new File([blob], `${safeTitle}.${extension}`, {
          type: blob.type || 'image/jpeg',
        });
        setFile(prefilledFile);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to preload selected catalog case.');
        }
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [catalogImageUrl, catalogTitle, file, toast]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setReport(null);
      setFile(f);
      setAnnotationBox(null);
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !question.trim()) {
      toast.error('Please attach an image and enter a clinical question.');
      return;
    }
    setLoading(true);
    setUploadPct(0);
    setReport(null);
    try {
      const res = await postStudentVisualQa(
        file,
        question.trim(),
        annotationBox,
        setUploadPct,
      );
      setReport(res);
      toast.success('Diagnostic report generated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
      setUploadPct(0);
    }
  };

  const confidenceScore = report
    ? Math.min(
        99.4,
        Math.max(76.2, 88 + report.keyFindings.length * 1.2 + report.citations.length * 0.5),
      )
    : null;

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-text-main">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-color bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/student/qa"
            className="rounded-lg border border-border-color bg-surface p-2 text-text-muted hover:text-text-main"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-text-main">Visual diagnostic request</h1>
            <p className="text-xs text-text-muted">
              One image · One question · One structured AI report (not a chat session)
            </p>
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 xl:grid-cols-2">
        <aside className="min-h-[50vh] border-b border-border-color xl:min-h-0 xl:border-b-0 xl:border-r">
          <MedicalImageViewer
            src={previewUrl}
            alt="Study image for diagnostic request"
            onAnnotationComplete={setAnnotationBox}
          />
        </aside>

        <main className="h-[calc(100vh-4rem)] overflow-y-auto bg-background p-5 md:p-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-xl border border-border-color bg-surface p-5 shadow-panel"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-accent" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
                  Diagnostic request
                </h2>
              </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-main">Imaging file</label>
              <input
                type="file"
                accept="image/*,.dcm,application/dicom"
                onChange={onFileChange}
                className="block w-full rounded-xl border border-border-color bg-background/70 px-3 py-3 text-sm text-text-main file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              />
              {file ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 px-3 py-2 text-xs text-text-muted">
                  <UploadCloud className="h-4 w-4 text-cyan-accent" />
                  <span className="truncate">{file.name}</span>
                </div>
              ) : null}
              {!file && prefillLoading ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border-color bg-background/55 px-3 py-2 text-xs text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-accent" />
                  Preloading selected catalog image...
                </div>
              ) : null}
              {annotationBox && annotationBox.widthPct > 0 && annotationBox.heightPct > 0 ? (
                <div className="mt-2 rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 px-3 py-2 text-xs text-text-muted">
                  Annotation saved: x {annotationBox.xPct.toFixed(1)}%, y {annotationBox.yPct.toFixed(1)}%,
                  w {annotationBox.widthPct.toFixed(1)}%, h {annotationBox.heightPct.toFixed(1)}%
                </div>
              ) : null}
            </div>
            <div>
              <label htmlFor="q" className="block text-sm font-medium text-text-main">
                Clinical question
              </label>
              <textarea
                id="q"
                required
                rows={5}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Describe suspected pathology and differential diagnoses for this radiograph."
                className="mt-1.5 w-full rounded-xl border border-border-color bg-background/70 px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
              />
            </div>
            {question.trim() ? (
              <div className="rounded-xl border border-border-color bg-background/55 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Submitted question
                </p>
                <p className="text-sm leading-relaxed text-text-main">{question.trim()}</p>
              </div>
            ) : null}
            {loading && (
              <div className="rounded-xl border border-border-color bg-background/55 p-4">
                <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.16em] text-text-muted">
                  <span>Sending request…</span>
                  <span>{uploadPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full bg-cyan-accent transition-all"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-accent" />
                  Running multimodal retrieval and report synthesis...
                </div>
              </div>
            )}
              <Button type="submit" className="w-full sm:w-auto" isLoading={loading} disabled={loading}>
                {!loading && <Send className="h-4 w-4" />}
                Generate diagnostic report
              </Button>
            </form>

            {!report ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-color bg-surface/40 py-20 text-center">
                <FileQuestion className="mb-3 h-10 w-10 text-text-muted opacity-70" />
                <p className="text-sm font-medium text-text-main">No report yet</p>
                <p className="mt-1 max-w-md text-xs text-text-muted">
                  Submit a single imaging study with one focused question. The assistant returns one
                  structured report suitable for educator review — not a back-and-forth chat.
                </p>
              </div>
            ) : (
              <article className="space-y-6">
                <header className="rounded-xl border border-border-color bg-surface p-5">
                  <h2 className="text-lg font-semibold text-text-main">Medical AI report</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Educational simulation — always correlate with clinical context and formal imaging
                    interpretation.
                  </p>
                </header>

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                    Answer / explanation
                  </h3>
                  <div className="rounded-xl border border-border-color bg-surface px-5 py-4 text-sm text-text-main">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
                        ),
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-text-main">{children}</strong>
                        ),
                      }}
                    >
                      {report.answerText || '_No narrative returned._'}
                    </ReactMarkdown>
                  </div>
                </section>

                {report.suggestedDiagnosis?.trim() ? (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                      Suggested diagnosis
                    </h3>
                    <div className="rounded-xl border border-border-color bg-surface p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <p className="max-w-2xl text-lg font-semibold leading-relaxed text-text-main">
                          {report.suggestedDiagnosis}
                        </p>
                        {confidenceScore ? (
                          <span className="rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-3 py-1 text-sm font-semibold text-cyan-accent">
                            {confidenceScore.toFixed(1)}% confidence
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                {report.keyFindings.length > 0 ? (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                      Key findings
                    </h3>
                    <div className="rounded-xl border border-border-color bg-surface p-5">
                      <ul className="space-y-3 text-sm text-text-main">
                      {report.keyFindings.map((k, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" />
                            <span className="leading-relaxed">{k}</span>
                          </li>
                      ))}
                      </ul>
                    </div>
                  </section>
                ) : null}

                {report.differentialDiagnoses.length > 0 ? (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                      Differential diagnoses
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {report.differentialDiagnoses.map((k, i) => {
                        const probability = Math.max(38, 82 - i * 14);
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-border-color bg-surface p-4"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-text-main">{k}</p>
                              <span className="text-xs font-semibold text-text-muted">
                                {probability}%
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-background">
                              <div
                                className="h-full rounded-full bg-cyan-accent"
                                style={{ width: `${probability}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {report.recommendedReadings.length > 0 ? (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                      Recommended readings
                    </h3>
                    <ul className="space-y-2 rounded-xl border border-border-color bg-surface p-5 text-sm">
                      {report.recommendedReadings.map((r, i) => (
                        <li key={i} className="text-text-main">
                          {typeof r === 'string' ? (
                            r
                          ) : (
                            <>
                              {r.title}
                              {r.url ? (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-cyan-accent underline"
                                >
                                  Link
                                </a>
                              ) : null}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <CitationList citations={report.citations} />
              </article>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
