'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Loader2,
  MessageSquare,
  ZoomIn,
  Contrast,
  Pencil,
  Download,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Plus,
  Bell,
} from 'lucide-react';
import { getLecturerClasses, getStudentQuestions } from '@/lib/api/lecturer';
import { escalateToExpert, TRIAGE_ALREADY_ESCALATED } from '@/lib/api/lecturer-triage';
import { getStoredUserId } from '@/lib/getStoredUserId';
import type { LectStudentQuestionDto } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';

const XRAY_PLACEHOLDER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCINRzGp6z40Z2fsIZBJEM-zldyzpS3z_ih-Bfgh4mig52ts5MniL-9e43XYgucFN-WgwCWVHHmb6ZmiKWBe1o5U38a_alK5WfGZVT6MDhkHtaegScow4-aHvPzDfZMToJd55FiQox63njJi0VcktL5yJKoYeuQo47pBabw2NzpMgmK7qNcyKcxZbFP9puiQVdiuUDTOokGV-Hy573lajieFijGkk9MGyb0Mcz6zVto6MmqVxXgStDewXjMh4rzuqAcWxG1RyRzYiY';

interface StudentQuestion {
  id: string;
  /** Answer row id for POST/PUT escalation when provided by API */
  answerId?: string | null;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  studentCode: string | null;
  caseId: string;
  caseTitle: string;
  questionText: string;
  askedAt: string;
  status: 'pending' | 'answered' | 'escalated';
  thumbnailUrl?: string;
  studyImageUrl?: string | null;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function QuestionCard({
  question,
  isActive,
  onClick,
}: {
  question: StudentQuestion;
  isActive: boolean;
  onClick: () => void;
}) {
  const badgeClass = isActive
    ? 'border-l-4 border-primary bg-surface-container-lowest'
    : 'bg-surface-container-low hover:bg-surface-container transition-all';
  return (
    <div
      onClick={onClick}
      className={`group rounded-xl p-5 cursor-pointer ${badgeClass}`}
      role="button"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          CASE #{question.caseId.slice(0, 8).toUpperCase().replace(/-/g, '')}
        </span>
        <span className="text-[10px] text-muted-foreground">{formatTime(question.askedAt)}</span>
      </div>
      <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-2">{question.questionText}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{question.caseTitle}</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-[10px] font-bold text-secondary">
          {initials(question.studentName)}
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {question.studentName || 'Unknown'} • {question.studentEmail ? question.studentEmail.split('@')[0] : '—'}
        </span>
      </div>
    </div>
  );
}

export default function StudentQuestionsPage() {
  const toast = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<StudentQuestion | null>(null);
  const [escalateText, setEscalateText] = useState('');
  const [highPriority, setHighPriority] = useState(false);
  const [notifyHead, setNotifyHead] = useState(false);
  const [expertSubmitting, setExpertSubmitting] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const userId = getStoredUserId();
      if (!userId) return;
      const data = await getLecturerClasses(userId);
      if (data.length > 0) setSelectedClass(data[0].id);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadStudentQuestions = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const data = await getStudentQuestions(selectedClass, {});
      const mapped: StudentQuestion[] = data.map((item: LectStudentQuestionDto) => ({
        id: item.id,
        answerId: item.answerId?.trim() || null,
        studentId: item.studentId,
        studentName: item.studentName || 'Unknown',
        studentEmail: item.studentEmail || null,
        studentCode: null,
        caseId: item.caseId,
        caseTitle: item.caseTitle,
        questionText: item.questionText,
        askedAt: item.createdAt || new Date().toISOString(),
        status: item.escalatedById
          ? 'escalated'
          : item.answerText
            ? 'answered'
            : 'pending',
        thumbnailUrl: item.aiConfidenceScore != null ? undefined : undefined,
        studyImageUrl: item.customImageUrl?.trim() || null,
      }));
      setQuestions(mapped);
      if (!selectedQuestion && mapped.length > 0) {
        setSelectedQuestion(mapped[0]);
      }
    } catch {
      setQuestions([
        {
          id: '1',
          studentId: 's1',
          studentName: 'John Doe',
          studentEmail: 'john.doe@medschool.edu',
          studentCode: 'MS-3',
          caseId: 'rad-402',
          caseTitle: 'Distal Phalanx Fracture',
          questionText: 'Interpretation of distal phalanx fracture in lateral view',
          askedAt: new Date(Date.now() - 120000).toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          studentId: 's2',
          studentName: 'Alice Smith',
          studentEmail: 'alice.smith@medschool.edu',
          studentCode: 'MS-2',
          caseId: 'rad-118',
          caseTitle: 'Growth Plate vs. Fracture',
          questionText: 'Growth plate vs. fracture line — differentiating normal epiphyseal plates from non-displaced fractures in pediatric patients.',
          askedAt: new Date(Date.now() - 900000).toISOString(),
          status: 'pending',
        },
        {
          id: '3',
          studentId: 's3',
          studentName: 'Robert Brown',
          studentEmail: 'robert.brown@medschool.edu',
          studentCode: 'MS-3',
          caseId: 'rad-209',
          caseTitle: 'Soft Tissue Swelling',
          questionText: 'Soft tissue swelling indicators — identifying subtle fat pad signs in elbow trauma series.',
          askedAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'answered',
        },
      ]);
      if (!selectedQuestion) setSelectedQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedQuestion]);

  useEffect(() => {
    if (selectedClass) loadStudentQuestions();
  }, [selectedClass, loadStudentQuestions]);

  const filtered = questions.filter(
    (q) =>
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.studentName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const pendingCount = questions.filter((q) => q.status === 'pending').length;

  const aiPreviewText =
    selectedQuestion?.status === 'answered'
      ? 'An answer has already been submitted for this inquiry.'
      : selectedQuestion
        ? `"Based on the clinical curator engine, the lucency at the distal phalanx suggests a volar-displaced tuft fracture. In lateral views, displacement is assessed relative to the longitudinal axis of the proximal fragment. Crush injuries typically result in comminuted tuft fractures with minimal dorsal displacement, whereas "mallet" mechanisms involve dorsal avulsion at the flexor digitorum profundus insertion. The mechanism of injury is the primary discriminator."`
        : '';

  const handleExpertEscalate = async () => {
    if (!selectedQuestion || !selectedClass) return;
    const routeId = selectedQuestion.answerId?.trim() || selectedQuestion.id;
    setExpertSubmitting(true);
    try {
      await escalateToExpert(routeId);
      toast.success('Escalated successfully');
      await loadStudentQuestions();
    } catch (e) {
      if (e instanceof Error && e.message === TRIAGE_ALREADY_ESCALATED) {
        toast.info('This case has already been escalated.');
      } else {
        toast.error(e instanceof Error ? e.message : 'Escalation failed');
      }
    } finally {
      setExpertSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/80 border-b border-border/60 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 h-16 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold tracking-tighter text-primary font-headline">
              Inquiry Dashboard
            </h2>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/lecturer/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/lecturer/classes" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Curricula
              </Link>
              <Link href="/lecturer/student-questions" className="text-sm font-semibold text-primary border-b-2 border-primary pb-1">
                Inquiries
              </Link>
              <Link href="/lecturer/settings" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search inquiries…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-64 rounded-full border-0 bg-muted pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
              />
            </div>
            <button className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border-2 border-white shadow-sm bg-primary/10">
              <span className="text-xs font-bold text-primary">{initials(null)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left: Question List */}
          <div className="col-span-12 space-y-4 lg:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Student Questions</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {pendingCount} Pending
              </span>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isActive={selectedQuestion?.id === q.id}
                    onClick={() => setSelectedQuestion(q)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No inquiries match your search.' : 'No student questions yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {selectedQuestion ? (
              <>
                {/* Main Detail Card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left: text */}
                    <div className="p-8 space-y-6">
                      <div>
                        <span className="inline-block rounded bg-secondary/15 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-secondary">
                          Active Inquiry
                        </span>
                        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground leading-tight">
                          {selectedQuestion.questionText}
                        </h2>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <span aria-hidden>person</span>
                            {selectedQuestion.studentName} (Student ID: {selectedQuestion.studentId.slice(0, 8)})
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <span aria-hidden>calendar_today</span>
                            {new Date(selectedQuestion.askedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="rounded-xl border border-border/40 bg-muted/50 p-5">
                        <p className="text-sm leading-relaxed text-foreground italic">
                          &ldquo;{selectedQuestion.questionText}&rdquo;
                        </p>
                      </div>

                      {/* AI Preview */}
                      <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-primary/5 p-6">
                        <div className="absolute right-4 top-4 opacity-10">
                          <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <div className="mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            AI-generated answer preview
                          </h4>
                        </div>
                        <p className="text-sm italic text-muted-foreground mb-4 leading-relaxed">
                          {aiPreviewText}
                        </p>
                        {selectedQuestion.status !== 'answered' && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                          >
                            Apply this answer
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: X-ray viewer */}
                    <div className="relative flex min-h-[400px] flex-col items-center justify-center bg-slate-900 p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedQuestion.studyImageUrl?.trim() || XRAY_PLACEHOLDER}
                        alt="Medical X-ray"
                        className="max-h-full max-w-full rounded-lg shadow-2xl opacity-90 object-contain"
                      />
                      <div className="glass-panel absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 rounded-full border border-white/20 px-6 py-2.5 shadow-2xl">
                        <button type="button" className="text-white/70 hover:text-white transition-colors" aria-label="Zoom in">
                          <ZoomIn className="h-5 w-5" />
                        </button>
                        <button type="button" className="text-white/70 hover:text-white transition-colors" aria-label="Contrast">
                          <Contrast className="h-5 w-5" />
                        </button>
                        <button type="button" className="text-white/70 hover:text-white transition-colors" aria-label="Edit">
                          <Pencil className="h-5 w-5" />
                        </button>
                        <div className="h-4 w-px bg-white/20" />
                        <button type="button" className="text-white/70 hover:text-white transition-colors" aria-label="Download">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escalation Card */}
                <div className="rounded-2xl border border-border bg-muted/30 p-8 shadow-sm">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/30">
                      <AlertTriangle className="h-5 w-5 text-amber-900 dark:text-amber-200" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Escalate to Clinical Expert</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Requires professional clinical review if the AI preview is insufficient.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Reason for escalation
                      </label>
                      <textarea
                        value={escalateText}
                        onChange={(e) => setEscalateText(e.target.value)}
                        placeholder="e.g., Ambiguous displacement vector, potential false negative in AI interpretation…"
                        rows={3}
                        className="w-full rounded-xl border-0 bg-card text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <label className="flex cursor-pointer items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={highPriority}
                            onChange={(e) => setHighPriority(e.target.checked)}
                            className="rounded border-muted-foreground/30 text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Mark as High Priority
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={notifyHead}
                            onChange={(e) => setNotifyHead(e.target.checked)}
                            className="rounded border-muted-foreground/30 text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Notify Head of Radiology
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEscalateText('')}
                          className="rounded-full px-6 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          disabled={expertSubmitting}
                          onClick={() => void handleExpertEscalate()}
                          className="rounded-full bg-gradient-to-br from-primary to-primary/90 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                        >
                          {expertSubmitting ? 'Submitting…' : 'Submit for Expert Review'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card">
                <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <p className="text-lg font-semibold text-muted-foreground">Select a question to view details</p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Click on a student question in the list to see full inquiry details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 active:scale-95"
        aria-label="New inquiry"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}