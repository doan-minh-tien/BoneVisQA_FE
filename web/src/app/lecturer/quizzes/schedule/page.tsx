'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { fetchLecturerClasses, assignQuizToLecturerClass } from '@/lib/api/lecturer-classes';
import { getUnassignedLecturerQuizzes } from '@/lib/api/lecturer-quiz';
import type { QuizDto } from '@/lib/api/types';
import type { ClassItem } from '@/lib/api/types';

export interface ScheduleFormData {
  quizId: string;
  selectedClassIds: string[];
  openTime: string;
  closeTime: string;
  timeLimitMinutes: number | null;
  attempts: number | null; // null = unlimited
  allowLate: boolean;
}

interface ScheduleResult {
  success: boolean;
  className: string;
  message?: string;
}

export default function ScheduleQuizWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ScheduleFormData>({
    quizId: '',
    selectedClassIds: [],
    openTime: '',
    closeTime: '',
    timeLimitMinutes: 45,
    attempts: null,
    allowLate: false,
  });
  const [schedulingResults, setSchedulingResults] = useState<ScheduleResult[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  // Fetch data
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['lecturer', 'quizzes', 'unassigned'],
    queryFn: () => getUnassignedLecturerQuizzes(''),
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['lecturer', 'classes'],
    queryFn: fetchLecturerClasses,
  });

  // Selected quiz
  const selectedQuiz = quizzes.find((q) => q.id === formData.quizId);

  // Filter classes that don't already have this quiz
  const availableClasses = classes.filter((cls) => {
    // All classes are available for now
    return true;
  });

  const handleQuizSelect = (quizId: string) => {
    setFormData((prev) => ({ ...prev, quizId }));
  };

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedClassIds: prev.selectedClassIds.includes(classId)
        ? prev.selectedClassIds.filter((id) => id !== classId)
        : [...prev.selectedClassIds, classId],
    }));
  };

  const handleSelectAllClasses = () => {
    if (formData.selectedClassIds.length === availableClasses.length) {
      setFormData((prev) => ({ ...prev, selectedClassIds: [] }));
    } else {
      setFormData((prev) => ({ ...prev, selectedClassIds: availableClasses.map((c) => c.id) }));
    }
  };

  const canProceedStep1 = formData.quizId && formData.selectedClassIds.length > 0;
  const canProceedStep2 = formData.openTime && formData.closeTime && new Date(formData.closeTime) > new Date(formData.openTime);

  const handleSchedule = async () => {
    setIsScheduling(true);
    const results: ScheduleResult[] = [];

    for (const classId of formData.selectedClassIds) {
      try {
        const classObj = classes.find((c) => c.id === classId);
        await assignQuizToLecturerClass(classId, {
          quizId: formData.quizId,
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          timeLimitMinutes: formData.timeLimitMinutes ?? undefined,
          passingScore: 70,
        });
        results.push({ success: true, className: classObj?.className || classId });
      } catch (error) {
        const classObj = classes.find((c) => c.id === classId);
        results.push({ 
          success: false, 
          className: classObj?.className || classId,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setSchedulingResults(results);
    setIsScheduling(false);
    void queryClient.invalidateQueries({ queryKey: ['lecturer', 'quizzes'] });
    void queryClient.invalidateQueries({ queryKey: ['lecturer', 'classes'] });
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title="Schedule Quiz"
        subtitle="Create a schedule for your quiz and assign it to classes"
      />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  currentStep >= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`h-0.5 w-16 transition-colors ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between px-4">
          <div className={`text-center flex-1 ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
            <span className="text-sm font-medium">Select Quiz & Classes</span>
          </div>
          <div className="flex-1" />
          <div className={`text-center flex-1 ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
            <span className="text-sm font-medium">Configure Time</span>
          </div>
          <div className="flex-1" />
          <div className={`text-center flex-1 ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
            <span className="text-sm font-medium">Review & Confirm</span>
          </div>
        </div>

        {/* Step 1: Select Quiz & Classes */}
        {currentStep === 1 && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">Select Quiz and Classes</h2>
                <p className="text-sm text-muted-foreground">Choose a quiz and the classes to assign it to</p>
              </div>
            </div>

            {/* Quiz Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Select Quiz</label>
              {quizzesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      type="button"
                      onClick={() => handleQuizSelect(quiz.id)}
                      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        formData.quizId === quiz.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-semibold text-foreground">{quiz.title || quiz.quizName || 'Untitled Quiz'}</div>
                      <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {quiz.topic && <span className="rounded bg-muted px-1.5 py-0.5">{quiz.topic}</span>}
                        {quiz.difficulty && <span className="rounded bg-muted px-1.5 py-0.5">{quiz.difficulty}</span>}
                        {quiz.questionCount !== undefined && (
                          <span className="rounded bg-muted px-1.5 py-0.5">{quiz.questionCount} questions</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {quizzes.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-muted-foreground">
                      No quizzes available. Create a quiz first.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Class Selection */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Select Classes</label>
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="text-xs text-primary hover:underline"
                >
                  {formData.selectedClassIds.length === availableClasses.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {classesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableClasses.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => handleClassToggle(cls.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        formData.selectedClassIds.includes(cls.id)
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                          formData.selectedClassIds.includes(cls.id)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {formData.selectedClassIds.includes(cls.id) && (
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground">{cls.className}</div>
                        <div className="text-xs text-muted-foreground">{cls.semester || 'No semester'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1}
                className="gap-2"
              >
                Next: Configure Time
                <span className="text-lg">→</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Time */}
        {currentStep === 2 && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">Configure Quiz Timing</h2>
                <p className="text-sm text-muted-foreground">Set when the quiz opens, closes, and time limits</p>
              </div>
            </div>

            {/* Quiz Summary */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-sm font-medium text-muted-foreground">Selected Quiz</div>
              <div className="font-semibold text-foreground">
                {selectedQuiz?.title || selectedQuiz?.quizName || 'Unknown Quiz'}
              </div>
              <div className="text-sm text-muted-foreground">
                {formData.selectedClassIds.length} class{formData.selectedClassIds.length !== 1 ? 'es' : ''} selected
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Quiz Opens <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.openTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, openTime: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Quiz Closes <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.closeTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, closeTime: e.target.value }))}
                  min={formData.openTime}
                  className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={formData.timeLimitMinutes ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeLimitMinutes: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                placeholder="No time limit"
                min={1}
                max={300}
                className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave empty for no time limit</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Attempts Allowed</label>
              <input
                type="number"
                value={formData.attempts ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    attempts: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                placeholder="Unlimited"
                min={1}
                className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave empty for unlimited attempts</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowLate"
                checked={formData.allowLate}
                onChange={(e) => setFormData((prev) => ({ ...prev, allowLate: e.target.checked }))}
                className="h-5 w-5 rounded border-border bg-input text-primary focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="allowLate" className="text-sm font-medium text-foreground">
                Allow late submissions
              </label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                <span className="text-lg">←</span> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedStep2}
                className="gap-2"
              >
                Next: Review
                <span className="text-lg">→</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === 3 && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">Review and Confirm</h2>
                <p className="text-sm text-muted-foreground">Review your settings before scheduling the quiz</p>
              </div>
            </div>

            {/* Review Summary */}
            <div className="space-y-4">
              {/* Quiz Info */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-medium text-muted-foreground">Quiz</div>
                <div className="mt-1 font-semibold text-lg text-foreground">
                  {selectedQuiz?.title || selectedQuiz?.quizName || 'Unknown Quiz'}
                </div>
                {selectedQuiz?.topic && (
                  <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs">
                    {selectedQuiz.topic}
                  </span>
                )}
              </div>

              {/* Classes */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Assigning to {formData.selectedClassIds.length} class{formData.selectedClassIds.length !== 1 ? 'es' : ''}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.selectedClassIds.map((classId) => {
                    const cls = classes.find((c) => c.id === classId);
                    return (
                      <span
                        key={classId}
                        className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                      >
                        {cls?.className || classId}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Timing */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-medium text-muted-foreground">Schedule</div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Opens:</span> {formatDateTime(formData.openTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Closes:</span> {formatDateTime(formData.closeTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-medium text-muted-foreground">Quiz Settings</div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Time Limit</div>
                    <div className="font-medium">
                      {formData.timeLimitMinutes ? `${formData.timeLimitMinutes} minutes` : 'No limit'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Attempts</div>
                    <div className="font-medium">
                      {formData.attempts ? formData.attempts : 'Unlimited'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Late Submissions</div>
                    <div className="font-medium">{formData.allowLate ? 'Allowed' : 'Not allowed'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {schedulingResults.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground">Scheduling Results</h3>
                <div className="mt-3 space-y-2">
                  {schedulingResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-lg p-3 ${
                        result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                      )}
                      <span className="font-medium">{result.className}</span>
                      {result.message && (
                        <span className="text-sm">- {result.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
                <span className="text-lg">←</span> Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      quizId: '',
                      selectedClassIds: [],
                      openTime: '',
                      closeTime: '',
                      timeLimitMinutes: 45,
                      attempts: null,
                      allowLate: false,
                    });
                    setCurrentStep(1);
                    setSchedulingResults([]);
                  }}
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={isScheduling}
                  className="gap-2"
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Schedule Quiz
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {schedulingResults.length > 0 && schedulingResults.every((r) => r.success) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-emerald-600" />
            <h3 className="mt-2 font-semibold text-emerald-800">Quiz Scheduled Successfully!</h3>
            <p className="mt-1 text-sm text-emerald-600">
              The quiz has been assigned to {schedulingResults.length} class(es).
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/lecturer/quizzes')}
              className="mt-4 gap-2"
            >
              View Quizzes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
