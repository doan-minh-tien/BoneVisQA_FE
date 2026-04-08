'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  assignExpertQuiz as assignQuiz,
  calculateAttemptScore as calculator,
} from '@/lib/api/expert-quizzes';
import { Clock, Calendar, ClipboardList, BadgeCheck } from 'lucide-react';

function isoToLocalInputValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function localInputValueToIso(v: string): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function QuizAssignScorePanel() {
  const toast = useToast();

  const [assignOpen, setAssignOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<unknown>(null);

  const [quizId, setQuizId] = useState('');
  const [classId, setClassId] = useState('');
  const [assignedExpertId, setAssignedExpertId] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [passingScore, setPassingScore] = useState<number>(0);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(0);

  const openAssign = () => {
    setAssignResult(null);
    setQuizId('');
    setClassId('');
    setAssignedExpertId('');
    setOpenTime('');
    setCloseTime('');
    setPassingScore(0);
    setTimeLimitMinutes(0);
    setAssignOpen(true);
  };

  const canAssign = useMemo(() => {
    return (
      Boolean(quizId.trim()) &&
      Boolean(classId.trim()) &&
      Boolean(assignedExpertId.trim()) &&
      Boolean(openTime) &&
      Boolean(closeTime) &&
      Number(passingScore) >= 0 &&
      Number(timeLimitMinutes) >= 0
    );
  }, [assignedExpertId, classId, closeTime, openTime, passingScore, timeLimitMinutes]);

  const handleAssign = async () => {
    const openIso = localInputValueToIso(openTime);
    const closeIso = localInputValueToIso(closeTime);
    if (!openIso || !closeIso) return toast.error('Open time and close time are required.');
    if (Date.parse(openIso) > Date.parse(closeIso)) {
      return toast.error('Open time must be before or equal to close time.');
    }
    if (!canAssign) return toast.error('Missing required fields.');

    try {
      setIsAssigning(true);
      const res = await assignQuiz({
        classId: classId.trim(),
        quizId: quizId.trim(),
        assignedExpertId: assignedExpertId.trim(),
        openTime: openIso,
        closeTime: closeIso,
        passingScore: Number(passingScore),
        timeLimitMinutes: Number(timeLimitMinutes),
      });
      setAssignResult(res);
      toast.success('Quiz assigned successfully.');
      setAssignOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Assign failed.';
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const [attemptId, setAttemptId] = useState('');
  const [scoreResult, setScoreResult] = useState<null | {
    attemptId: string;
    studentId: string;
    quizId: string;
    quizTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    passingScore: number;
    isPassed: boolean;
    completedAt: string;
  }>(null);
  const [isScoring, setIsScoring] = useState(false);

  const handleCalculateScore = async () => {
    if (!attemptId.trim()) return toast.error('Attempt ID is required.');
    try {
      setIsScoring(true);
      const res = await calculator(attemptId.trim());
      setScoreResult(res);
      toast.success('Calculated score successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Calculate score failed.';
      toast.error(msg);
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-card-foreground">Assign Quiz & Calculator</div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAssign}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 cursor-pointer transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Assign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-border bg-input/10">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-success" />
            <div className="text-sm font-medium text-card-foreground">Calculator</div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Attempt ID</label>
            <input
              value={attemptId}
              onChange={(e) => setAttemptId(e.target.value)}
              placeholder="Enter attemptId"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              disabled={isScoring}
              onClick={handleCalculateScore}
              className="mt-3 w-full px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isScoring ? 'Calculating...' : 'Calculate'}
            </button>
          </div>

          {scoreResult ? (
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <div>Quiz: {scoreResult.quizTitle}</div>
              <div>
                Score: <span className="text-card-foreground font-medium">{scoreResult.score}%</span> / Passing:{' '}
                <span className="text-card-foreground font-medium">{scoreResult.passingScore}%</span>
              </div>
              <div>
                Result:{' '}
                <span className="text-card-foreground font-medium">{scoreResult.isPassed ? 'Passed' : 'Not passed'}</span>
              </div>
              <div>Completed: {scoreResult.completedAt ? String(new Date(scoreResult.completedAt).toLocaleString()) : '-'}</div>
            </div>
          ) : null}
        </div>

        <div className="p-3 rounded-lg border border-border bg-input/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm font-medium text-card-foreground">Assignment Result</div>
          </div>

          {assignResult ? (
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <div>
                Class: <span className="text-card-foreground font-medium">{(assignResult as any).className ?? (assignResult as any).classId}</span>
              </div>
              <div>
                Expert: <span className="text-card-foreground font-medium">{(assignResult as any).expertName ?? ''}</span>
              </div>
              <div>
                Open: <span className="text-card-foreground font-medium">{(assignResult as any).openTime ? String(new Date((assignResult as any).openTime).toLocaleString()) : '-'}</span>
              </div>
              <div>
                Close: <span className="text-card-foreground font-medium">{(assignResult as any).closeTime ? String(new Date((assignResult as any).closeTime).toLocaleString()) : '-'}</span>
              </div>
              <div>
                Passing: <span className="text-card-foreground font-medium">{(assignResult as any).passingScore ?? '-'}</span>%
              </div>
              <div>
                Time limit: <span className="text-card-foreground font-medium">{(assignResult as any).timeLimitMinutes ?? '-'}</span> min
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">No assignment yet.</div>
          )}
        </div>
      </div>

      {assignOpen && (
        <ModalShell title="Assign Expert Quiz" onClose={() => !isAssigning && setAssignOpen(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Quiz ID</label>
              <input
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                placeholder="e.g. 767d9661-be38-..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Class ID</label>
              <input
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="e.g. d07c8498-..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Assigned Expert ID</label>
              <input
                value={assignedExpertId}
                onChange={(e) => setAssignedExpertId(e.target.value)}
                placeholder="e.g. 3c97d301-b0ff-..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Open Time</label>
              <input
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Close Time</label>
              <input
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Passing Score (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Time Limit (minutes)</label>
              <input
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              disabled={isAssigning}
              onClick={() => setAssignOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isAssigning || !canAssign}
              onClick={handleAssign}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isAssigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

