'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  FileText,
  Settings2,
  Eye,
  Save,
  Send,
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  CalendarDays,
  BookOpen,
  Users,
  Star,
  Shuffle,
  BarChart2,
  AlertCircle,
  ClipboardList,
  Zap,
  Microscope,
  Stethoscope,
} from 'lucide-react';

const availableClasses = [
  { id: '1', name: 'Orthopedics - Advanced Imaging', code: 'ORTH-301', students: 32 },
  { id: '2', name: 'Musculoskeletal Radiology', code: 'RAD-205', students: 28 },
  { id: '3', name: 'Clinical Practice - Bone Diseases', code: 'CLIN-401', students: 24 },
  { id: '4', name: 'Introduction to Bone Anatomy', code: 'ANAT-101', students: 45 },
  { id: '5', name: 'Pediatric Orthopedics', code: 'PEDI-302', students: 19 },
];

const assignmentTypes = [
  {
    value: 'Case Analysis',
    description: 'Students analyze medical cases and submit reports',
    icon: Microscope,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
  },
  {
    value: 'Quiz',
    description: 'Multiple choice questions, auto-graded',
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500',
  },
  {
    value: 'Lab Report',
    description: 'Students submit lab reports as files',
    icon: ClipboardList,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
  },
  {
    value: 'Practical Exam',
    description: 'Hands-on examination with file submission',
    icon: Stethoscope,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500',
  },
];

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

const createEmptyQuestion = (): Question => ({
  id: Date.now().toString(),
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  points: 10,
});

const steps = [
  { label: 'Basic Info', icon: FileText, description: 'Title, type & classes' },
  { label: 'Configuration', icon: Settings2, description: 'Due date & settings' },
  { label: 'Questions', icon: HelpCircle, description: 'Quiz questions' },
  { label: 'Review', icon: Eye, description: 'Review & publish' },
];

