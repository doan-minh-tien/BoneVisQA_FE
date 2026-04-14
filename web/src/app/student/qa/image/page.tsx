'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationList } from '@/components/shared/CitationList';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import { DynamicProgressTracker } from '@/components/shared/DynamicProgressTracker';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  FileQuestion,
  Loader2,
  Send,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

const MedicalImageViewer = dynamic(
  () =>
    import('@/components/student/MedicalImageViewer').then((m) => ({
      default: m.MedicalImageViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <PageLoadingSkeleton className="flex min-h-[520px] flex-col bg-black">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8" aria-busy="true">
          <SkeletonBlock className="h-12 w-12 rounded-full opacity-40" />
          <SkeletonBlock className="h-4 w-48 max-w-[80%]" />
          <SkeletonBlock className="h-3 w-64 max-w-[90%] opacity-70" />
          <div className="mt-6 w-full max-w-md space-y-2 px-4">
            <SkeletonBlock className="h-40 w-full rounded-lg" />
            <div className="flex justify-center gap-2 pt-4">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <SkeletonBlock className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest text-text-muted">
            Loading radiograph viewer…
          </p>
        </div>
      </PageLoadingSkeleton>
    ),
  },
);
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { postStudentVisualQa } from '@/lib/api/student-visual-qa';
import type { NormalizedImageBoundingBox, NormalizedPolygonPoint, VisualQaReport } from '@/lib/api/types';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';
import { splitLearningBullets } from '@/lib/utils/learning-text';
import { looksLikeAiFallbackAnswer } from '@/lib/utils/ai-fallback-message';
import { isAiModelOverloadError } from '@/lib/utils/ai-overload-error';
import { useLocalStorageState } from '@/lib/useLocalStorageState';

type VisualQaDraft = {
  question: string;
  customBoundingBox: NormalizedImageBoundingBox | null;
  /** Legacy drafts (polygon vertices) — migrated once on load. */
  customPolygon?: NormalizedPolygonPoint[] | null;
  imageDataUrl: string | null;
  imageName: string | null;
  imageType: string | null;
};

const EMPTY_DRAFT: VisualQaDraft = {
  question: '',
  customBoundingBox: null,
  imageDataUrl: null,
  imageName: null,
  imageType: null,
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export default function StudentVisualQaImagePage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  /** `upload` = multipart upload in progress; `analyzing` = bytes sent, waiting on model + server. */
  const [loadingPhase, setLoadingPhase] = useState<'upload' | 'analyzing'>('upload');
  const [uploadPct, setUploadPct] = useState(0);
  const [report, setReport] = useState<VisualQaReport | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [aiOverload, setAiOverload] = useState(false);
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState<string | null>(null);
  const [roiBoundingBox, setRoiBoundingBox] = useState<NormalizedImageBoundingBox | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [hydratingDraft, setHydratingDraft] = useState(true);
  const [draft, setDraft, clearDraft] = useLocalStorageState<VisualQaDraft>(
    'student-visual-qa-draft',
    EMPTY_DRAFT,
  );

  const catalogImageUrl = searchParams.get('catalogImageUrl');
  const catalogTitle = searchParams.get('catalogTitle');
  const catalogContext = searchParams.get('catalogContext');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (draft.question) setQuestion(draft.question);
      if (draft.customBoundingBox && isValidNormalizedBoundingBox(draft.customBoundingBox)) {
        setRoiBoundingBox(draft.customBoundingBox);
      } else if (draft.customPolygon && draft.customPolygon.length >= 3) {
        const xs = draft.customPolygon.map((p) => p.x);
        const ys = draft.customPolygon.map((p) => p.y);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - x;
        const height = Math.max(...ys) - y;
        if (width > 0.008 && height > 0.008 && x + width <= 1.01 && y + height <= 1.01) {
          setRoiBoundingBox({ x, y, width, height });
        }
      }
      if (draft.imageDataUrl && draft.imageName) {
        try {
          const response = await fetch(draft.imageDataUrl);
          const blob = await response.blob();
          if (!cancelled) {
            setFile(new File([blob], draft.imageName, { type: draft.imageType || blob.type || 'image/jpeg' }));
          }
        } catch {
          if (!cancelled) {
            setDraft((prev) => ({ ...prev, imageDataUrl: null, imageName: null, imageType: null }));
          }
        }
      }
      if (!cancelled) setHydratingDraft(false);
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (!catalogContext) return;
    if (question.trim()) return;
    setQuestion(`Please analyze this teaching case: ${catalogContext}.`);
  }, [catalogContext, question]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        setFile(null);
        setImageError('Image must be smaller than 5MB.');
        return;
      }
      setImageError(null);
      setQuestionError(null);
      setReport(null);
      setLastSubmittedQuestion(null);
      setAiOverload(false);
      setFile(f);
      setRoiBoundingBox(null);
    },
    [],
  );

  const handleUploadProgress = useCallback((pct: number) => {
    setUploadPct(pct);
    if (pct >= 100) setLoadingPhase('analyzing');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !question.trim()) {
      if (!file) setImageError('Please attach an image before submitting.');
      if (!question.trim()) setQuestionError('Please enter your question or observations.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Image must be smaller than 5MB.');
      return;
    }
    const q = question.trim();
    setImageError(null);
    setQuestionError(null);
    setNetworkWarning(null);
    setAiOverload(false);
    setLoading(true);
    setLoadingPhase('upload');
    setUploadPct(0);
    setReport(null);
    let overloadExit = false;
    try {
      const res = await postStudentVisualQa(file, q, roiBoundingBox, handleUploadProgress);
      setLastSubmittedQuestion(q);
      setReport(res);
      toast.success('Diagnostic report generated.');
      clearDraft();
    } catch (err) {
      if (isAiModelOverloadError(err)) {
        overloadExit = true;
        setAiOverload(true);
        setLoading(false);
        setUploadPct(0);
        setLoadingPhase('upload');
        return;
      }
      if (axios.isAxiosError(err)) {
        const isNetworkDrop = !err.response;
        const isTimeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message ?? '');
        if (isNetworkDrop || isTimeout) {
          const warning =
            'Network connection lost. The AI is still processing your request on the server. Please check your History tab in a few minutes to see the result.';
          setNetworkWarning(warning);
          toast.info('Connection interrupted. You can continue safely and check History shortly.');
        } else {
          const maybeData = err.response?.data;
          const apiMessage =
            typeof maybeData === 'string'
              ? maybeData
              : maybeData && typeof maybeData === 'object' && 'message' in maybeData
                ? String((maybeData as { message?: unknown }).message ?? '')
                : '';
          toast.error(apiMessage || err.message || 'Request failed');
        }
      } else {
        toast.error(err instanceof Error ? err.message : 'Request failed');
      }
    } finally {
      if (!overloadExit) {
        setLoading(false);
        setUploadPct(0);
        setLoadingPhase('upload');
      }
    }
  };

  const displayedQuestion = useMemo(() => {
    if (!report) return '';
    const fromApi = report.questionText?.trim();
    if (fromApi) return fromApi;
    return lastSubmittedQuestion?.trim() ?? '';
  }, [report, lastSubmittedQuestion]);

  useEffect(() => {
    if (hydratingDraft) return;
    setDraft((prev) => ({ ...prev, question }));
  }, [hydratingDraft, question, setDraft]);

  useEffect(() => {
    if (hydratingDraft) return;
    setDraft((prev) => ({ ...prev, customBoundingBox: roiBoundingBox, customPolygon: undefined }));
  }, [roiBoundingBox, hydratingDraft, setDraft]);

  useEffect(() => {
    if (hydratingDraft || !file) return;
    if (draft.imageName === file.name && draft.imageDataUrl) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : null;
      setDraft((prev) => ({
        ...prev,
        imageDataUrl,
        imageName: file.name,
        imageType: file.type || 'image/jpeg',
      }));
    };
    reader.readAsDataURL(file);
  }, [draft.imageDataUrl, draft.imageName, file, hydratingDraft, setDraft]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-text-main">
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

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-border-color lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="min-h-0 min-h-[40vh] flex-1 overflow-y-auto custom-scrollbar lg:min-h-0">
            <MedicalImageViewer
              key={hydratingDraft ? 'hydrating' : (previewUrl ?? 'no-preview')}
              src={previewUrl}
              alt="Study image for diagnostic request"
              initialAnnotation={hydratingDraft ? undefined : (roiBoundingBox ?? undefined)}
              onAnnotationComplete={setRoiBoundingBox}
            />
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-background p-5 md:p-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-xl border border-border-color bg-surface p-5 shadow-panel"
            >
              {networkWarning ? (
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <p>{networkWarning}</p>
                  </div>
                </div>
              ) : null}
              {aiOverload ? (
                <div className="rounded-xl border border-sky-400/45 bg-sky-500/15 px-4 py-4 text-sm text-sky-50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <div>
                        <p className="font-medium text-sky-100">
                          Hệ thống AI hiện đang xử lý quá nhiều yêu cầu. Vui lòng đợi ít phút và gửi lại câu hỏi.
                        </p>
                        <p className="mt-1 text-xs text-sky-200/90">
                          The AI system is experiencing high traffic. Please try again in a few minutes.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiOverload(false)}
                      className="shrink-0 rounded-lg border border-sky-400/40 bg-sky-950/30 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-950/50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : null}
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
              {imageError ? <p className="mt-2 text-xs text-destructive">{imageError}</p> : null}
              {file ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 px-3 py-2 text-xs text-text-muted">
                  <UploadCloud className="h-4 w-4 text-cyan-accent" />
                  <span className="truncate">{file.name}</span>
                </div>
              ) : null}
              {hydratingDraft ? (
                <div className="mt-2 text-xs text-text-muted">Restoring your unsent draft...</div>
              ) : null}
              {!file && prefillLoading ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-border-color bg-background/55 px-3 py-2 text-xs text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-accent" />
                  Preloading selected catalog image...
                </div>
              ) : null}
              {roiBoundingBox && isValidNormalizedBoundingBox(roiBoundingBox) ? (
                <div className="mt-2 rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 px-3 py-2 text-xs text-text-muted">
                  Rectangle ROI saved: x {roiBoundingBox.x.toFixed(3)}, y {roiBoundingBox.y.toFixed(3)}, w{' '}
                  {roiBoundingBox.width.toFixed(3)}, h {roiBoundingBox.height.toFixed(3)} (normalized 0–1)
                </div>
              ) : null}
            </div>
            <div>
              <label htmlFor="q" className="block text-sm font-medium text-text-main">
                Your question / observations
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
              {questionError ? <p className="mt-2 text-xs text-destructive">{questionError}</p> : null}
            </div>
            {question.trim() ? (
              <div className="rounded-xl border border-border-color bg-background/55 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Question preview
                </p>
                <p className="text-sm leading-relaxed text-text-main">{question.trim()}</p>
              </div>
            ) : null}
            {loading && loadingPhase === 'upload' ? (
              <DynamicProgressTracker
                mode="determinate"
                label="Uploading image"
                progressPercentage={uploadPct}
                message="Uploading imaging file..."
              />
            ) : null}
            {loading && loadingPhase === 'analyzing' ? (
              <div className="rounded-xl border border-cyan-accent/25 bg-cyan-accent/5 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-accent" />
                  <p className="text-sm font-medium text-text-main">
                    Analyzing image and reasoning with AI... Please wait.
                  </p>
                </div>
                <DynamicProgressTracker
                  mode="indeterminate"
                  label="AI reasoning"
                  messages={[
                    'Analyzing medical image...',
                    'Searching vector database...',
                    'Generating diagnosis and key findings...',
                  ]}
                />
              </div>
            ) : null}
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
                    Educational use — always correlate with clinical context and formal imaging
                    interpretation.
                  </p>
                </header>

                <section className="rounded-xl border border-cyan-accent/30 bg-gradient-to-br from-cyan-accent/10 to-background p-5">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                    Your original question
                  </h3>
                  <p className="text-sm leading-relaxed text-text-main">
                    {displayedQuestion || (
                      <span className="italic text-text-muted">No question text was returned.</span>
                    )}
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                    Answer / explanation
                  </h3>
                  {looksLikeAiFallbackAnswer(report.answerText) ? (
                    <div
                      className="mb-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
                      role="status"
                    >
                      <p className="font-medium">Assistant could not return a full clinical analysis</p>
                      <p className="mt-1 text-xs opacity-90">
                        The model returned a system-style message (for example an apology or “temporarily unavailable”).
                        This is not a structured diagnosis — retry later or narrow your question.                         If you drew a region of interest, coordinates are sent as a normalized bounding box{' '}
                        <code className="rounded bg-black/30 px-1">{'{ x, y, width, height }'}</code> (0–1).
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-xl border border-border-color bg-surface px-5 py-4 text-sm text-text-main">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        ...markdownExternalLinkComponents,
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
                      {report.answerText?.trim() || '_No narrative returned._'}
                    </ReactMarkdown>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                    Suggested diagnosis
                  </h3>
                  <div className="rounded-xl border-2 border-cyan-accent/40 bg-surface p-5 shadow-[0_0_0_1px_rgba(0,229,255,0.12)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <p className="max-w-2xl text-lg font-semibold leading-relaxed text-text-main">
                        {report.suggestedDiagnosis?.trim() ? (
                          report.suggestedDiagnosis
                        ) : (
                          <span className="text-base font-normal italic text-text-muted">
                            No suggested diagnosis was provided in this response.
                          </span>
                        )}
                      </p>
                      {typeof report.aiConfidenceScore === 'number' &&
                      Number.isFinite(report.aiConfidenceScore) ? (
                        <span className="rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-3 py-1 text-sm font-semibold text-cyan-accent">
                          {report.aiConfidenceScore.toFixed(1)}% confidence
                        </span>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                    Key findings
                  </h3>
                  <div className="rounded-xl border border-border-color bg-surface p-5">
                    {report.keyFindings.length > 0 ? (
                      <ul className="space-y-3 text-sm text-text-main">
                        {report.keyFindings.map((k, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" />
                            <span className="leading-relaxed">{k}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm italic text-text-muted">No key findings listed.</p>
                    )}
                  </div>
                </section>

                {report.keyImagingFindings?.trim() ? (
                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                      Key imaging findings
                    </h3>
                    <div className="rounded-xl border border-cyan-accent/25 bg-surface p-5">
                      <ul className="space-y-2.5 text-sm text-text-main">
                        {splitLearningBullets(report.keyImagingFindings).map((line, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent" />
                            <span className="leading-relaxed">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                ) : null}

                {report.reflectiveQuestions?.trim() ? (
                  <section
                    className="rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/10 to-background p-5 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.2)]"
                    role="note"
                    aria-label="Reflective questions"
                  >
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/90">
                      Reflective questions
                    </h3>
                    <div className="text-sm leading-relaxed text-text-main">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ ...markdownExternalLinkComponents }}
                      >
                        {report.reflectiveQuestions.trim()}
                      </ReactMarkdown>
                    </div>
                  </section>
                ) : null}

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-accent">
                    Differential diagnoses
                  </h3>
                  <div className="space-y-3">
                    {report.differentialDiagnoses.length > 0 ? (
                      <ol className="list-decimal space-y-3 pl-5 text-sm text-text-main marker:font-semibold marker:text-cyan-accent">
                        {report.differentialDiagnoses.map((d, i) => (
                          <li
                            key={i}
                            className="rounded-lg border border-border-color bg-surface/90 py-3 pl-2 pr-4 leading-relaxed"
                          >
                            {d}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="rounded-xl border border-border-color bg-surface p-5 text-sm italic text-text-muted">
                        No differential diagnoses were listed.
                      </div>
                    )}
                  </div>
                </section>

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
