'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationList } from '@/components/shared/CitationList';
import Header from '@/components/Header';
import { markdownExternalLinkComponents } from '@/components/shared/markdownExternalLinks';
import { DynamicProgressTracker } from '@/components/shared/DynamicProgressTracker';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import { AlertTriangle, Loader2, MessageCircle, Send, UploadCloud } from 'lucide-react';

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
import { postStudentVisualQa, requestStudentVisualQaReview } from '@/lib/api/student-visual-qa';
import type {
  NormalizedImageBoundingBox,
  NormalizedPolygonPoint,
  VisualQaSessionReport,
  VisualQaTurn,
} from '@/lib/api/types';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';
import { looksLikeAiFallbackAnswer } from '@/lib/utils/ai-fallback-message';
import { isAiModelOverloadError } from '@/lib/utils/ai-overload-error';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { useAuth } from '@/lib/useAuth';

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
const MAX_SESSION_TURNS = 3;
const DRAFT_TTL_MS = 10_800_000;

function turnToReport(turn: VisualQaTurn | null): null | {
  answerText: string;
  suggestedDiagnosis: string;
  keyFindings: string[];
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
  differentialDiagnoses: string[];
  recommendedReadings: Array<{ title?: string; url?: string } | string>;
  citations: Array<{ documentUrl?: string; chunkOrder?: number; title?: string }>;
  aiConfidenceScore?: number;
} {
  if (!turn) return null;
  return {
    answerText: turn.answerText,
    suggestedDiagnosis: turn.suggestedDiagnosis,
    keyFindings: turn.keyFindings,
    keyImagingFindings: turn.keyImagingFindings ?? null,
    reflectiveQuestions: turn.reflectiveQuestions ?? null,
    differentialDiagnoses: turn.differentialDiagnoses,
    recommendedReadings: turn.recommendedReadings,
    citations: turn.citations,
    aiConfidenceScore: turn.aiConfidenceScore,
  };
}