function CreateAssignmentPageContent({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string | string[] }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const classIdParam = resolvedSearchParams.classId;
  const preselectedClassId = Array.isArray(classIdParam)
    ? classIdParam[0]
    : classIdParam;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    selectedClasses: preselectedClassId ? [preselectedClassId] : ([] as string[]),
    description: '',
    dueDate: '',
    maxScore: 100,
    allowLate: false,
    instructions: '',
    questions: [createEmptyQuestion()] as Question[],
    timeLimitMinutes: 60,
    shuffleQuestions: false,
    showResults: true,
  });

  const isQuiz = formData.type === 'Quiz';

  const visibleSteps = isQuiz
    ? steps
    : steps.filter((s) => s.label !== 'Questions');

  const lastStep = visibleSteps.length - 1;
  const currentStepLabel = visibleSteps[currentStep]?.label;

  const toggleClass = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter((id) => id !== classId)
        : [...prev.selectedClasses, classId],
    }));
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()],
    }));
  };

  const removeQuestion = (id: string) => {
    if (formData.questions.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const updateQuestion = (id: string, field: keyof Question, value: string | number | string[]) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== questionId) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }),
    }));
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.title && formData.type && formData.selectedClasses.length > 0;
    if (currentStep === 1) return !!formData.dueDate;
    if (isQuiz && currentStepLabel === 'Questions') {
      return formData.questions.every((q) => q.question && q.options.every((o) => o) && q.points > 0);
    }
    return true;
  };

  const totalQuizPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);
  const selectedClassData = formData.selectedClasses
    .map((id) => availableClasses.find((c) => c.id === id))
    .filter(Boolean);

  const selectedType = assignmentTypes.find((t) => t.value === formData.type);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/lecturer/assignments" className="hover:text-primary transition-colors">
                Assignments
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Create New</span>
            </div>
            <h1 className="text-lg font-semibold text-card-foreground">Create Assignment</h1>
          </div>

          {/* Step progress in header */}
          <div className="hidden md:flex items-center gap-1">
            {visibleSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={step.label} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isCompleted
                        ? 'bg-success/15 text-success'
                        : isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                    {step.label}
                  </div>
                  {idx < visibleSteps.length - 1 && (
                    <ChevronRight className={`w-3 h-3 ${isCompleted ? 'text-success' : 'text-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto p-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Step 1: Basic Info */}
            {currentStepLabel === 'Basic Info' && (
              <div className="space-y-5">
                {/* Title */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    Assignment Title
                  </h2>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Case Analysis: Complex Tibial Fractures"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  {formData.title && (
                    <p className="text-xs text-muted-foreground mt-2">{formData.title.length} characters</p>
                  )}
                </div>

                {/* Assignment Type */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    Assignment Type
                    <span className="text-destructive">*</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {assignmentTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.type === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setFormData({ ...formData, type: type.value })}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? `${type.border} ${type.bg}`
                              : 'border-border bg-background hover:bg-muted/50'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className={`w-9 h-9 rounded-lg ${type.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${type.color}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isSelected ? type.color : 'text-card-foreground'}`}>
                              {type.value}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{type.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Classes */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-card-foreground mb-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    Assign to Classes
                    <span className="text-destructive">*</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4 ml-8">
                    Select one or more classes for this assignment
                  </p>

                  {formData.selectedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      {formData.selectedClasses.map((classId) => {
                        const cls = availableClasses.find((c) => c.id === classId);
                        if (!cls) return null;
                        return (
                          <span
                            key={classId}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white rounded-full text-xs font-medium"
                          >
                            {cls.code}
                            <button
                              onClick={() => toggleClass(classId)}
                              className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    {availableClasses.map((cls) => {
                      const isSelected = formData.selectedClasses.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          onClick={() => toggleClass(cls.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary/5 border-primary/40'
                              : 'bg-background border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary/15' : 'bg-muted'}`}>
                              <BookOpen className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{cls.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {cls.code} · {cls.students} students
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-card-foreground mb-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">4</span>
                    </div>
                    Description
                    <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mb-3 ml-8">Briefly describe the assignment objectives</p>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the assignment objectives and requirements..."
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {currentStepLabel === 'Configuration' && (
              <div className="space-y-5">
                {/* Due Date & Score */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Schedule & Scoring
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Due Date & Time <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>

                    {!isQuiz ? (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Score</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.maxScore}
                            onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                            min={0}
                            className="w-full px-4 py-2.5 pr-12 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">pts</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Limit</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.timeLimitMinutes}
                            onChange={(e) => setFormData({ ...formData, timeLimitMinutes: Number(e.target.value) })}
                            min={1}
                            className="w-full px-4 py-2.5 pr-14 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">min</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Toggles */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    Submission Settings
                  </h2>
                  <div className="space-y-3">
                    <ToggleRow
                      title="Allow Late Submission"
                      description="Students can submit after the due date"
                      value={formData.allowLate}
                      onChange={() => setFormData({ ...formData, allowLate: !formData.allowLate })}
                      icon={<AlertCircle className="w-4 h-4 text-warning" />}
                    />
                    {isQuiz && (
                      <>
                        <ToggleRow
                          title="Shuffle Questions"
                          description="Randomize question order for each student"
                          value={formData.shuffleQuestions}
                          onChange={() => setFormData({ ...formData, shuffleQuestions: !formData.shuffleQuestions })}
                          icon={<Shuffle className="w-4 h-4 text-accent" />}
                        />
                        <ToggleRow
                          title="Show Results After Submission"
                          description="Students can see correct answers after completing"
                          value={formData.showResults}
                          onChange={() => setFormData({ ...formData, showResults: !formData.showResults })}
                          icon={<BarChart2 className="w-4 h-4 text-success" />}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Instructions (non-quiz) */}
                {!isQuiz && (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h2 className="text-sm font-semibold text-card-foreground mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Student Instructions
                      <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mb-3 ml-6">
                      Provide detailed instructions and grading criteria
                    </p>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Provide detailed instructions, grading criteria, and any additional notes..."
                      rows={6}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Questions */}
            {currentStepLabel === 'Questions' && (
              <div className="space-y-4">
                {/* Stats bar */}
                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-card-foreground leading-none">{formData.questions.length}</p>
                        <p className="text-xs text-muted-foreground">Questions</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-card-foreground leading-none">{totalQuizPoints}</p>
                        <p className="text-xs text-muted-foreground">Total pts</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-card-foreground leading-none">{formData.timeLimitMinutes}</p>
                        <p className="text-xs text-muted-foreground">Min limit</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {/* Questions list */}
                {formData.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    {/* Question header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{qIdx + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-card-foreground">Question {qIdx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) => updateQuestion(q.id, 'points', Number(e.target.value))}
                            min={1}
                            className="w-14 px-2 py-1 bg-background border border-border rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                          <span className="text-xs text-muted-foreground">pts</span>
                        </div>
                        {formData.questions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(q.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Question text */}
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                        placeholder="Enter your question here..."
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />

                      {/* Options */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Answer Options — click a letter to mark as correct</p>
                        {q.options.map((option, optIdx) => {
                          const isCorrect = q.correctAnswer === optIdx;
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <div key={optIdx} className="flex items-center gap-2.5">
                              <button
                                onClick={() => updateQuestion(q.id, 'correctAnswer', optIdx)}
                                title={isCorrect ? 'Correct answer' : 'Mark as correct'}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                                  isCorrect
                                    ? 'bg-success border-success text-white shadow-sm shadow-success/30'
                                    : 'border-border text-muted-foreground hover:border-success/50 hover:text-success'
                                }`}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                placeholder={`Option ${letter}...`}
                                className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                                  isCorrect
                                    ? 'bg-success/5 border-success/40 focus:ring-success/30'
                                    : 'bg-background border-border focus:ring-primary/40'
                                }`}
                              />
                              {isCorrect && (
                                <span className="text-xs text-success font-medium flex items-center gap-1 flex-shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add question button */}
                <button
                  onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Add Another Question</span>
                </button>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStepLabel === 'Review' && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/20">
                    <h3 className="text-sm font-semibold text-card-foreground">Assignment Summary</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Review everything before publishing</p>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Title & Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <ReviewItem label="Title" value={formData.title || '—'} />
                      <ReviewItem
                        label="Type"
                        value={formData.type || '—'}
                        badge={selectedType ? { color: selectedType.color, bg: selectedType.bg } : undefined}
                      />
                    </div>

                    {/* Classes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Assigned Classes</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedClassData.length > 0 ? (
                          selectedClassData.map((cls) => (
                            <div key={cls!.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                              <Users className="w-3 h-3" />
                              {cls!.code}
                              <span className="text-primary/60">· {cls!.students} students</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>

                    {formData.description && (
                      <ReviewItem label="Description" value={formData.description} />
                    )}

                    {/* Config grid */}
                    <div className={`grid grid-cols-2 ${isQuiz ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
                      <ReviewItem
                        label="Due Date"
                        value={formData.dueDate ? new Date(formData.dueDate).toLocaleString() : '—'}
                        icon={<CalendarDays className="w-3.5 h-3.5" />}
                      />
                      <ReviewItem
                        label={isQuiz ? 'Total Points' : 'Max Score'}
                        value={String(isQuiz ? totalQuizPoints : formData.maxScore)}
                        icon={<Star className="w-3.5 h-3.5" />}
                      />
                      <ReviewItem
                        label="Late Submission"
                        value={formData.allowLate ? 'Allowed' : 'Not allowed'}
                        icon={<AlertCircle className="w-3.5 h-3.5" />}
                      />
                      {isQuiz && (
                        <ReviewItem
                          label="Time Limit"
                          value={`${formData.timeLimitMinutes} min`}
                          icon={<Clock className="w-3.5 h-3.5" />}
                        />
                      )}
                    </div>

                    {isQuiz && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Quiz Questions ({formData.questions.length})
                        </p>
                        <div className="space-y-2">
                          {formData.questions.map((q, idx) => (
                            <div key={q.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                              <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-card-foreground">{q.question || 'Untitled question'}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">{q.points} pts</span>
                                  <span className="text-xs text-success font-medium">
                                    Answer: {String.fromCharCode(65 + q.correctAnswer)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isQuiz && formData.instructions && (
                      <ReviewItem label="Instructions" value={formData.instructions} multiline />
                    )}
                  </div>
                </div>

                {/* Publish note */}
                <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/30 rounded-xl">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Ready to publish</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Once published, students in the selected classes will be notified and can start submitting.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
              <div>
                {currentStep > 0 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <Link
                    href="/lecturer/assignments"
                    className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Cancel
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep === lastStep && (
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm cursor-pointer">
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                )}

                {currentStep < lastStep ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      canProceed()
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-lg hover:bg-success/90 transition-colors text-sm font-medium shadow-sm shadow-success/20 cursor-pointer">
                    <Send className="w-4 h-4" />
                    Publish Assignment
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Preview */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Assignment preview card */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live Preview</p>
                </div>
                <div className="p-4 space-y-3">
                  {formData.type && selectedType && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${selectedType.bg} rounded-full`}>
                      {(() => {
                        const Icon = selectedType.icon;
                        return <Icon className={`w-3.5 h-3.5 ${selectedType.color}`} />;
                      })()}
                      <span className={`text-xs font-medium ${selectedType.color}`}>{formData.type}</span>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-card-foreground">
                      {formData.title || <span className="text-muted-foreground italic">No title yet</span>}
                    </p>
                    {formData.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{formData.description}</p>
                    )}
                  </div>

                  {formData.selectedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedClassData.slice(0, 3).map((cls) => (
                        <span key={cls!.id} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          {cls!.code}
                        </span>
                      ))}
                      {selectedClassData.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          +{selectedClassData.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 border-t border-border">
                    {formData.dueDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Due {new Date(formData.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {isQuiz ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5" />
                        {totalQuizPoints} points · {formData.questions.length} questions
                      </div>
                    ) : (
                      formData.maxScore > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star className="w-3.5 h-3.5" />
                          {formData.maxScore} points
                        </div>
                      )
                    )}
                    {formData.selectedClasses.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {selectedClassData.reduce((sum, c) => sum + (c?.students ?? 0), 0)} students total
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion checklist */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Checklist</p>
                <div className="space-y-2">
                  <ChecklistItem done={!!formData.title} label="Assignment title" />
                  <ChecklistItem done={!!formData.type} label="Assignment type" />
                  <ChecklistItem done={formData.selectedClasses.length > 0} label="At least one class" />
                  <ChecklistItem done={!!formData.dueDate} label="Due date set" />
                  {isQuiz && (
                    <ChecklistItem
                      done={formData.questions.length > 0 && formData.questions.every((q) => q.question)}
                      label="Questions complete"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-card-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ml-4 ${
          value ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function ReviewItem({
  label,
  value,
  icon,
  badge,
  multiline,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  badge?: { color: string; bg: string };
  multiline?: boolean;
}) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      {badge ? (
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${badge.bg} ${badge.color}`}>
          {value}
        </span>
      ) : (
        <p className={`text-sm font-medium text-card-foreground ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
      )}
    </div>
  );
}

export default function CreateAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string | string[] }>;
}) {
  return <CreateAssignmentPageContent searchParams={searchParams} />;
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          done ? 'bg-success border-success' : 'border-border'
        }`}
      >
        {done && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className={`text-xs ${done ? 'text-card-foreground' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}
