'use client';

import { useEffect, useState } from 'react';
import { StudentAppChrome } from '@/components/student/StudentAppChrome';
import { fetchStudentClasses, fetchStudentClassDetail } from '@/lib/api/student';
import type { StudentClassItem } from '@/lib/api/student';
import type { StudentClassDetail } from '@/lib/api/student';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  FileQuestion,
  GraduationCap,
  Loader2,
  Megaphone,
  Trophy,
  Users,
} from 'lucide-react';

// ── Sub-components ──────────────────────────────────────────────────────────

function ClassDetailPanel({
  cls,
  detail,
  detailLoading,
  onBack,
}: {
  cls: StudentClassItem;
  detail: StudentClassDetail | null;
  detailLoading: boolean;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'students' | 'announcements'>('quizzes');

  const tabs = [
    { key: 'quizzes', label: 'Quizzes', icon: FileQuestion, count: detail?.quizzes.length ?? cls.totalQuizzes },
    { key: 'students', label: 'Students', icon: Users, count: detail?.students.length ?? 0 },
    { key: 'announcements', label: 'Announcements', icon: Megaphone, count: detail?.announcements.length ?? cls.totalAnnouncements },
  ] as const;

  function formatDate(iso?: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#00478d] hover:text-[#003366]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all classes
      </button>

      {/* Class header */}
      <div className="overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white shadow-sm">
        <div className="flex items-center gap-4 bg-gradient-to-r from-[#00478d] to-[#005eb8] p-6 text-white">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-['Manrope',sans-serif] text-xl font-bold truncate">{cls.className}</h2>
            <p className="text-sm text-white/80">{cls.semester}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 bg-white/5 p-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-white/60">Lecturer</p>
            <p className="mt-0.5 text-sm font-semibold truncate">{cls.lecturerName ?? '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/60">Enrolled</p>
            <p className="mt-0.5 text-sm font-semibold">{detail?.students.length ?? '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/60">Quizzes</p>
            <p className="mt-0.5 text-sm font-semibold">{detail?.quizzes.length ?? cls.totalQuizzes}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/60">Cases</p>
            <p className="mt-0.5 text-sm font-semibold">{cls.totalCases}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#c2c6d4]/30">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === key
                ? 'border-b-2 border-[#00478d] text-[#00478d]'
                : 'text-[#727783] hover:text-[#191c1e]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="rounded-full bg-[#eceef0] px-2 py-0.5 text-[10px] font-bold text-[#424752]">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {detailLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-[#c2c6d4]/30 bg-white py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00478d]" />
          </div>
        ) : detail === null ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#c2c6d4] py-16">
            <p className="text-sm text-[#727783]">Failed to load class details.</p>
          </div>
        ) : activeTab === 'quizzes' ? (
          <QuizzesTab quizzes={detail.quizzes} />
        ) : activeTab === 'students' ? (
          <StudentsTab students={detail.students} />
        ) : (
          <AnnouncementsTab announcements={detail.announcements} formatDate={formatDate} />
        )}
      </div>
    </div>
  );
}