export default function StudentVisualQaImagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  /** `upload` = multipart upload in progress; `analyzing` = bytes sent, waiting on model + server. */
  const [loadingPhase, setLoadingPhase] = useState<'upload' | 'analyzing'>('upload');
  const [uploadPct, setUploadPct] = useState(0);
  const [session, setSession] = useState<VisualQaSessionReport | null>(null);
  const [chatTurns, setChatTurns] = useState<VisualQaTurn[]>([]);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [aiOverload, setAiOverload] = useState(false);
  const [roiBoundingBox, setRoiBoundingBox] = useState<NormalizedImageBoundingBox | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [hydratingDraft, setHydratingDraft] = useState(true);
  /** Synchronous guard against double-submit before React applies `loading`. */
  const isSubmittingRef = useRef(false);
  /** Remount file input on New Chat so the native picker and preview fully reset. */
  const [fileInputKey, setFileInputKey] = useState(0);
  const [requestingLecturerReview, setRequestingLecturerReview] = useState(false);
  const [serverForcedExpired, setServerForcedExpired] = useState(false);
  const [draft, setDraft, clearDraft] = useLocalStorageState<VisualQaDraft>(
    'student-visual-qa-draft',
    EMPTY_DRAFT,
    { ttlMs: DRAFT_TTL_MS },
  );

  const catalogImageUrl = searchParams.get('catalogImageUrl');
  const catalogTitle = searchParams.get('catalogTitle');
  const catalogContext = searchParams.get('catalogContext');
  const historySessionId = searchParams.get('sessionId') ?? searchParams.get('historySessionId');
  const catalogCaseId =
    searchParams.get('catalogCaseId') ??
    searchParams.get('caseId') ??
    searchParams.get('catalogCaseID');
  const catalogImageId =
    searchParams.get('catalogImageId') ??
    searchParams.get('imageId') ??
    searchParams.get('catalogImageID');

  const { trigger: askVisualQa } = useSWRMutation(
    'student-visual-qa-session-ask',
    async (
      _key,
      {
        arg,
      }: {
        arg: {
          file?: File | null;
          questionText: string;
          sessionId?: string | null;
          caseId?: string | null;
          imageId?: string | null;
          roiBoundingBox?: NormalizedImageBoundingBox | null;
        };
      },
    ) =>
      postStudentVisualQa(arg.file, arg.questionText, {
        sessionId: arg.sessionId,
        caseId: arg.caseId,
        imageId: arg.imageId,
        roiBoundingBox: arg.roiBoundingBox,
        onUploadProgress: handleUploadProgress,
      }),
  );

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
      setSession(null);
      setChatTurns([]);
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
    if (isSubmittingRef.current) return;
    if (isSessionInteractionLocked) {
      toast.info(
        isExpired
          ? 'Phiên hỏi đáp đã hết hạn. Vui lòng tạo phiên mới.'
          : 'Bạn đã đạt giới hạn 3 câu hỏi.',
      );
      return;
    }
    const requiresFile = !isOngoingSession;
    if ((requiresFile && !file) || !question.trim()) {
      if (requiresFile && !file) setImageError('Please attach an image before submitting.');
      if (!question.trim()) setQuestionError('Please enter your question or observations.');
      return;
    }
    if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Image must be smaller than 5MB.');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const q = question.trim();
    setImageError(null);
    setQuestionError(null);
    setNetworkWarning(null);
    setAiOverload(false);
    setLoading(true);
    setLoadingPhase(file ? 'upload' : 'analyzing');
    setUploadPct(0);
    let overloadExit = false;
    try {
      const res = await askVisualQa({
        file,
        questionText: q,
        sessionId: session?.sessionId ?? null,
        caseId: catalogCaseId,
        imageId: catalogImageId,
        roiBoundingBox,
      });
      const mergedTurns =
        res.turns.length > 0
          ? res.turns
          : [
              {
                turnIndex: (chatTurns[chatTurns.length - 1]?.turnIndex ?? 0) + 1,
                questionText: q,
                answerText: res.latest?.answerText ?? '',
                suggestedDiagnosis: res.latest?.suggestedDiagnosis ?? '',
                keyFindings: res.latest?.keyFindings ?? [],
                keyImagingFindings: res.latest?.keyImagingFindings ?? null,
                reflectiveQuestions: res.latest?.reflectiveQuestions ?? null,
                differentialDiagnoses: res.latest?.differentialDiagnoses ?? [],
                recommendedReadings: res.latest?.recommendedReadings ?? [],
                citations: res.latest?.citations ?? [],
                aiConfidenceScore: res.latest?.aiConfidenceScore,
                createdAt: new Date().toISOString(),
              },
            ];
      setSession(res);
      const finalTurns = mergedTurns.slice(-MAX_SESSION_TURNS);
      setChatTurns(finalTurns);
      setSelectedTurnIndex(finalTurns[finalTurns.length - 1]?.turnIndex ?? null);
      setRoiBoundingBox(null);
      toast.success('Diagnostic report generated.');
      clearDraft();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errCode = (
          err.response?.data as { errorCode?: string; code?: string } | undefined
        )?.errorCode;
        if (errCode === 'AI_SERVICE_UNAVAILABLE' || err.response?.status === 503) {
          toast.info('Hệ thống AI đang bận hoặc quá tải. Lượt hỏi của bạn chưa bị trừ, vui lòng thử lại sau giây lát.');
          return;
        }
        if (errCode === 'INTERNAL_SERVER_ERROR' || err.response?.status === 500) {
          toast.error('Hệ thống gặp sự cố xử lý. File của bạn đã được dọn dẹp an toàn. Vui lòng thử lại.');
          return;
        }
        if (errCode === 'SESSION_EXPIRED') {
          setServerForcedExpired(true);
          toast.info('Phiên hỏi đáp đã hết hạn. Vui lòng tạo phiên mới.');
          return;
        }
        if (errCode === 'TURN_LIMIT_EXCEEDED') {
          toast.info('Bạn đã đạt giới hạn 3 câu hỏi.');
          return;
        }
      }
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        toast.info('Bạn thao tác quá nhanh. Vui lòng đợi khoảng 1 phút trước khi tiếp tục gửi câu hỏi.');
        return;
      }
      if (axios.isAxiosError(err)) {
        const code =
          (err.response?.data as { code?: string; errorCode?: string; title?: string } | undefined)
            ?.code ??
          (err.response?.data as { code?: string; errorCode?: string; title?: string } | undefined)
            ?.errorCode ??
          (err.response?.data as { code?: string; errorCode?: string; title?: string } | undefined)
            ?.title;
        if (typeof code === 'string' && code.toUpperCase().includes('INVALID_IMAGE_NOT_XRAY')) {
          toast.error('Image rejected: Only Human Bone X-Rays are supported.');
          setImageError('Image rejected: Only Human Bone X-Rays are supported.');
          return;
        }
      }
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
      isSubmittingRef.current = false;
      if (!overloadExit) {
        setLoading(false);
        setUploadPct(0);
        setLoadingPhase('upload');
      }
    }
  };

  const selectedTurn = useMemo(
    () =>
      selectedTurnIndex != null
        ? chatTurns.find((t) => t.turnIndex === selectedTurnIndex) ?? null
        : session?.latest ?? null,
    [chatTurns, selectedTurnIndex, session],
  );
  const report = useMemo(() => turnToReport(selectedTurn), [selectedTurn]);
  const viewerAnnotation = useMemo(
    () =>
      selectedTurn?.roiBoundingBox && isValidNormalizedBoundingBox(selectedTurn.roiBoundingBox)
        ? selectedTurn.roiBoundingBox
        : roiBoundingBox,
    [roiBoundingBox, selectedTurn],
  );
  const userMessageCountFromSession =
    session?.messages?.filter((message) => (message.role ?? '').toLowerCase() === 'user').length ??
    0;
  const isLimitReached =
    userMessageCountFromSession >= MAX_SESSION_TURNS || chatTurns.length >= MAX_SESSION_TURNS;
  const isExpired = session?.updatedAt
    ? new Date().getTime() - new Date(session.updatedAt).getTime() > 24 * 60 * 60 * 1000
    : false;
  const isSessionInteractionLocked = isLimitReached || isExpired || serverForcedExpired;
  const composerPlaceholder = isExpired
    ? 'Phiên chat đã hết hạn (quá 24 giờ).'
    : isLimitReached
      ? 'Phiên chat đã đạt giới hạn 3 câu hỏi.'
      : 'Bạn muốn hỏi gì về hình ảnh này? (What do you want to know about this image?)';
  const isOngoingSession = Boolean(session) && chatTurns.length > 0;
  const lastSessionMessage = session?.messages?.[session.messages.length - 1];
  const lastSessionRole = (lastSessionMessage?.role ?? '').toLowerCase();
  const statusKey = (session?.status ?? '').toLowerCase();
  const hasReviewerFeedback = chatTurns.some((turn) =>
    (turn.messages ?? []).some((message) => {
      const role = (message.role ?? '').toLowerCase();
      return role === 'expert' || role === 'lecturer';
    }),
  );
  const isReadOnlyMode =
    Boolean(historySessionId?.trim()) ||
    (Boolean(session?.status) && statusKey !== 'active') ||
    hasReviewerFeedback;
  const canRequestReview =
    Boolean(session?.sessionId) &&
    !isExpired &&
    !serverForcedExpired &&
    statusKey !== 'pendingexpertreview' &&
    statusKey !== 'escalatedtoexpert' &&
    lastSessionRole !== 'expert' &&
    lastSessionRole !== 'lecturer';
  const isGuestUser = useMemo(() => {
    const active = user?.activeRole?.toLowerCase() ?? '';
    const roles = (user?.roles ?? []).map((r) => r.toLowerCase());
    const status = (user?.status ?? '').toLowerCase();
    return active === 'guest' || roles.includes('guest') || status === 'guest';
  }, [user]);

  const startNewSession = useCallback(() => {
    setSession(null);
    setChatTurns([]);
    setSelectedTurnIndex(null);
    setQuestion('');
    setFile(null);
    setFileInputKey((k) => k + 1);
    setRoiBoundingBox(null);
    setNetworkWarning(null);
    setAiOverload(false);
    setImageError(null);
    setQuestionError(null);
    setUploadPct(0);
    setLoadingPhase('upload');
    setRequestingLecturerReview(false);
    setServerForcedExpired(false);
    clearDraft();
    toast.info('New chat started. Choose an image and ask a question.');
  }, [clearDraft, toast]);

  const handleRequestLecturerReview = useCallback(async () => {
    if (!session?.sessionId || requestingLecturerReview) return;
    setRequestingLecturerReview(true);
    try {
      const updated = await requestStudentVisualQaReview(session.sessionId);
      setSession((prev) => ({
        ...(prev ?? session),
        ...updated,
        status: updated.status ?? 'PendingExpertReview',
      }));
      if (updated.turns.length > 0) {
        setChatTurns(updated.turns.slice(-MAX_SESSION_TURNS));
      }
      toast.success('Đã gửi yêu cầu hỗ trợ tới giảng viên.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.info('Phiên này đã được gửi để giảng viên xem xét.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Could not request lecturer support.');
      }
    } finally {
      setRequestingLecturerReview(false);
    }
  }, [requestingLecturerReview, session, toast]);

  useEffect(() => {
    if (!isGuestUser) return;
    toast.error('Guest access blocked. Waiting for admin approval.');
    router.replace('/pending-approval');
  }, [isGuestUser, router, toast]);

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

  if (isGuestUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <h1 className="text-xl font-semibold text-destructive">Access restricted</h1>
          <p className="mt-2 text-sm text-foreground/90">
            Guest accounts cannot access Visual QA. Please wait for admin approval.
          </p>
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={() => router.replace('/pending-approval')}>
              Go to approval status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-text-main">
      <Header
        title="Visual QA"
        subtitle="Mark a region on the image, then chat with the AI about what you see."
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2 lg:items-start">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-border-color lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] lg:min-h-0 lg:self-start lg:border-b-0 lg:border-r">
          <div className="min-h-0 min-h-[40vh] flex-1 overflow-y-auto custom-scrollbar lg:min-h-0">
            <MedicalImageViewer
              key={hydratingDraft ? 'hydrating' : (previewUrl ?? 'no-preview')}
              src={previewUrl}
              alt="Study image for diagnostic request"
              initialAnnotation={hydratingDraft ? undefined : (viewerAnnotation ?? undefined)}
              onAnnotationComplete={setRoiBoundingBox}
            />
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-hidden bg-background p-4 md:p-6">
          <div className="mx-auto flex h-full max-w-4xl min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3 md:px-5">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate">Conversation</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 transition-all hover:opacity-90 active:scale-95"
                onClick={startNewSession}
              >
                New Chat
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 custom-scrollbar md:px-5">
              {networkWarning ? (
                <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <p>{networkWarning}</p>
                  </div>
                </div>
              ) : null}
              {aiOverload ? (
                <div className="mb-4 rounded-xl border border-sky-400/45 bg-sky-500/15 px-4 py-4 text-sm text-sky-50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <p className="font-medium text-sky-100">
                        The AI system is experiencing high traffic. Please try again in a few minutes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiOverload(false)}
                      className="shrink-0 rounded-lg border border-sky-400/40 bg-sky-950/30 px-3 py-1.5 text-xs font-medium text-sky-100 transition-all hover:opacity-80 active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}
              {chatTurns.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">No messages yet</p>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    Add an image (first message), draw a region if you like, then ask the AI. You can send up to three
                    questions per session.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-5">
                    {chatTurns.map((turn) => {
                      const isActive = selectedTurnIndex === turn.turnIndex;
                      const normalizedMessages = (turn.messages ?? [])
                        .filter((message) => message.content?.trim())
                        .map((message, idx) => ({
                          id: `${turn.turnIndex}-m-${idx}`,
                          role: (message.role ?? '').toLowerCase(),
                          content: message.content.trim(),
                        }));
                      const reviewerNotes = normalizedMessages.filter(
                        (message) => message.role === 'lecturer' || message.role === 'expert',
                      );
                      const baseMessages = normalizedMessages.filter(
                        (message) => message.role !== 'lecturer' && message.role !== 'expert',
                      );
                      const renderFromMessages = normalizedMessages.length > 0;
                      return (
                        <button
                          key={`${turn.turnIndex}-${turn.createdAt ?? ''}`}
                          type="button"
                          className={`w-full rounded-xl text-left outline-none transition-colors ${
                            isActive ? 'ring-2 ring-primary/35 ring-offset-2 ring-offset-background' : ''
                          }`}
                          onClick={() => setSelectedTurnIndex(turn.turnIndex)}
                        >
                          {renderFromMessages ? (
                            <div className="space-y-2">
                              {baseMessages.map((message) => {
                                const isStudentMessage = message.role === 'student';
                                return (
                                  <div
                                    key={message.id}
                                    className={`flex ${isStudentMessage ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-[92%] rounded-2xl border px-4 py-2.5 text-sm leading-relaxed ${
                                        isStudentMessage
                                          ? 'border-border/80 bg-muted/60 text-foreground shadow-sm'
                                          : 'border-border/60 bg-blue-50/80 text-foreground dark:border-border dark:bg-blue-950/40'
                                      }`}
                                    >
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                          ...markdownExternalLinkComponents,
                                          p: ({ children }) => (
                                            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                          ),
                                        }}
                                      >
                                        {message.content}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                );
                              })}
                              {reviewerNotes.length > 0 ? (
                                <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Instructor async feedback notes
                                  </p>
                                  {reviewerNotes.map((message) => {
                                    const isExpertNote = message.role === 'expert';
                                    return (
                                      <div
                                        key={message.id}
                                        className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                                          isExpertNote
                                            ? 'border-emerald-400/60 bg-emerald-500/10'
                                            : 'border-orange-400/60 bg-orange-500/10'
                                        }`}
                                      >
                                        <p
                                          className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
                                            isExpertNote
                                              ? 'text-emerald-700 dark:text-emerald-300'
                                              : 'text-orange-700 dark:text-orange-300'
                                          }`}
                                        >
                                          {isExpertNote ? 'Chuyên gia phản hồi' : 'Giảng viên phản hồi'}
                                        </p>
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          components={{
                                            ...markdownExternalLinkComponents,
                                            p: ({ children }) => (
                                              <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                            ),
                                          }}
                                        >
                                          {message.content}
                                        </ReactMarkdown>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-end">
                                <div className="max-w-[92%] rounded-2xl border border-border/80 bg-muted/60 px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
                                  {turn.questionText?.trim() || '—'}
                                </div>
                              </div>
                              <div className="mt-2 flex justify-start">
                                <div className="max-w-[92%] rounded-2xl border border-border/60 bg-blue-50/80 px-4 py-3 text-sm leading-relaxed text-foreground dark:border-border dark:bg-blue-950/40">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      ...markdownExternalLinkComponents,
                                      p: ({ children }) => (
                                        <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                                      ),
                                    }}
                                  >
                                    {turn.answerText?.trim() || '_—_'}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {session?.sessionId && canRequestReview ? (
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleRequestLecturerReview()}
                        disabled={requestingLecturerReview}
                        className="transition-all hover:opacity-80 active:scale-95"
                      >
                        {requestingLecturerReview ? 'Đang gửi yêu cầu...' : 'Yêu cầu Chuyên gia hỗ trợ'}
                      </Button>
                    </div>
                  ) : null}
                  {report ? (
                    <div className="space-y-3 border-t border-border/60 pt-4">
                      {looksLikeAiFallbackAnswer(report.answerText) ? (
                        <div
                          className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
                          role="status"
                        >
                          <p className="font-medium">Assistant could not return a full clinical analysis</p>
                        </div>
                      ) : null}
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sources</p>
                      <CitationList citations={report.citations} />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {!isReadOnlyMode ? (
              <form onSubmit={handleSubmit} className="shrink-0 border-t border-border/60 bg-card p-4">
                <div>
                  {!isOngoingSession && !isSessionInteractionLocked ? (
                    <>
                      <label className="mb-1.5 block text-sm font-medium text-text-main">Imaging file</label>
                      <input
                        key={fileInputKey}
                        type="file"
                        accept="image/*,.dcm,application/dicom"
                        onChange={onFileChange}
                        className="block w-full rounded-xl border border-border-color bg-background/70 px-3 py-3 text-sm text-text-main file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:transition-all file:hover:opacity-80 file:active:scale-95"
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
                    </>
                  ) : null}
                {roiBoundingBox && isValidNormalizedBoundingBox(roiBoundingBox) ? (
                  <div className="mt-2 rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 px-3 py-2 text-xs text-text-muted">
                    Rectangle ROI saved: x {roiBoundingBox.x.toFixed(3)}, y {roiBoundingBox.y.toFixed(3)}, w{' '}
                    {roiBoundingBox.width.toFixed(3)}, h {roiBoundingBox.height.toFixed(3)} (normalized 0–1)
                  </div>
                ) : null}
                </div>
                <label htmlFor="q" className="mt-3 block text-sm font-medium text-text-main">
                  Message
                </label>
                <textarea
                  id="q"
                  required
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isSessionInteractionLocked}
                  placeholder={composerPlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-border-color bg-background/70 px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70 disabled:opacity-70"
                />
                {questionError ? <p className="mt-2 text-xs text-destructive">{questionError}</p> : null}
                {isSessionInteractionLocked ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isExpired ? (
                      <>
                        Phiên chat đã hết hạn. Tap <span className="font-medium text-foreground">New Chat</span> để tiếp tục.
                      </>
                    ) : (
                      <>
                        Session depth reached. Tap <span className="font-medium text-foreground">New Chat</span> to continue.
                      </>
                    )}
                  </p>
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
                  <DynamicProgressTracker
                    mode="indeterminate"
                    label="AI thinking"
                    messages={['Đang tìm kiếm trong tài liệu và thư viện ca lâm sàng...']}
                    className="mt-3"
                  />
                ) : null}
                <Button
                  type="submit"
                  className="mt-3 w-full sm:w-auto transition-all hover:opacity-80 active:scale-95"
                  disabled={loading || isSessionInteractionLocked}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  {isSessionInteractionLocked ? 'Session locked' : 'Ask AI'}
                </Button>
              </form>
            ) : (
              <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
                Đây là phiên hỏi đáp trong lịch sử. Khung chat đã được đóng.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
