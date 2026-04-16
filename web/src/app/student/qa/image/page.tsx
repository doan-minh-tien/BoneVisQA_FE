'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import Header from '@/components/Header';
import { ChatComposer } from '@/components/student/ChatComposer';
import { ChatConversation } from '@/components/student/ChatConversation';
import { PageLoadingSkeleton, SkeletonBlock } from '@/components/shared/DashboardSkeletons';
import { Loader2, MessageCircle } from 'lucide-react';

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
import {
  fetchStudentVisualQaSession,
  postStudentVisualQa,
  requestStudentVisualQaReview,
} from '@/lib/api/student-visual-qa';
import type {
  NormalizedImageBoundingBox,
  NormalizedPolygonPoint,
  VisualQaSessionReport,
  VisualQaTurn,
} from '@/lib/api/types';
import { isValidNormalizedBoundingBox } from '@/lib/utils/annotations';
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
const DRAFT_TTL_MS = 10_800_000;

type PendingOutgoingMessage = {
  id: string;
  content: string;
  status: 'sending' | 'failed';
};

function turnIdentity(turn: VisualQaTurn): string {
  if (turn.turnId?.trim()) return `turn:${turn.turnId.trim()}`;
  if (turn.clientRequestId?.trim()) return `request:${turn.clientRequestId.trim()}`;
  if (typeof turn.turnIndex === 'number' && Number.isFinite(turn.turnIndex)) return `index:${turn.turnIndex}`;
  return `fallback:${turn.createdAt ?? ''}:${turn.answerText ?? ''}`;
}

