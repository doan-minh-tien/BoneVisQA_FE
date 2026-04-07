'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldAlert, UserPlus, Users } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/shared/EmptyState';
import type { CaseDto, ClassItem, QuizDto, StudentEnrollment } from '@/lib/api/types';
import {
  ForbiddenApiError,
  assignCasesToLecturerClass,
  assignQuizToLecturerClass,
  enrollStudentsMany,
  fetchAssignedCases,
  fetchAssignedQuizzes,
  fetchAvailableStudents,
  fetchClassStudents,
  fetchLecturerCaseLibrary,
  fetchLecturerClassById,
  fetchLecturerQuizLibrary,
  removeStudentFromClass,
} from '@/lib/api/lecturer-classes';

type DetailTab = 'students' | 'cases' | 'quizzes';

export default function LecturerClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classId } = use(params);
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<DetailTab>('students');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const [classInfo, setClassInfo] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [assignedCases, setAssignedCases] = useState<CaseDto[]>([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState<QuizDto[]>([]);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<StudentEnrollment[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);

  const [assignCasesOpen, setAssignCasesOpen] = useState(false);
  const [caseLibrary, setCaseLibrary] = useState<CaseDto[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [caseDueDate, setCaseDueDate] = useState('');
  const [caseMandatory, setCaseMandatory] = useState(true);
  const [assignCasesSubmitting, setAssignCasesSubmitting] = useState(false);

  const [assignQuizOpen, setAssignQuizOpen] = useState(false);
  const [quizLibrary, setQuizLibrary] = useState<QuizDto[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizOpenTime, setQuizOpenTime] = useState('');
  const [quizCloseTime, setQuizCloseTime] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState('60');
  const [quizPassingScore, setQuizPassingScore] = useState('70');
  const [assignQuizSubmitting, setAssignQuizSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [klass, classStudents, classCases, classQuizzes] = await Promise.all([
          fetchLecturerClassById(classId),
          fetchClassStudents(classId),
          fetchAssignedCases(classId),
          fetchAssignedQuizzes(classId),
        ]);
        if (ignore) return;
        setClassInfo(klass);
        setStudents(classStudents);
        setAssignedCases(classCases);
        setAssignedQuizzes(classQuizzes);
      } catch (err) {
        if (ignore) return;
        if (err instanceof ForbiddenApiError) {
          setForbidden(true);
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load class workbench.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [classId]);

  const availableCasesToAssign = useMemo(
    () => caseLibrary.filter((item) => !assignedCases.some((assigned) => assigned.id === item.id)),
    [assignedCases, caseLibrary],
  );

  const availableQuizzesToAssign = useMemo(
    () => quizLibrary.filter((item) => !assignedQuizzes.some((assigned) => assigned.id === item.id)),
    [assignedQuizzes, quizLibrary],
  );

  const onOpenEnrollModal = async () => {
    setEnrollModalOpen(true);
    try {
      const data = await fetchAvailableStudents(classId);
      setAvailableStudents(data);
      setSelectedStudentIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load available students.');
    }
  };

  const onEnrollMany = async () => {
    if (selectedStudentIds.size === 0) return;
    setEnrollSubmitting(true);
    try {
      const ids = Array.from(selectedStudentIds);
      await enrollStudentsMany(classId, ids);
      const newlyEnrolled = availableStudents.filter((student) => ids.includes(student.studentId));
      setStudents((prev) => [...prev, ...newlyEnrolled]);
      setEnrollModalOpen(false);
      toast.success('Students enrolled successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enrollment failed.');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const onRemoveStudent = async (studentId: string) => {
    try {
      await removeStudentFromClass(classId, studentId);
      setStudents((prev) => prev.filter((item) => item.studentId !== studentId));
      toast.success('Student removed from class.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove student.');
    }
  };

  const onOpenAssignCases = async () => {
    setAssignCasesOpen(true);
    try {
      const data = await fetchLecturerCaseLibrary();
      setCaseLibrary(data);
      setSelectedCaseIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load case library.');
    }
  };

  const onAssignCases = async () => {
    if (selectedCaseIds.size === 0) return;
    setAssignCasesSubmitting(true);
    try {
      const ids = Array.from(selectedCaseIds);
      await assignCasesToLecturerClass(classId, {
        caseIds: ids,
        dueDate: caseDueDate || undefined,
        isMandatory: caseMandatory,
      });
      const newlyAssigned = caseLibrary.filter((item) => ids.includes(item.id));
      setAssignedCases((prev) => [...prev, ...newlyAssigned]);
      setAssignCasesOpen(false);
      toast.success('Cases assigned successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Case assignment failed.');
    } finally {
      setAssignCasesSubmitting(false);
    }
  };

  const onOpenAssignQuiz = async () => {
    setAssignQuizOpen(true);
    try {
      const data = await fetchLecturerQuizLibrary();
      setQuizLibrary(data);
      setSelectedQuizId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load quiz library.');
    }
  };

  const onAssignQuiz = async () => {
    if (!selectedQuizId) {
      toast.error('Please select a quiz to assign.');
      return;
    }
    setAssignQuizSubmitting(true);
    try {
      await assignQuizToLecturerClass(classId, {
        quizId: selectedQuizId,
        openTime: quizOpenTime || undefined,
        closeTime: quizCloseTime || undefined,
        timeLimitMinutes: Number(quizTimeLimit) || undefined,
        passingScore: Number(quizPassingScore) || undefined,
      });
      const quiz = quizLibrary.find((item) => item.id === selectedQuizId);
      if (quiz) setAssignedQuizzes((prev) => [...prev, quiz]);
      setAssignQuizOpen(false);
      toast.success('Quiz assigned successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Quiz assignment failed.');
    } finally {
      setAssignQuizSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title={classInfo?.className ?? 'Class Workbench'}
        subtitle={classInfo ? `Semester ${classInfo.semester}` : 'Manage students, cases, and quizzes.'}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/lecturer/classes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to classes
        </Link>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading class management workbench...
          </div>
        ) : forbidden ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="You do not have permission to manage this class"
            description={error || 'Please contact your administrator for access.'}
          />
        ) : error ? (
          <EmptyState title="Unable to load class workbench" description={error} />
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    activeTab === 'students' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Students ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cases')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    activeTab === 'cases' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Cases ({assignedCases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quizzes')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    activeTab === 'quizzes' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Quizzes ({assignedQuizzes.length})
                </button>
              </div>
            </div>

            {activeTab === 'students' ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">Enrolled Students</h2>
                  <Button onClick={onOpenEnrollModal}>
                    <UserPlus className="h-4 w-4" />
                    Enroll Students
                  </Button>
                </div>
                {students.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    title="No enrolled students"
                    description="Use Enroll Students to add learners to this class."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-slate-50/60 text-left text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Student Code</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, index) => (
                          <tr key={student.enrollmentId} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/45'} hover:bg-slate-50/80`}>
                            <td className="px-4 py-3 text-sm text-card-foreground">{student.studentName || 'Unknown student'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{student.studentCode || '—'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{student.studentEmail || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="outline" size="sm" onClick={() => onRemoveStudent(student.studentId)}>
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === 'cases' ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">Assigned Cases</h2>
                  <Button onClick={onOpenAssignCases}>Assign Cases</Button>
                </div>
                {assignedCases.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-6 w-6" />}
                    title="No assigned cases"
                    description="Assign case sets to this class for guided practice."
                  />
                ) : (
                  <div className="space-y-3">
                    {assignedCases.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                        <p className="font-medium text-card-foreground">{item.title || 'Untitled case'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description || 'No description available.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === 'quizzes' ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">Assigned Quizzes</h2>
                  <Button onClick={onOpenAssignQuiz}>Assign Quiz</Button>
                </div>
                {assignedQuizzes.length === 0 ? (
                  <EmptyState title="No assigned quizzes" description="Assign a quiz session to this class." />
                ) : (
                  <div className="space-y-3">
                    {assignedQuizzes.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                        <p className="font-medium text-card-foreground">{item.title || 'Untitled quiz'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.topic || 'General topic'} - Pass score {item.passingScore ?? 70}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>

      <Modal
        open={enrollModalOpen}
        onClose={() => !enrollSubmitting && setEnrollModalOpen(false)}
        title="Enroll Students"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEnrollModalOpen(false)} disabled={enrollSubmitting}>
              Cancel
            </Button>
            <Button onClick={onEnrollMany} isLoading={enrollSubmitting} disabled={selectedStudentIds.size === 0}>
              Enroll Selected
            </Button>
          </div>
        }
      >
        {availableStudents.length === 0 ? (
          <EmptyState title="No available students" description="All students may already be enrolled." />
        ) : (
          <div className="space-y-2">
            {availableStudents.map((student) => {
              const checked = selectedStudentIds.has(student.studentId);
              return (
                <label key={student.studentId} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedStudentIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(student.studentId)) next.delete(student.studentId);
                        else next.add(student.studentId);
                        return next;
                      })
                    }
                  />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{student.studentName || 'Unknown student'}</p>
                    <p className="text-xs text-muted-foreground">{student.studentEmail || 'No email'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={assignCasesOpen}
        onClose={() => !assignCasesSubmitting && setAssignCasesOpen(false)}
        title="Assign Cases"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignCasesOpen(false)} disabled={assignCasesSubmitting}>
              Cancel
            </Button>
            <Button onClick={onAssignCases} isLoading={assignCasesSubmitting} disabled={selectedCaseIds.size === 0}>
              Assign Cases
            </Button>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Due Date</label>
            <Input type="datetime-local" value={caseDueDate} onChange={(event) => setCaseDueDate(event.target.value)} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-card-foreground md:mt-8">
            <input type="checkbox" checked={caseMandatory} onChange={(event) => setCaseMandatory(event.target.checked)} />
            Mandatory assignment
          </label>
        </div>
        {availableCasesToAssign.length === 0 ? (
          <EmptyState title="No available cases" description="All cases in your library are already assigned." />
        ) : (
          <div className="space-y-2">
            {availableCasesToAssign.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
                <input
                  type="checkbox"
                  checked={selectedCaseIds.has(item.id)}
                  onChange={() =>
                    setSelectedCaseIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.title || 'Untitled case'}</p>
                  <p className="text-xs text-muted-foreground">{item.description || 'No description'}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={assignQuizOpen}
        onClose={() => !assignQuizSubmitting && setAssignQuizOpen(false)}
        title="Assign Quiz"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignQuizOpen(false)} disabled={assignQuizSubmitting}>
              Cancel
            </Button>
            <Button onClick={onAssignQuiz} isLoading={assignQuizSubmitting}>
              Assign Quiz
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Quiz</label>
            <select
              value={selectedQuizId}
              onChange={(event) => setSelectedQuizId(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="">Select quiz</option>
              {availableQuizzesToAssign.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title || 'Untitled quiz'}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Open Time</label>
              <Input type="datetime-local" value={quizOpenTime} onChange={(event) => setQuizOpenTime(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Close Time</label>
              <Input type="datetime-local" value={quizCloseTime} onChange={(event) => setQuizCloseTime(event.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Time Limit (minutes)</label>
              <Input type="number" min={1} value={quizTimeLimit} onChange={(event) => setQuizTimeLimit(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Passing Score (%)</label>
              <Input type="number" min={0} max={100} value={quizPassingScore} onChange={(event) => setQuizPassingScore(event.target.value)} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
