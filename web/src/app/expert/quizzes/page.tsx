'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import {
  FileText, Search, Plus, CheckCircle, Clock, Trash2, Eye,
  ChevronDown, ChevronRight, Users, Calendar, BarChart3, Target,
} from 'lucide-react';

type QuizStatus = 'active' | 'draft' | 'closed';

interface Quiz {
  id: string;
  title: string;
  topic: string;
  questionCount: number;
  difficulty: string;
  status: QuizStatus;
  createdBy: string;
  createdAt: string;
  assignedClasses: string[];
  completions: number;
  avgScore: number;
  passingScore: number;
}

const initialQuizzes: Quiz[] = [
  { id: '1', title: 'Fracture Classification Basics', topic: 'Fracture Classification', questionCount: 15, difficulty: 'Basic', status: 'active', createdBy: 'Dr. Pham Expert', createdAt: '2026-01-15', assignedClasses: ['SE1801', 'SE1802'], completions: 45, avgScore: 78, passingScore: 60 },
  { id: '2', title: 'Knee Pathology Assessment', topic: 'Degenerative Disease', questionCount: 20, difficulty: 'Intermediate', status: 'active', createdBy: 'Dr. Hoang Expert', createdAt: '2026-02-01', assignedClasses: ['SE1803'], completions: 22, avgScore: 72, passingScore: 65 },
  { id: '3', title: 'Bone Tumor Identification', topic: 'Bone Tumor', questionCount: 12, difficulty: 'Advanced', status: 'draft', createdBy: 'Dr. Pham Expert', createdAt: '2026-03-10', assignedClasses: [], completions: 0, avgScore: 0, passingScore: 70 },
  { id: '4', title: 'Spine Imaging Fundamentals', topic: 'Spine', questionCount: 18, difficulty: 'Intermediate', status: 'active', createdBy: 'Dr. Hoang Expert', createdAt: '2025-12-20', assignedClasses: ['SE1801', 'SE1804'], completions: 38, avgScore: 81, passingScore: 60 },
  { id: '5', title: 'Pediatric Fracture Patterns', topic: 'Pediatric', questionCount: 10, difficulty: 'Intermediate', status: 'closed', createdBy: 'Dr. Pham Expert', createdAt: '2025-10-05', assignedClasses: ['SE1802'], completions: 28, avgScore: 75, passingScore: 60 },
  { id: '6', title: 'Trauma Radiology Quiz', topic: 'Trauma', questionCount: 25, difficulty: 'Advanced', status: 'draft', createdBy: 'Dr. Hoang Expert', createdAt: '2026-03-18', assignedClasses: [], completions: 0, avgScore: 0, passingScore: 65 },
];

const statusConfig: Record<QuizStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Active' },
  draft: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Draft' },
  closed: { icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Closed' },
};

export default function ExpertQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuizStatus | 'All'>('All');
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newQuestionCount, setNewQuestionCount] = useState(10);
  const [newDifficulty, setNewDifficulty] = useState('Intermediate');
  const [newPassingScore, setNewPassingScore] = useState(60);

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      const match = q.title.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || q.status === filterStatus;
      return match && matchStatus;
    });
  }, [quizzes, search, filterStatus]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newQuiz: Quiz = {
      id: `q-${Date.now()}`, title: newTitle.trim(), topic: newTopic || 'General', questionCount: newQuestionCount,
      difficulty: newDifficulty, status: 'draft', createdBy: 'Dr. Expert', createdAt: new Date().toISOString().split('T')[0],
      assignedClasses: [], completions: 0, avgScore: 0, passingScore: newPassingScore,
    };
    setQuizzes((prev) => [newQuiz, ...prev]);
    setNewTitle(''); setNewTopic(''); setNewQuestionCount(10); setNewDifficulty('Intermediate'); setNewPassingScore(60);
    setShowCreate(false);
  };

  const handleDelete = (id: string) => setQuizzes((prev) => prev.filter((q) => q.id !== id));
  const handleActivate = (id: string) => setQuizzes((prev) => prev.map((q) => q.id === id ? { ...q, status: 'active' as QuizStatus } : q));

  return (
    <div className="min-h-screen">
      <Header title="Quiz Management" subtitle={`${quizzes.length} quizzes`} />
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium"><Plus className="w-4 h-4" />Create Quiz</button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as QuizStatus | 'All')} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer">
            <option value="All">All Status</option><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option>
          </select>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="font-semibold text-card-foreground mb-4">Create New Quiz</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Title</label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Quiz title..." className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Topic</label><input type="text" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="e.g., Fracture Classification" className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Number of Questions</label><input type="number" value={newQuestionCount} onChange={(e) => setNewQuestionCount(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Difficulty</label><select value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"><option>Basic</option><option>Intermediate</option><option>Advanced</option></select></div>
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Passing Score (%)</label><input type="number" value={newPassingScore} onChange={(e) => setNewPassingScore(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Quizzes List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-lg font-medium text-card-foreground">No quizzes found</p></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((quiz) => {
                const st = statusConfig[quiz.status];
                const StIcon = st.icon;
                const isExp = expandedQuiz === quiz.id;
                return (
                  <div key={quiz.id} className="px-5 py-4 hover:bg-input/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => setExpandedQuiz(isExp ? null : quiz.id)} className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0">
                        {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground">{quiz.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded font-medium">{quiz.topic}</span>
                            <span>{quiz.questionCount} questions</span>
                            <span>&middot;</span>
                            <span>{quiz.difficulty}</span>
                          </div>
                        </div>
                      </button>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.color}`}><StIcon className="w-3.5 h-3.5" />{st.label}</span>
                    </div>

                    {isExp && (
                      <div className="mt-3 ml-6 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg bg-input/30 text-center"><Users className="w-4 h-4 text-primary mx-auto mb-1" /><p className="text-lg font-bold text-card-foreground">{quiz.completions}</p><p className="text-xs text-muted-foreground">Completions</p></div>
                          <div className="p-3 rounded-lg bg-input/30 text-center"><BarChart3 className="w-4 h-4 text-accent mx-auto mb-1" /><p className="text-lg font-bold text-card-foreground">{quiz.avgScore || '-'}%</p><p className="text-xs text-muted-foreground">Avg Score</p></div>
                          <div className="p-3 rounded-lg bg-input/30 text-center"><Target className="w-4 h-4 text-warning mx-auto mb-1" /><p className="text-lg font-bold text-card-foreground">{quiz.passingScore}%</p><p className="text-xs text-muted-foreground">Pass Score</p></div>
                          <div className="p-3 rounded-lg bg-input/30 text-center"><Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" /><p className="text-sm font-bold text-card-foreground">{quiz.createdAt}</p><p className="text-xs text-muted-foreground">Created</p></div>
                        </div>
                        {quiz.assignedClasses.length > 0 && (
                          <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Assigned to:</span>{quiz.assignedClasses.map((cls) => <span key={cls} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{cls}</span>)}</div>
                        )}
                        <div className="flex items-center gap-2">
                          {quiz.status === 'draft' && <button onClick={() => handleActivate(quiz.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 cursor-pointer transition-colors"><CheckCircle className="w-3.5 h-3.5" />Activate</button>}
                          <button onClick={() => handleDelete(quiz.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
