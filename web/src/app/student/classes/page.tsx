'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StudentAppChrome } from '@/components/student/StudentAppChrome';
import { ActiveCourseworkBento } from '@/components/student/ActiveCourseworkBento';
import { ClassDetailCover, ClassDetailHeroSvg } from '@/components/student/ClassDetailVisuals';
import { fetchStudentClasses, fetchStudentClassDetail, leaveStudentClass } from '@/lib/api/student';
import type { StudentClassItem } from '@/lib/api/student';
import type { StudentClassDetail } from '@/lib/api/student';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  GraduationCap,
  Loader2,
  Mail,
  Megaphone,
  Plus,
  Timer,
  Trophy,
  UserMinus,
} from 'lucide-react';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Sub-components (MedEd-style class detail) ───────────────────────────────

function useClientNow(intervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const t0 = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

const ANNOUNCEMENT_BADGE_STYLES = [
  { label: 'Urgent', className: 'bg-[#ffdcc3] text-[#6e3900]' },
  { label: 'Resource', className: 'bg-[#94efec] text-[#006e6d]' },
  { label: 'Update', className: 'bg-[#d6e3ff] text-[#00468c]' },
] as const;

function formatClassDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDueLine(closeTime?: string | null) {
  if (!closeTime) return 'Due: See lecturer';
  const end = new Date(closeTime);
  if (Number.isNaN(end.getTime())) return 'Due: See lecturer';
  return `Due: ${end.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
}

function quizProgressPercent(quiz: StudentClassDetail['quizzes'][number]) {
  if (quiz.isCompleted && quiz.score != null) return Math.min(100, Math.round(quiz.score));
  return 0;
}

function MedEdAnnouncementsBlock({
  announcements,
}: {
  announcements: StudentClassDetail['announcements'];
}) {
  return (
    <section className="rounded-3xl bg-[#f2f4f6] p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-[#191c1e]">Announcements</h2>
        <span className="text-sm font-bold text-[#00478d]">{announcements.length} posted</span>
      </div>
      {announcements.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#c2c6d4]/50 bg-gradient-to-br from-white via-[#f2f4f6] to-[#d6e3ff]/40">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[#00478d]/[0.06]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-[#94efec]/25"
            aria-hidden
          />
          <div className="relative flex flex-col items-center px-6 py-16 text-center md:flex-row md:items-center md:gap-10 md:py-14 md:text-left">
            <div className="mb-8 shrink-0 md:mb-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl bg-[#0d2137] shadow-md ring-1 ring-[#c2c6d4]/40 md:h-32 md:w-32">
                <ClassDetailHeroSvg className="absolute inset-0 h-full w-full" />
              </div>
            </div>
            <div className="max-w-md">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#00478d]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00478d]">
                <Megaphone className="h-3.5 w-3.5" aria-hidden />
                Updates
              </div>
              <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-[#191c1e] md:text-xl">
                No announcements yet
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#424752]">
                When your lecturer posts schedules, materials, or exam notes, they will show up here. You can still open
                quizzes and cases from the right panel.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((ann, i) => {
            const badge = ANNOUNCEMENT_BADGE_STYLES[i % ANNOUNCEMENT_BADGE_STYLES.length];
            return (
              <article
                key={ann.id}
                className="rounded-2xl bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <time className="text-xs font-medium text-[#424752]">{formatClassDate(ann.createdAt)}</time>
                </div>
                <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-[#191c1e]">{ann.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#424752]">{ann.content}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MedEdCaseAssignmentsBlock({
  cls,
  quizzes,
}: {
  cls: StudentClassItem;
  quizzes: StudentClassDetail['quizzes'];
}) {
  type CardSpec = { key: string; title: string; due: string; progress: number; href: string };

  const cards: CardSpec[] = [];
  if (quizzes[0]) {
    const q = quizzes[0];
    cards.push({
      key: q.quizId,
      title: q.title,
      due: formatDueLine(q.closeTime),
      progress: quizProgressPercent(q),
      href: `/student/quiz/${q.quizId}`,
    });
  }
  if (quizzes[1]) {
    const q = quizzes[1];
    cards.push({
      key: q.quizId,
      title: q.title,
      due: formatDueLine(q.closeTime),
      progress: quizProgressPercent(q),
      href: `/student/quiz/${q.quizId}`,
    });
  }
  while (cards.length < 2) {
    if (cls.totalCases > 0 && !cards.some((c) => c.key === 'catalog')) {
      cards.push({
        key: 'catalog',
        title: 'Clinical case bank',
        due: 'Self-paced · curriculum',
        progress: 0,
        href: '/student/catalog',
      });
      continue;
    }
    if (!cards.some((c) => c.key === 'qa')) {
      cards.push({
        key: 'qa',
        title: 'Visual QA practice',
        due: 'Practice anytime',
        progress: 0,
        href: '/student/qa',
      });
      continue;
    }
    break;
  }

  const filled = cards;

  return (
    <section>
      <h2 className="mb-6 font-['Manrope',sans-serif] text-2xl font-bold tracking-tight text-[#191c1e]">
        Case assignments
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filled.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="block rounded-2xl border border-[#c2c6d4]/40 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h4 className="font-bold text-[#191c1e]">{c.title}</h4>
            <p className="mb-4 mt-1 text-xs text-[#424752]">{c.due}</p>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[#eceef0]">
              <div className="h-full rounded-full bg-[#00478d]" style={{ width: `${c.progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#424752]">
              <span>Progress</span>
              <span>{c.progress > 0 ? `${c.progress}%` : '—'}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MedEdActiveAssessmentsBlock({ quizzes }: { quizzes: StudentClassDetail['quizzes'] }) {
  const now = useClientNow();

  function isLocked(openTime?: string | null) {
    if (!openTime || now == null) return false;
    const t = new Date(openTime).getTime();
    if (Number.isNaN(t)) return false;
    return t > now;
  }

  function opensLine(openTime?: string | null) {
    if (!openTime) return null;
    const d = new Date(openTime);
    if (Number.isNaN(d.getTime())) return null;
    return `Opens ${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`;
  }

  return (
    <section className="rounded-3xl bg-[#2d3133] p-6 text-white shadow-xl md:p-8" id="assessments">
      <div className="mb-6 flex items-center gap-2">
        <Timer className="h-6 w-6 shrink-0 text-[#97f2ef]" aria-hidden />
        <h2 className="font-['Manrope',sans-serif] text-xl font-bold">Active assessments</h2>
      </div>
      {quizzes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 py-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-white/40" />
          <p className="mt-3 text-sm text-white/60">No quizzes assigned to this class yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const locked = isLocked(quiz.openTime);
            const meta = [
              `${quiz.totalQuestions} questions`,
              quiz.timeLimit ? `${quiz.timeLimit} min` : null,
            ]
              .filter(Boolean)
              .join(' • ');
            const secondary = locked ? opensLine(quiz.openTime) : quizDueLine(quiz.closeTime);

            return (
              <div
                key={quiz.quizId}
                className={`flex flex-col gap-3 rounded-xl border border-white/10 p-4 ${locked ? 'bg-white/5 opacity-80' : 'bg-white/10'}`}
              >
                <div>
                  <h4 className="text-sm font-bold">{quiz.title}</h4>
                  <p className="text-xs text-white/60">{meta}</p>
                  {secondary ? <p className="mt-1 text-xs text-white/50">{secondary}</p> : null}
                </div>
                {locked ? (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-lg bg-white/20 py-2 text-sm font-bold text-white"
                  >
                    Locked
                  </button>
                ) : (
                  <Link
                    href={`/student/quiz/${quiz.quizId}`}
                    className="flex w-full items-center justify-center rounded-lg bg-[#97f2ef] py-2 text-sm font-bold text-[#00201f] transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    {quiz.isCompleted ? 'Resume / retake' : 'Start quiz'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function quizDueLine(closeTime?: string | null): string {
  if (!closeTime) return '';
  const end = new Date(closeTime);
  if (Number.isNaN(end.getTime())) return '';
  return `Closes ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function MedEdRosterBlock({ students }: { students: StudentClassDetail['students'] }) {
  const [expanded, setExpanded] = useState(false);
  const preview = expanded ? students : students.slice(0, 3);

  if (students.length === 0) {
    return (
      <section className="rounded-3xl bg-[#eceef0] p-8">
        <h2 className="mb-4 font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e]">Class roster</h2>
        <p className="text-sm text-[#424752]">No classmates listed yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-[#eceef0] p-6 md:p-8">
      <h2 className="mb-6 font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e]">Class roster</h2>
      <div className="space-y-4">
        {preview.map((s) => (
          <div key={s.studentId} className="group flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e0e3e5] text-xs font-bold text-[#00478d]">
                {(s.studentName || '?')
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#191c1e]">{s.studentName}</p>
                <p className="text-[10px] font-medium text-[#424752]">{s.studentCode?.trim() || 'Student'}</p>
              </div>
            </div>
            <Mail className="h-4 w-4 shrink-0 text-[#424752] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </div>
        ))}
      </div>
      {students.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 w-full rounded-xl border border-[#c2c6d4]/50 py-3 text-xs font-bold text-[#424752] transition-colors hover:bg-[#e6e8ea]"
        >
          {expanded ? 'Show fewer' : `View all ${students.length} students`}
        </button>
      ) : null}
    </section>
  );
}

function ClassDetailPanel({
  cls,
  detail,
  detailLoading,
  onBack,
  onRequestLeave,
}: {
  cls: StudentClassItem;
  detail: StudentClassDetail | null;
  detailLoading: boolean;
  onBack: () => void;
  onRequestLeave: () => void;
}) {
  const lecturer = cls.lecturerName?.trim() || 'Instructor';
  const lecturerInitials = initialsFromName(lecturer);

  return (
    <div className="relative pb-20">
      <section className="mb-10 flex flex-col gap-8 md:mb-12 md:flex-row md:items-start md:justify-between lg:mb-14">
        <div className="max-w-2xl min-w-0 flex-1">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium text-[#424752]">
            <button type="button" onClick={onBack} className="transition-colors hover:text-[#005eb8]">
              Classes
            </button>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            <span className="truncate text-[#191c1e]">{cls.semester || 'Curriculum'}</span>
          </nav>
          <h1 className="font-['Manrope',sans-serif] text-4xl font-extrabold tracking-tighter text-[#191c1e] sm:text-5xl">
            {cls.className}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005eb8] text-[10px] font-bold text-white"
                aria-hidden
              >
                {lecturerInitials}
              </div>
              <span className="text-sm font-semibold text-[#00478d]">{lecturer}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#006a68]" aria-hidden />
              <span className="text-xs font-medium text-[#424752]">Course lecturer</span>
            </div>
            <button
              type="button"
              onClick={onRequestLeave}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-white px-4 py-2 text-xs font-bold text-destructive shadow-sm transition-colors hover:bg-destructive/5"
            >
              <UserMinus className="h-3.5 w-3.5" />
              Leave class
            </button>
          </div>
        </div>
        <div className="h-48 w-full shrink-0 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 md:h-auto md:w-80 md:aspect-[4/3]">
          <ClassDetailCover variant="hero" className="min-h-[12rem] md:min-h-0 md:h-full" />
        </div>
      </section>

      {detailLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-[#e0e3e5] bg-white py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#00478d]" />
          <p className="mt-4 text-sm text-[#424752]">Loading class workspace…</p>
        </div>
      ) : detail === null ? (
        <div className="rounded-3xl border border-dashed border-[#c2c6d4] bg-[#f2f4f6] py-20 text-center">
          <p className="text-sm text-[#424752]">Could not load this class. Go back and try again.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-sm font-bold text-[#00478d] underline-offset-4 hover:underline"
          >
            All classes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-8 lg:col-span-8">
            <MedEdAnnouncementsBlock announcements={detail.announcements} />
            <MedEdCaseAssignmentsBlock cls={cls} quizzes={detail.quizzes} />
          </div>
          <div className="space-y-8 lg:col-span-4">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5">
              <ClassDetailCover variant="spotlight" className="h-full" />
            </div>
            <MedEdActiveAssessmentsBlock quizzes={detail.quizzes} />
            <MedEdRosterBlock students={detail.students} />
          </div>
        </div>
      )}

      <Link
        href="/student/catalog"
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00478d] to-[#005eb8] text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
        aria-label="Open case catalog"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function StudentClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<StudentClassItem | null>(null);
  const [detail, setDetail] = useState<StudentClassDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<StudentClassItem | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentClasses();
        if (!cancelled) setClasses(data);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Failed to load your classes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const handleSelectClass = async (cls: StudentClassItem) => {
    setSelectedClass(cls);
    if (!detail || detail.classId !== cls.classId) {
      setDetailLoading(true);
      setDetail(null);
      try {
        const data = await fetchStudentClassDetail(cls.classId);
        setDetail(data);
      } catch {
        toast.error('Failed to load class details.');
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const handleConfirmLeaveClass = async () => {
    if (!leaveTarget) return;
    const leftName = leaveTarget.className;
    const leftId = leaveTarget.classId;
    setLeaveLoading(true);
    try {
      await leaveStudentClass(leftId);
      setClasses((prev) => prev.filter((c) => c.classId !== leftId));
      if (selectedClass?.classId === leftId) {
        setSelectedClass(null);
        setDetail(null);
      }
      setLeaveTarget(null);
      toast.success(`You left “${leftName}”.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not leave this class.');
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen text-foreground ${!selectedClass ? 'bg-[#f7f9fb]' : 'bg-background'}`}
    >
      <StudentAppChrome breadcrumb={!selectedClass ? 'Curriculum' : 'Classes'} />

      <div className={`mx-auto px-4 pb-20 pt-6 sm:px-6 md:px-10 ${selectedClass ? 'max-w-[1440px]' : 'max-w-[1440px]'}`}>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-[#e0e3e5] bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium text-[#424752]">
              <Loader2 className="h-5 w-5 animate-spin text-[#00478d]" />
              Loading your classes…
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d6e3ff] text-[#00478d]">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-['Manrope',sans-serif] text-lg font-bold text-[#191c1e]">No enrolled classes</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#424752]">
              You are not enrolled in any classes yet. Contact your department administrator or lecturer to get enrolled.
            </p>
          </div>
        ) : !selectedClass ? (
          <ActiveCourseworkBento
            classes={classes}
            onEnterClass={handleSelectClass}
            onLeaveClass={setLeaveTarget}
            onArchiveView={() => toast.info('Archive view is not available yet.')}
            onEnrollNew={() => toast.info('Ask your lecturer or admin to add you to a class.')}
          />
        ) : (
          <ClassDetailPanel
            cls={selectedClass}
            detail={detail}
            detailLoading={detailLoading}
            onBack={() => { setSelectedClass(null); setDetail(null); }}
            onRequestLeave={() => setLeaveTarget(selectedClass)}
          />
        )}
      </div>

      <Modal
        open={leaveTarget !== null}
        title="Leave this class?"
        onClose={() => { if (!leaveLoading) setLeaveTarget(null); }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={leaveLoading}
              onClick={() => setLeaveTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={leaveLoading}
              onClick={handleConfirmLeaveClass}
            >
              Leave class
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          You will lose access to this class&apos;s quizzes and announcements. A lecturer can add you back later if
          needed.
        </p>
        {leaveTarget && (
          <p className="mt-3 font-['Manrope',sans-serif] text-base font-bold text-card-foreground">
            {leaveTarget.className}
          </p>
        )}
      </Modal>
    </div>
  );
}
