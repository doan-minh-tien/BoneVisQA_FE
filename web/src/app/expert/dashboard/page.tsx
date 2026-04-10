'use client';

import { useEffect, useState } from 'react';
import {
  fetchExpertStats,
  fetchExpertPendingReviews,
  fetchExpertRecentCases,
  fetchExpertActivity,
  type ExpertStats,
  type ExpertPendingReview,
  type ExpertRecentCase,
  type ExpertActivity,
} from '@/lib/api/expert-dashboard';
import { useToast } from '@/components/ui/toast';
import {
  BarChart3,
  ClipboardList,
  FolderClock,
  Activity,
  CheckCircle2,
  Users,
  FileText,
  Clock,
  Loader2,
  AlertTriangle,
  FileQuestion,
  Info
} from 'lucide-react';

export default function ExpertDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<ExpertPendingReview[]>([]);
  const [recentCases, setRecentCases] = useState<ExpertRecentCase[]>([]);
  const [activity, setActivity] = useState<ExpertActivity | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsData, reviewsData, casesData, activityData] = await Promise.all([
          fetchExpertStats(),
          fetchExpertPendingReviews(),
          fetchExpertRecentCases(),
          fetchExpertActivity(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setPendingReviews(reviewsData);
          setRecentCases(casesData);
          setActivity(activityData);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-xl">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-medium animate-pulse">Gathering insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-slate-50">
        <div className="max-w-2xl mx-auto rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-rose-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-rose-700/80">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate chart max height scale
  const maxBarValue = Math.max(
    ...(activity?.weeklyActivity.map(a => Math.max(a.reviews, a.cases)) || [1])
  ) || 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-8 mb-8 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expert Dashboard</h1>
            <p className="text-slate-500 mt-1font-medium">System Overview & Live Insights</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-600">Live Data Sync</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* BLOCK 1: STATS */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner border border-indigo-100/50">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800">Overview Statistics</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatBox label="Total Cases" value={stats?.totalCases} icon={<FileText className="w-5 h-5" />} theme="blue" />
            <StatBox label="Total Reviews" value={stats?.totalReviews} icon={<ClipboardList className="w-5 h-5" />} theme="purple" />
            <StatBox label="Pending Reviews" value={stats?.pendingReviews} icon={<Clock className="w-5 h-5" />} theme="amber" />
            <StatBox label="Approved Month" value={stats?.approvedThisMonth} icon={<CheckCircle2 className="w-5 h-5" />} theme="emerald" />
            <StatBox label="Student Int." value={stats?.studentInteractions} icon={<Users className="w-5 h-5" />} theme="rose" />
          </div>
        </div>

        {/* BLOCK 2: ACTIVITY */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="flex items-center justify-between mb-8 relative">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl shadow-inner border border-orange-100/50">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Weekly Activity</h2>
            </div>
            <div className="text-right bg-white/80 backdrop-blur rounded-2xl px-4 py-2 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Avg Daily Reviews</p>
              <p className="text-3xl font-black bg-gradient-to-br from-orange-600 to-rose-500 bg-clip-text text-transparent">{activity?.avgDailyReviews || 0}</p>
            </div>
          </div>

          <div className="h-[220px] flex items-end justify-between gap-3 mt-6 px-2 relative">
            {activity?.weeklyActivity.map((day, idx) => {
              const reviewHeight = `${(day.reviews / maxBarValue) * 100}%`;
              const caseHeight = `${(day.cases / maxBarValue) * 100}%`;
              return (
                <div key={idx} className="flex flex-col items-center gap-4 flex-1 group">
                  <div className="w-full h-[160px] flex justify-center items-end gap-1.5 relative">
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl pointer-events-none whitespace-nowrap z-10 shadow-xl flex gap-3">
                      <span className="text-purple-300">{day.reviews} Revs</span>
                      <span className="text-blue-300">{day.cases} Cases</span>
                    </div>
                    <div
                      className="w-1/3 max-w-[20px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                      style={{ height: reviewHeight === '0%' ? '6px' : reviewHeight }}
                    />
                    <div
                      className="w-1/3 max-w-[20px] bg-gradient-to-t from-blue-600 to-cyan-400 rounded-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                      style={{ height: caseHeight === '0%' ? '6px' : caseHeight }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1 rounded-full">{day.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-8 mt-6 pt-5 border-t border-slate-100/60 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-t from-purple-600 to-purple-400 shadow-sm" />
              <span className="text-sm text-slate-600 font-bold">Reviews Processed</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-t from-blue-600 to-cyan-400 shadow-sm" />
              <span className="text-sm text-slate-600 font-bold">Cases Handled</span>
            </div>
          </div>
        </div>

        {/* BLOCK 3: PENDING REVIEWS */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] flex flex-col h-[560px]">
          <div className="flex items-center gap-4 mb-6 shrink-0">
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shadow-inner border border-rose-100/50">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">Pending Reviews</h2>
              <p className="text-sm font-medium text-slate-500">Items requiring your attention</p>
            </div>
            <div className="ml-auto bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black px-4 py-1.5 rounded-full shadow-md">
              {pendingReviews.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
            {pendingReviews.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400 opacity-60" />} title="All caught up!" message="No pending reviews require your attention right now." />
            ) : (
              pendingReviews.map(r => (
                <div key={r.id} className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100/80 hover:bg-white hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 shadow-sm">
                        {r.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                          {r.studentName}
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase tracking-wider">{r.priority}</span>
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">{r.caseTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                        {r.category}
                      </span>
                      <p className="text-[11px] font-bold text-slate-400 mt-2">{formatDate(r.submittedAt)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100/60 shadow-sm">
                      <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FileQuestion className="w-3.5 h-3.5" /> Question Snippet</p>
                      <p className="text-sm font-medium text-slate-700 italic line-clamp-2 leading-relaxed">"{r.questionSnippet}"</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100/60 shadow-sm border-l-4 border-l-purple-400">
                      <p className="text-[10px] font-black text-purple-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> AI Answer Snippet</p>
                      <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-relaxed">{r.aiAnswerSnippet}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BLOCK 4: RECENT CASES */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] flex flex-col h-[560px]">
          <div className="flex items-center gap-4 mb-6 shrink-0">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner border border-emerald-100/50">
              <FolderClock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">Recent Cases</h2>
              <p className="text-sm font-medium text-slate-500">Newly added clinical records</p>
            </div>
            <div className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-4 py-1.5 rounded-full shadow-md">
              {recentCases.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
            {recentCases.length === 0 ? (
              <EmptyState icon={<FolderClock className="w-12 h-12 mb-2 text-slate-300" />} title="No Cases Yet" message="Recent cases will appear here once they are submitted." />
            ) : (
              recentCases.map(c => (
                <div key={c.id} className="p-5 flex flex-col justify-between rounded-3xl bg-slate-50/50 border border-slate-100/80 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight line-clamp-2">{c.title}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                        Added by <span className="text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded-md">{c.addedBy}</span>
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <DetailItem label="Location" value={c.boneLocation} />
                    <DetailItem label="Lesion" value={c.lesionType} />
                    <DetailItem label="Difficulty" value={c.difficulty} />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 mt-1">
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                      {formatDate(c.addedDate)}
                    </span>
                    <div className="flex items-center gap-3 text-xs font-black text-slate-500">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="opacity-70">👁️</span>
                        <span className="text-slate-700">{c.viewCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="opacity-70">⚡</span>
                        <span className="text-slate-700">{c.usageCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Embedded Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
}

// ─── SUBCOMPONENTS ─────────────────────────────────────────────────────────────

type Theme = 'blue' | 'purple' | 'amber' | 'emerald' | 'rose';

function StatBox({ label, value, icon, theme }: { label: string, value?: number | string, icon: React.ReactNode, theme: Theme }) {
  const themes = {
    blue: 'bg-blue-50/50 text-blue-600 border-blue-100/60 shadow-blue-500/5',
    purple: 'bg-purple-50/50 text-purple-600 border-purple-100/60 shadow-purple-500/5',
    amber: 'bg-amber-50/50 text-amber-600 border-amber-100/60 shadow-amber-500/5',
    emerald: 'bg-emerald-50/50 text-emerald-600 border-emerald-100/60 shadow-emerald-500/5',
    rose: 'bg-rose-50/50 text-rose-600 border-rose-100/60 shadow-rose-500/5',
  };

  return (
    <div className={`p-4 rounded-3xl border ${themes[theme]} flex flex-col justify-center gap-3 backdrop-blur-sm transition-all hover:scale-[1.02] cursor-default`}>
      <div className="flex items-center justify-between">
        <span className="p-2.5 bg-white rounded-[1rem] shadow-sm border border-slate-100/50">{icon}</span>
        <span className="text-2xl font-black text-slate-800 tracking-tight">{value !== undefined ? value : '-'}</span>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-2.5 rounded-2xl border border-slate-100/70 shadow-sm">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-slate-700 truncate">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let color = 'bg-slate-100 text-slate-600 border-slate-200';

  if (s === 'approved') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  else if (s === 'pending') color = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (s === 'rejected') color = 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${color}`}>
      {status}
    </span>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode, title: string, message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
      {icon}
      <h3 className="text-lg font-extrabold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-500 max-w-[250px]">{message}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(d);
  } catch {
    return dateStr;
  }
}