function mergeTurnsByIdentity(base: VisualQaTurn[], incoming: VisualQaTurn[]): VisualQaTurn[] {
  const merged = [...base];
  const identityToIndex = new Map<string, number>();
  merged.forEach((turn, idx) => identityToIndex.set(turnIdentity(turn), idx));
  incoming.forEach((turn) => {
    const key = turnIdentity(turn);
    const existingIndex = identityToIndex.get(key);
    if (typeof existingIndex === 'number') {
      merged[existingIndex] = turn;
      return;
    }
    merged.push(turn);
    identityToIndex.set(key, merged.length - 1);
  });
  return merged.sort((a, b) => {
    if (a.turnIndex !== b.turnIndex) return a.turnIndex - b.turnIndex;
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}

export default function StudentVisualQaImagePage() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [chatErrorCode, setChatErrorCode] = useState<string | null>(null);
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);
  const [roiBoundingBox, setRoiBoundingBox] = useState<NormalizedImageBoundingBox | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [hydratingDraft, setHydratingDraft] = useState(true);
  /** Synchronous guard against double-submit before React applies `loading`. */
  const isSubmittingRef = useRef(false);
  /** Remount file input on New Chat so the native picker and preview fully reset. */
  const [fileInputKey, setFileInputKey] = useState(0);
  const bottomFileInputRef = useRef<HTMLInputElement | null>(null);
  const [requestingLecturerReview, setRequestingLecturerReview] = useState(false);
  const [serverForcedExpired, setServerForcedExpired] = useState(false);
  const [pendingOutgoingMessage, setPendingOutgoingMessage] = useState<PendingOutgoingMessage | null>(null);
  const [restoringSession, setRestoringSession] = useState(false);
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
          clientRequestId?: string | null;
        };
      },
    ) =>
      postStudentVisualQa(arg.file, arg.questionText, {
        sessionId: arg.sessionId,
        caseId: arg.caseId,
        imageId: arg.imageId,
        roiBoundingBox: arg.roiBoundingBox,
        clientRequestId: arg.clientRequestId,
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

  useEffect(() => {
    if (!historySessionId?.trim()) return;
    let cancelled = false;
    (async () => {
      setRestoringSession(true);
      try {
        const restored = await fetchStudentVisualQaSession(historySessionId);
        if (cancelled) return;
        setSession(restored);
        setChatTurns(restored.turns);
        setSelectedTurnIndex(restored.latest?.turnIndex ?? restored.turns[restored.turns.length - 1]?.turnIndex ?? null);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not restore the chat session.');
        }
      } finally {
        if (!cancelled) setRestoringSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historySessionId, toast]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (loading || isSubmittingRef.current) {
        toast.info('Please wait for the current AI response before changing the image.');
        return;
      }
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
      setPendingOutgoingMessage(null);
      setFile(f);
      setRoiBoundingBox(null);
    },
    [loading, toast],
  );

  const handleUploadProgress = useCallback((pct: number) => {
    setUploadPct(pct);
    if (pct >= 100) setLoadingPhase('analyzing');
  }, []);

  const submitQuestion = async (questionOverride?: string) => {
    if (isSubmittingRef.current) return;
    if (isSessionInteractionLocked) {
      toast.info(sessionCapabilityReason || 'This chat is read-only for now. Start a new chat to continue.');
      return;
    }
    const requiresFile = !isOngoingSession;
    const nextQuestion =
      (typeof questionOverride === 'string' ? questionOverride : question).trim();
    if ((requiresFile && !file) || !nextQuestion) {
      if (requiresFile && !file) setImageError('Please attach an image before submitting.');
      if (!nextQuestion) setQuestionError('Please enter your question or observations.');
      return;
    }
    if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Image must be smaller than 5MB.');
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const q = nextQuestion;
    const requestId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `client-${Date.now()}`;
    setPendingOutgoingMessage({ id: requestId, content: q, status: 'sending' });
    setImageError(null);
    setQuestionError(null);
    setNetworkWarning(null);
    setAiOverload(false);
    setChatErrorCode(null);
    setChatErrorMessage(null);
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
        clientRequestId: requestId,
      });
      const normalizeTurnsWithLivePayload = (): VisualQaTurn[] => {
        const byServerTurns = res.turns.length > 0 ? mergeTurnsByIdentity(chatTurns, res.turns) : [...chatTurns];
        const latestTurnFromResponse: VisualQaTurn | null =
          res.latest ??
          (res.turns.length === 0
            ? {
                turnId: null,
                turnIndex: (chatTurns[chatTurns.length - 1]?.turnIndex ?? 0) + 1,
                questionText: q,
                ...(res.answerText ? { answerText: res.answerText } : {}),
                diagnosis: res.diagnosis ?? '',
                findings: res.findings ?? [],
                reflectiveQuestions: res.reflectiveQuestions ?? [],
                differentialDiagnoses: res.differentialDiagnoses ?? [],
                citations: res.citations ?? [],
                aiConfidenceScore: undefined,
                createdAt: new Date().toISOString(),
                responseKind: res.responseKind ?? 'analysis',
                clientRequestId: res.clientRequestId ?? requestId,
                reviewState: res.reviewState ?? null,
                lastResponderRole: res.lastResponderRole ?? 'assistant',
                actorRole: 'assistant',
                isReviewTarget: true,
              }
            : null);
        const mergedWithLatest = latestTurnFromResponse
          ? mergeTurnsByIdentity(byServerTurns, [latestTurnFromResponse])
          : byServerTurns;
        const systemNotice = res.systemNotice?.trim();
        if (systemNotice) {
          const hasNotice = mergedWithLatest.some(
            (turn) =>
              turn.responseKind?.toLowerCase() === 'system_notice' &&
              (turn.answerText?.trim() || turn.diagnosis?.trim()) === systemNotice,
          );
          if (!hasNotice) {
            return mergeTurnsByIdentity(mergedWithLatest, [{
              turnId: null,
              turnIndex: (mergedWithLatest[mergedWithLatest.length - 1]?.turnIndex ?? 0) + 1,
              answerText: systemNotice,
              diagnosis: '',
              findings: [],
              reflectiveQuestions: [],
              differentialDiagnoses: [],
              citations: [],
              createdAt: new Date().toISOString(),
              responseKind: 'system_notice',
              actorRole: 'system',
              lastResponderRole: 'system',
              isReviewTarget: false,
            }]);
          }
        }
        return mergedWithLatest;
      };

      const immediateTurns = normalizeTurnsWithLivePayload();
      const immediateLatest = res.latest ?? immediateTurns[immediateTurns.length - 1] ?? null;
      setSession({
        ...res,
        turns: immediateTurns,
        latest: immediateLatest,
      });
      if (res.sessionId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sessionId', res.sessionId);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
      setChatTurns(immediateTurns);
      setSelectedTurnIndex(immediateTurns[immediateTurns.length - 1]?.turnIndex ?? null);
      setPendingOutgoingMessage(null);
      setRoiBoundingBox(null);
      setQuestion('');
      toast.success('Diagnostic report generated.');
      clearDraft();
      if (res.sessionId?.trim()) {
        void (async () => {
          try {
            const restored = await fetchStudentVisualQaSession(res.sessionId);
            setSession((prev) => {
              const mergedTurns = mergeTurnsByIdentity(prev?.turns ?? [], restored.turns);
              return {
                ...restored,
                turns: mergedTurns,
                latest: restored.latest ?? mergedTurns[mergedTurns.length - 1] ?? null,
              };
            });
            setChatTurns((prev) => mergeTurnsByIdentity(prev, restored.turns));
            setSelectedTurnIndex(
              restored.latest?.turnIndex ??
                restored.turns[restored.turns.length - 1]?.turnIndex ??
                null,
            );
          } catch {
            // Keep live response as source of truth if thread reconcile fails.
          }
        })();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errCode =
          (
            err.response?.data as { errorCode?: string; code?: string } | undefined
          )?.errorCode ??
          (
            err.response?.data as { errorCode?: string; code?: string } | undefined
          )?.code ??
          null;
        if (errCode === 'AI_SERVICE_UNAVAILABLE' || err.response?.status === 503) {
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          toast.info('The AI service is currently busy. Your question quota was not consumed; please try again shortly.');
          return;
        }
        if (errCode === 'AI_RESPONSE_INVALID_FORMAT') {
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          setChatErrorCode(errCode);
          setChatErrorMessage('AI returned an invalid format. Try resending or ask a simpler question.');
          toast.error('The AI response could not be rendered safely. Please resend or simplify the question.');
          return;
        }
        if (errCode === 'INTERNAL_SERVER_ERROR' || err.response?.status === 500) {
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          toast.error('A processing error occurred. Your uploaded file was safely cleaned up. Please try again.');
          return;
        }
        if (errCode === 'SESSION_EXPIRED') {
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          setServerForcedExpired(true);
          toast.info('This Q&A session has expired. Please start a new session.');
          return;
        }
        if (errCode === 'SESSION_READ_ONLY') {
          const readOnlyMessage =
            (
              err.response?.data as { message?: string; detail?: string } | undefined
            )?.message?.trim() ||
            (
              err.response?.data as { message?: string; detail?: string } | undefined
            )?.detail?.trim() ||
            'This session is read-only after requesting expert support. Start a new chat to continue.';
          const systemTurn: VisualQaTurn = {
            turnId: null,
            turnIndex: (chatTurns[chatTurns.length - 1]?.turnIndex ?? 0) + 1,
            answerText: readOnlyMessage,
            diagnosis: '',
            findings: [],
            reflectiveQuestions: [],
            differentialDiagnoses: [],
            citations: [],
            createdAt: new Date().toISOString(),
            responseKind: 'system_notice',
            actorRole: 'system',
            lastResponderRole: 'system',
            isReviewTarget: false,
          };
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          setSession((prev) => {
            if (!prev) return prev;
            const mergedTurns = mergeTurnsByIdentity(prev.turns, [systemTurn]);
            return {
              ...prev,
              turns: mergedTurns,
              latest: mergedTurns[mergedTurns.length - 1] ?? prev.latest,
              capabilities: {
                ...prev.capabilities,
                canAskNext: false,
                isReadOnly: true,
                reason: readOnlyMessage,
              },
            };
          });
          setChatTurns((prev) => mergeTurnsByIdentity(prev, [systemTurn]));
          toast.info(readOnlyMessage);
          return;
        }
        if (errCode === 'TURN_LIMIT_EXCEEDED') {
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          setChatErrorCode(errCode);
          setChatErrorMessage('You have reached the billable analysis-turn limit for this session.');
          toast.info('You have reached the billable analysis-turn limit for this session.');
          return;
        }
      }
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setPendingOutgoingMessage((prev) =>
          prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
        );
        toast.info('Requests are being sent too quickly. Please wait about 1 minute before submitting again.');
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
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          toast.error('Image rejected: Only Human Bone X-Rays are supported.');
          setImageError('Image rejected: Only Human Bone X-Rays are supported.');
          return;
        }
      }
      if (isAiModelOverloadError(err)) {
        overloadExit = true;
        setPendingOutgoingMessage((prev) =>
          prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
        );
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
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
          const warning =
            'Network connection lost. The AI is still processing your request on the server. Please check your History tab in a few minutes to see the result.';
          setNetworkWarning(warning);
          toast.info('Connection interrupted. You can continue safely and check History shortly.');
        } else {
          setPendingOutgoingMessage((prev) =>
            prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
          );
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
        setPendingOutgoingMessage((prev) =>
          prev ? { ...prev, status: 'failed' } : { id: requestId, content: q, status: 'failed' },
        );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestion();
  };

  const handleComposerSubmit = (messageOverride?: string) => {
    void submitQuestion(messageOverride);
  };

  const selectedTurn = useMemo(
    () =>
      selectedTurnIndex != null
        ? chatTurns.find((t) => t.turnIndex === selectedTurnIndex) ?? null
        : session?.latest ?? null,
    [chatTurns, selectedTurnIndex, session],
  );
  const viewerAnnotation = useMemo(
    () =>
      selectedTurn?.roiBoundingBox && isValidNormalizedBoundingBox(selectedTurn.roiBoundingBox)
        ? selectedTurn.roiBoundingBox
        : roiBoundingBox,
    [roiBoundingBox, selectedTurn],
  );
  const canAskNext = session?.capabilities?.canAskNext ?? true;
  const isSessionReadOnly = session?.capabilities?.isReadOnly ?? false;
  const sessionCapabilityReason =
    session?.capabilities?.reason?.trim() ||
    (typeof session?.capabilities?.turnsUsed === 'number' &&
    typeof session?.capabilities?.turnLimit === 'number' &&
    session.capabilities.turnLimit > 0
      ? `Analysis-turn limit reached (${session.capabilities.turnsUsed}/${session.capabilities.turnLimit}).`
      : '');
  const isSessionInteractionLocked = !canAskNext || isSessionReadOnly || serverForcedExpired;
  const composerPlaceholder = isSessionInteractionLocked
    ? sessionCapabilityReason || 'This chat is read-only. Start a new chat to continue.'
    : 'What would you like to ask about this image?';
  const isOngoingSession = Boolean(session) && chatTurns.length > 0;
  const latestTurn = chatTurns[chatTurns.length - 1] ?? session?.latest ?? null;
  const latestActorRole = (latestTurn?.actorRole ?? '').toLowerCase();
  const lastResponderRole = (latestTurn?.lastResponderRole ?? session?.lastResponderRole ?? '').toLowerCase();
  const latestReviewState = (latestTurn?.reviewState ?? session?.reviewState ?? '').toLowerCase();
  const isReadOnlyMode = isSessionInteractionLocked;
  const canRequestReview =
    Boolean(session?.sessionId) &&
    Boolean(latestTurn?.turnId || latestTurn?.turnIndex) &&
    canAskNext &&
    !isSessionReadOnly &&
    !isSessionInteractionLocked &&
    (session?.capabilities?.canRequestReview ?? true) &&
    !serverForcedExpired &&
    (latestTurn?.isReviewTarget === true || latestActorRole === 'assistant') &&
    latestReviewState !== 'pending' &&
    latestReviewState !== 'escalated' &&
    latestReviewState !== 'reviewed' &&
    latestReviewState !== 'resolved' &&
    lastResponderRole !== 'expert' &&
    lastResponderRole !== 'lecturer' &&
    lastResponderRole !== 'system';
  const isGuestUser = useMemo(() => {
    const active = user?.activeRole?.toLowerCase() ?? '';
    const roles = (user?.roles ?? []).map((r) => r.toLowerCase());
    const status = (user?.status ?? '').toLowerCase();
    return active === 'guest' || roles.includes('guest') || status === 'guest';
  }, [user]);

  const startNewSession = useCallback(() => {
    if (loading || isSubmittingRef.current) {
      toast.info('Please wait for the current AI response before starting a new chat.');
      return;
    }
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
    setPendingOutgoingMessage(null);
    clearDraft();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('sessionId');
    params.delete('historySessionId');
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    toast.info('New chat started. Choose an image and ask a question.');
  }, [clearDraft, loading, pathname, router, searchParams, toast]);

  const handleRequestLecturerReview = useCallback(async (turn?: VisualQaTurn | null) => {
    if (!session?.sessionId || requestingLecturerReview) return;
    const targetTurnId = turn?.turnId?.trim() || latestTurn?.turnId?.trim() || null;
    setRequestingLecturerReview(true);
    try {
      const updated = await requestStudentVisualQaReview(session.sessionId, targetTurnId);
      setSession((prev) => ({
        ...(prev ?? session),
        ...updated,
        status: updated.status ?? 'PendingExpertReview',
      }));
      if (updated.turns.length > 0) {
        setChatTurns(updated.turns);
      }
      toast.success('Support request has been sent to your lecturer.');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.info('This session has already been submitted for lecturer review.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Could not request lecturer support.');
      }
    } finally {
      setRequestingLecturerReview(false);
    }
  }, [latestTurn?.turnId, requestingLecturerReview, session, toast]);

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
        subtitle="Review an imaging study, keep the full chat history, and escalate the current AI turn for lecturer triage when needed."
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2 lg:items-stretch">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-border-color lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="min-h-0 min-h-[36vh] flex-1 overflow-y-auto custom-scrollbar lg:min-h-0">
            <MedicalImageViewer
              key={hydratingDraft ? 'hydrating' : (previewUrl ?? 'no-preview')}
              src={previewUrl}
              alt="Study image for diagnostic request"
              initialAnnotation={hydratingDraft ? undefined : (viewerAnnotation ?? undefined)}
              onAnnotationComplete={setRoiBoundingBox}
            />
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background p-3 md:p-4">
          <div className="mx-auto flex h-full min-h-0 min-w-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
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
                disabled={loading || restoringSession}
                onClick={startNewSession}
              >
                New Chat
              </Button>
            </div>
            <ChatConversation
              messages={chatTurns}
              optimisticMessages={
                pendingOutgoingMessage
                  ? [
                      {
                        id: pendingOutgoingMessage.id,
                        content: pendingOutgoingMessage.content,
                        status: pendingOutgoingMessage.status,
                      },
                    ]
                  : []
              }
              isLoading={loading}
              capabilities={session?.capabilities}
              isError={Boolean(aiOverload || chatErrorCode)}
              isRestoring={restoringSession}
              networkWarning={networkWarning}
              errorCode={chatErrorCode}
              errorMessage={
                chatErrorMessage ??
                (aiOverload
                  ? 'The AI system is experiencing high traffic. Please try again in a few minutes.'
                  : null)
              }
              canRequestReview={canRequestReview}
              requestingExpertSupport={requestingLecturerReview}
              onRequestExpertSupport={(turn) => void handleRequestLecturerReview(turn)}
              onSendMessage={async (message) => {
                handleComposerSubmit(message);
              }}
              onClear={startNewSession}
            />
            {!isReadOnlyMode ? (
              <form onSubmit={handleSubmit} className="shrink-0 border-t border-border/60 bg-card p-3 md:p-4">
                {loading && loadingPhase === 'upload' ? (
                  <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                ) : null}
                {imageError ? <p className="mb-2 text-xs text-destructive">{imageError}</p> : null}
                {isSessionInteractionLocked ? (
                  <p className="mb-2 text-sm text-muted-foreground">
                    {sessionCapabilityReason || 'This session is currently read-only. Tap '}
                    <span className="font-medium text-foreground">New Chat</span>
                    {' to continue.'}
                  </p>
                ) : null}
                <div className="flex w-full items-center gap-2">
                  {!isOngoingSession && !isSessionInteractionLocked ? (
                    <>
                      <input
                        ref={bottomFileInputRef}
                        key={fileInputKey}
                        type="file"
                        accept="image/*,.dcm,application/dicom"
                        className="hidden"
                        onChange={onFileChange}
                      />
                    </>
                  ) : null}
                  <ChatComposer
                    value={question}
                    onChange={setQuestion}
                    onSubmit={handleComposerSubmit}
                    onChooseFile={() => bottomFileInputRef.current?.click()}
                    disabled={isSessionInteractionLocked}
                    isLoading={loading}
                    canAttachFile={!isOngoingSession && !isSessionInteractionLocked}
                    placeholder={composerPlaceholder}
                  />
                </div>
                {hydratingDraft && !isOngoingSession ? (
                  <p className="mt-2 text-xs text-muted-foreground">Restoring your unsent draft…</p>
                ) : null}
                {!file && prefillLoading && !isOngoingSession ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-accent" />
                    Preloading selected catalog image…
                  </div>
                ) : null}
                {questionError ? <p className="mt-2 text-xs text-destructive">{questionError}</p> : null}
              </form>
            ) : (
              <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
                {sessionCapabilityReason || 'This session is currently read-only.'}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
