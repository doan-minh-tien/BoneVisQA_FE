'use client';

import { useEffect, useState } from 'react';
import { StudentAppChrome, StudentDashboardFab } from '@/components/student/StudentAppChrome';
import { fetchStudentClasses, fetchStudentAnnouncements } from '@/lib/api/student';
import type { StudentClassItem } from '@/lib/api/student';
import type { StudentAnnouncement } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Loader2,
  Megaphone,
  Users,
  FileQuestion,
} from 'lucide-react';

export default function StudentClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<Record<string, StudentAnnouncement[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const loadAnnouncements = async (classId: string) => {
    if (announcements[classId]) return;
    setLoadingAnnouncements(true);
    try {
      const all = await fetchStudentAnnouncements();
      const filtered = all.filter((a) => a.classId === classId);
      setAnnouncements((prev) => ({ ...prev, [classId]: filtered }));
    } catch {
      // silent
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleToggle = (classId: string) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
    } else {
      setExpandedClass(classId);
      loadAnnouncements(classId);
    }
  };

  return (
    <div className="min-h-screen text-[#191c1e]">
      <StudentAppChrome breadcrumb="Classes" title="My Classes" subtitle="Your enrolled courses and class announcements" />

      <div className="px-6 pb-16 pt-6 md:px-10">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#424752]">
                <span className="font-semibold text-[#191c1e]">{classes.length}</span> enrolled class
                {classes.length !== 1 ? 'es' : ''}
              </p>
            </div>

            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.classId}
                  className="overflow-hidden rounded-2xl border border-[#c2c6d4]/30 bg-white transition-all"
                >
                  {/* Class header */}
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00478d]/10">
                        <GraduationCap className="h-6 w-6 text-[#00478d]" />
                      </div>
                      <div>
                        <h3 className="font-['Manrope',sans-serif] text-base font-bold text-[#191c1e]">
                          {cls.className}
                        </h3>
                        <p className="text-xs text-[#727783]">
                          {cls.semester}
                          {cls.lecturerName ? ` • ${cls.lecturerName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Stats */}
                      <div className="hidden flex-wrap gap-4 sm:flex">
                        <div className="flex items-center gap-1.5 text-xs text-[#727783]">
                          <Megaphone className="h-3.5 w-3.5" />
                          {cls.totalAnnouncements} announcements
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#727783]">
                          <FileQuestion className="h-3.5 w-3.5" />
                          {cls.totalQuizzes} quizzes
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#727783]">
                          <BookOpen className="h-3.5 w-3.5" />
                          {cls.totalCases} cases
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggle(cls.classId)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#c2c6d4]/30 transition-all ${
                          expandedClass === cls.classId ? 'bg-[#00478d] text-white' : 'hover:bg-[#f2f4f6]'
                        }`}
                        aria-expanded={expandedClass === cls.classId}
                        aria-label="View announcements"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${expandedClass === cls.classId ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: announcements */}
                  {expandedClass === cls.classId && (
                    <div className="border-t border-[#eceef0] p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-[#00478d]" />
                        <h4 className="text-sm font-bold text-[#191c1e]">Class Announcements</h4>
                      </div>

                      {loadingAnnouncements ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-[#727783]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading…
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(announcements[cls.classId] ?? []).length === 0 ? (
                            <p className="py-3 text-sm text-[#727783]">
                              No announcements for this class yet.
                            </p>
                          ) : (
                            (announcements[cls.classId] ?? []).map((ann) => (
                              <div
                                key={ann.id}
                                className="rounded-xl border border-[#eceef0] bg-[#f2f4f6] p-4"
                              >
                                <div className="mb-1.5 flex items-start justify-between gap-3">
                                  <p className="font-semibold text-[#191c1e]">{ann.title}</p>
                                  {ann.createdAt ? (
                                    <span className="shrink-0 text-xs text-[#727783]">
                                      {new Date(ann.createdAt).toLocaleDateString('vi-VN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm leading-relaxed text-[#424752]">{ann.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <StudentDashboardFab />
    </div>
  );
}