function QuizzesTab({ quizzes }: { quizzes: StudentClassDetail['quizzes'] }) {
  if (quizzes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#c2c6d4] py-12 text-center">
        <Trophy className="mx-auto h-8 w-8 text-[#727783]" />
        <p className="mt-3 text-sm font-semibold text-[#191c1e]">No quizzes assigned yet</p>
        <p className="mt-1 text-xs text-[#727783]">Your lecturer has not assigned any quizzes to this class.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <div
          key={quiz.quizId}
          className="overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                quiz.isCompleted ? 'bg-[#006a68]/10' : 'bg-[#ffdcc3]/40'
              }`}>
                {quiz.isCompleted
                  ? <CheckCircle className="h-4 w-4 text-[#006a68]" />
                  : <FileQuestion className="h-4 w-4 text-[#703a00]" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#191c1e] truncate">{quiz.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#727783]">
                  {quiz.topic && <span className="rounded-full bg-[#eceef0] px-2 py-0.5">{quiz.topic}</span>}
                  <span className="flex items-center gap-1">
                    <FileQuestion className="h-3 w-3" />
                    {quiz.totalQuestions} Qs
                  </span>
                  {quiz.timeLimit && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {quiz.timeLimit} min
                    </span>
                  )}
                  {quiz.closeTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due: {new Date(quiz.closeTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {quiz.isCompleted && quiz.score != null ? (
                <div className="text-right">
                  <p className={`text-lg font-black ${
                    quiz.score >= 80 ? 'text-[#006a68]'
                    : quiz.score >= 60 ? 'text-[#924e00]'
                    : 'text-[#ba1a1a]'
                  }`}>
                    {Math.round(quiz.score)}%
                  </p>
                  {quiz.passingScore && (
                    <p className="text-[10px] text-[#727783]">
                      Pass: {quiz.passingScore}%
                    </p>
                  )}
                </div>
              ) : quiz.isCompleted ? (
                <span className="rounded-full bg-[#d6e3ff] px-3 py-1 text-xs font-semibold text-[#00478d]">Submitted</span>
              ) : (
                <span className="rounded-full bg-[#ffdcc3]/40 px-3 py-1 text-xs font-semibold text-[#703a00]">Not started</span>
              )}

              <a
                href={`/student/quiz/${quiz.quizId}`}
                className={`flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  quiz.isCompleted
                    ? 'border border-[#00478d]/30 bg-white text-[#00478d] hover:bg-[#d6e3ff]'
                    : 'bg-gradient-to-r from-[#00478d] to-[#005eb8] text-white shadow-sm hover:opacity-95'
                }`}
              >
                {quiz.isCompleted ? 'Retake' : 'Start'}
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentsTab({ students }: { students: StudentClassDetail['students'] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white">
      <div className="border-b border-[#eceef0] bg-[#f8fafc] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[#727783]">
          {students.length} student{students.length !== 1 ? 's' : ''} enrolled
        </p>
      </div>
      {students.length === 0 ? (
        <div className="py-8 text-center">
          <Users className="mx-auto h-8 w-8 text-[#727783]" />
          <p className="mt-2 text-sm text-[#727783]">No students found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#eceef0]">
          {students.map((s, i) => (
            <li key={s.studentId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00478d]/10 text-xs font-bold text-[#00478d]">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#191c1e] truncate">{s.studentName}</p>
                {s.studentCode && (
                  <p className="text-xs text-[#727783]">{s.studentCode}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnnouncementsTab({
  announcements,
  formatDate,
}: {
  announcements: StudentClassDetail['announcements'];
  formatDate: (iso?: string | null) => string;
}) {
  return (
    <div className="space-y-3">
      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c2c6d4] py-12 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-[#727783]" />
          <p className="mt-3 text-sm font-semibold text-[#191c1e]">No announcements</p>
          <p className="mt-1 text-xs text-[#727783]">No announcements have been posted for this class yet.</p>
        </div>
      ) : (
        announcements.map((ann) => (
          <div key={ann.id} className="overflow-hidden rounded-2xl border border-[#eceef0] bg-white">
            <div className="flex items-start justify-between gap-3 bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 shrink-0 text-[#00478d]" />
                <p className="font-semibold text-[#191c1e]">{ann.title}</p>
              </div>
              <span className="shrink-0 text-xs text-[#727783]">{formatDate(ann.createdAt)}</span>
            </div>
            <p className="border-t border-[#eceef0] p-4 text-sm leading-relaxed text-[#424752]">
              {ann.content}
            </p>
          </div>
        ))
      )}
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

  return (
    <div className="min-h-screen text-[#191c1e]">
      <StudentAppChrome breadcrumb="Classes" />

      <div className="px-6 pb-16 pt-6 md:px-10">

        {/* ── Header ── */}
        <div className="mb-6">
          <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#00478d]">Learning Hub</span>
          <h1 className="font-['Manrope',sans-serif] text-2xl font-extrabold tracking-tight md:text-3xl">
            My Classes
          </h1>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#c2c6d4]/30 bg-white">
            <div className="flex items-center gap-3 text-sm text-[#424752]">
              <Loader2 className="h-5 w-5 animate-spin text-[#00478d]" />
              Loading your classes…
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-[#727783]" />
            <h3 className="mt-4 text-lg font-semibold text-[#191c1e]">No enrolled classes</h3>
            <p className="mt-2 text-sm text-[#424752]">
              You are not enrolled in any classes yet. Contact your department administrator or lecturer to get enrolled.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">

            {/* ── Class list (left panel) ── */}
            <div className={`space-y-3 ${selectedClass ? 'lg:w-72 lg:shrink-0' : 'w-full'}`}>
              {!selectedClass && (
                <p className="text-sm text-[#424752]">
                  <span className="font-semibold text-[#191c1e]">{classes.length}</span> enrolled class{classes.length !== 1 ? 'es' : ''}
                </p>
              )}

              {classes.map((cls) => {
                const isActive = selectedClass?.classId === cls.classId;
                return (
                  <div
                    key={cls.classId}
                    className={`overflow-hidden rounded-2xl border bg-white transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#00478d]/50 shadow-md ring-2 ring-[#00478d]/20'
                        : 'border-[#c2c6d4]/30 hover:border-[#00478d]/40 hover:shadow-sm'
                    }`}
                    onClick={() => handleSelectClass(cls)}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isActive ? 'bg-[#00478d] text-white' : 'bg-[#00478d]/10 text-[#00478d]'
                      }`}>
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#191c1e] truncate">{cls.className}</p>
                        <p className="text-xs text-[#727783]">
                          {cls.semester}
                          {cls.lecturerName ? ` • ${cls.lecturerName}` : ''}
                        </p>
                      </div>
                      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                        <div className="flex items-center gap-1 text-[10px] text-[#727783]">
                          <FileQuestion className="h-3 w-3" />
                          {cls.totalQuizzes} quizzes
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#727783]">
                          <BookOpen className="h-3 w-3" />
                          {cls.totalCases} cases
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 text-[#727783] transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Detail panel (right) ── */}
            {selectedClass && (
              <div className="flex-1 min-w-0">
                <ClassDetailPanel
                  cls={selectedClass}
                  detail={detail}
                  detailLoading={detailLoading}
                  onBack={() => { setSelectedClass(null); setDetail(null); }}
                />
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
