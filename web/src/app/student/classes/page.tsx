'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ActiveCourseworkBento } from '@/components/student/ActiveCourseworkBento';
import { fetchStudentClasses, leaveStudentClass } from '@/lib/api/student';
import type { StudentClassItem } from '@/lib/api/student';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function StudentClassesPage() {
  const router = useRouter();
  const toast = useToast();
  const [classes, setClasses] = useState<StudentClassItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleConfirmLeaveClass = async () => {
    if (!leaveTarget) return;
    const leftName = leaveTarget.className;
    const leftId = leaveTarget.classId;
    setLeaveLoading(true);
    try {
      await leaveStudentClass(leftId);
      setClasses((prev) => prev.filter((c) => c.classId !== leftId));
      setLeaveTarget(null);
      toast.success(`You left “${leftName}”.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not leave this class.');
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header title="My Classes" subtitle="Enter active classes, announcements, and coursework." />

      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-6 sm:px-6 md:px-10">

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading your classes…
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-['Manrope',sans-serif] text-lg font-bold text-card-foreground">No enrolled classes</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              You are not enrolled in any classes yet. Contact your department administrator or lecturer to get enrolled.
            </p>
          </div>
        ) : (
          <ActiveCourseworkBento
            classes={classes}
            onEnterClass={(cls) => router.push(`/student/classes/${cls.classId}`)}
            onLeaveClass={setLeaveTarget}
            onArchiveView={() => toast.info('Archive view is not available yet.')}
            onEnrollNew={() => toast.info('Ask your lecturer or admin to add you to a class.')}
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
