'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { StudentAppChrome } from '@/components/student/StudentAppChrome';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  fetchStudentProfile,
  fetchStudentProgress,
  fetchStudentRecentActivity,
  updateStudentProfile,
} from '@/lib/api/student';
import type {
  StudentProfile,
  StudentProfileUpdatePayload,
  StudentProgress,
  StudentRecentActivityItem,
} from '@/lib/api/types';
import {
  Bookmark,
  Bot,
  ChevronRight,
  Loader2,
  Pencil,
  Save,
  Scan,
  Shield,
  Trash2,
} from 'lucide-react';
import { RoleBadgeList } from '@/components/profile/role-badge-list';
import {
  EMPTY_PERSONAL_INFO,
  PersonalInfoFields,
  personalValuesToApiPatch,
  profileToPersonalValues,
  type PersonalInfoValues,
} from '@/components/profile/personal-info-fields';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';

const NOTIF_PREFS_KEY = 'bonevisqa_student_notif_prefs_v1';

type NotifPrefs = {
  clinicalDigest: boolean;
  quizReminders: boolean;
  aiInsightAlerts: boolean;
};

const DEFAULT_NOTIF: NotifPrefs = {
  clinicalDigest: true,
  quizReminders: true,
  aiInsightAlerts: false,
};

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return DEFAULT_NOTIF;
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIF;
    const p = JSON.parse(raw) as Partial<NotifPrefs>;
    return {
      clinicalDigest: Boolean(p.clinicalDigest ?? DEFAULT_NOTIF.clinicalDigest),
      quizReminders: Boolean(p.quizReminders ?? DEFAULT_NOTIF.quizReminders),
      aiInsightAlerts: Boolean(p.aiInsightAlerts ?? DEFAULT_NOTIF.aiInsightAlerts),
    };
  } catch {
    return DEFAULT_NOTIF;
  }
}

function saveNotifPrefs(p: NotifPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(p));
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return 'Just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function activityIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('quiz') || t.includes('exam')) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#94efec] text-[#006e6d]">
        <Scan className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  if (t.includes('ai') || t.includes('question') || t.includes('qa')) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffdcc3] text-[#2f1500]">
        <Bot className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d6e3ff] text-[#001b3d]">
      <Bookmark className="h-5 w-5" aria-hidden />
    </span>
  );
}

function PillToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-[#00478d]' : 'bg-[#c2c6d4]/40'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}

const labelCls =
  'block text-xs font-bold uppercase tracking-widest text-[#424752] dark:text-slate-400 px-1';
const inputCls =
  'w-full rounded-xl border-0 bg-white px-4 py-3 font-medium text-[#191c1e] shadow-none ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[#005eb8] dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10';
const inputReadonlyCls =
  'w-full cursor-not-allowed rounded-xl border-0 bg-[#d8dadc]/25 px-4 py-3 font-mono text-sm text-[#424752] ring-1 ring-black/5 dark:bg-slate-800/50 dark:text-slate-400';

export default function StudentProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState<
    Pick<StudentProfileUpdatePayload, 'fullName' | 'schoolCohort' | 'avatarUrl' | 'classCode'>
  >({
    fullName: '',
    schoolCohort: '',
    avatarUrl: '',
    classCode: '',
  });
  const [personal, setPersonal] = useState<PersonalInfoValues>(EMPTY_PERSONAL_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credentialsReadOnly, setCredentialsReadOnly] = useState(true);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [activity, setActivity] = useState<StudentRecentActivityItem[]>([]);
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);

  const cohortPresets = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 9 }, (_, i) => `Class of ${y - 4 + i}`);
  }, []);

  const cohortIsPreset = cohortPresets.includes(form.schoolCohort);

  useEffect(() => {
    setNotif(loadNotifPrefs());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, prog, act] = await Promise.allSettled([
          fetchStudentProfile(),
          fetchStudentProgress(),
          fetchStudentRecentActivity(),
        ]);
        if (cancelled) return;

        const profileResult = data;
        if (profileResult.status === 'rejected') {
          const msg = profileResult.reason instanceof Error
            ? profileResult.reason.message
            : 'Failed to load profile.';
          toast.error(msg);
          setLoading(false);
          return;
        }

        const p = profileResult.value;
        setProfile(p);
        setForm({
          fullName: p.fullName ?? '',
          schoolCohort: p.schoolCohort ?? '',
          avatarUrl: p.avatarUrl ?? '',
          classCode: p.classCode ?? '',
        });
        setPersonal(profileToPersonalValues(p));

        const progResult = prog;
        if (progResult.status === 'fulfilled' && progResult.value) {
          setProgress(progResult.value);
        }

        const actResult = act;
        if (actResult.status === 'fulfilled' && Array.isArray(actResult.value)) {
          setActivity(actResult.value);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load student profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const initials = useMemo(() => {
    const source = form.fullName || profile?.fullName || 'BV';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [form.fullName, profile?.fullName]);

  const roleSubtitle = useMemo(() => {
    const role =
      profile?.roles && profile.roles.length > 0 ? profile.roles.join(' · ') : 'Student';
    const cohort = form.schoolCohort?.trim();
    return cohort ? `${role} • ${cohort}` : role;
  }, [profile?.roles, form.schoolCohort]);

  const patchNotif = useCallback((patch: Partial<NotifPrefs>) => {
    setNotif((prev) => {
      const next = { ...prev, ...patch };
      saveNotifPrefs(next);
      return next;
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: StudentProfileUpdatePayload = {
        fullName: form.fullName.trim(),
        schoolCohort: form.schoolCohort.trim(),
        avatarUrl: form.avatarUrl.trim(),
        classCode: form.classCode?.trim() || undefined,
        ...personalValuesToApiPatch(personal),
      };
      const updated = await updateStudentProfile(payload);
      setProfile(updated);
      setForm({
        fullName: updated.fullName ?? '',
        schoolCohort: updated.schoolCohort ?? '',
        avatarUrl: updated.avatarUrl ?? '',
        classCode: updated.classCode ?? '',
      });
      setPersonal(profileToPersonalValues(updated));
      setCredentialsReadOnly(true);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const clearLocalSession = () => {
    if (
      !confirm(
        'Clear preferences and cached data on this device? You stay signed in; this only affects this browser.',
      )
    ) {
      return;
    }
    try {
      sessionStorage.clear();
      localStorage.removeItem(NOTIF_PREFS_KEY);
    } catch {
      /* ignore */
    }
    setNotif(DEFAULT_NOTIF);
    toast.success('Local session data cleared.');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <StudentAppChrome breadcrumb="Profile" title="Student Settings" />
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="flex items-center gap-3 text-sm text-[#424752]">
              <Loader2 className="h-5 w-5 animate-spin text-[#00478d]" />
              Loading profile…
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <StudentAppChrome breadcrumb="Profile" title="Student Settings" />
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="rounded-[2rem] border border-dashed border-[#c2c6d4] bg-white px-6 py-16 text-center dark:border-white/20 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-[#191c1e] dark:text-slate-100">No profile data</h2>
            <p className="mt-2 text-sm text-[#424752] dark:text-slate-400">
              The profile endpoint returned no record for this session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const questionsAsked = progress?.totalQuestionsAsked ?? 0;
  const quizzesTaken = progress?.completedQuizzes ?? progress?.totalQuizAttempts ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-slate-950">
      <StudentAppChrome breadcrumb="Profile" title="Student Settings" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Left: avatar + stats */}
            <div className="space-y-6 lg:col-span-4">
              <div className="flex flex-col items-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
                <ProfileAvatarPicker
                  avatarUrl={form.avatarUrl ?? ''}
                  initials={initials || 'BV'}
                  alt={form.fullName || 'Student avatar'}
                  size="xl"
                  variant="hero"
                  onUrlChange={(url) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
                  onError={(msg) => toast.error(msg)}
                  footer={(openPicker) => (
                    <button
                      type="button"
                      onClick={openPicker}
                      className="mt-6 w-full rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[0.99] active:scale-[0.98]"
                    >
                      Upload New Photo
                    </button>
                  )}
                />
                <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#191c1e] dark:text-slate-100">
                  {form.fullName || 'Student'}
                </h2>
                <p className="mt-1 text-sm text-[#424752] dark:text-slate-400">{roleSubtitle}</p>
                <p className="mt-2 max-w-xs text-xs text-[#727783] dark:text-slate-500">{profile.email}</p>
                <p className="mt-3 max-w-xs text-[11px] leading-snug text-[#727783] dark:text-slate-500">
                  Photo uploads apply when you save profile changes below.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#eceef0] p-6 dark:bg-slate-800/80">
                  <div className="font-headline text-3xl font-bold text-[#00478d]">
                    {questionsAsked.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[#424752] dark:text-slate-400">
                    Questions asked
                  </div>
                </div>
                <div className="rounded-2xl bg-[#eceef0] p-6 dark:bg-slate-800/80">
                  <div className="font-headline text-3xl font-bold text-[#006a68]">
                    {quizzesTaken.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[#424752] dark:text-slate-400">
                    Quizzes taken
                  </div>
                </div>
              </div>
            </div>

            {/* Right: credentials */}
            <div className="rounded-[2.5rem] bg-[#eceef0] p-8 dark:bg-slate-800/60 md:p-10 lg:col-span-8">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e] dark:text-slate-100">
                  Institutional credentials
                </h3>
                <button
                  type="button"
                  onClick={() => setCredentialsReadOnly((r) => !r)}
                  className="flex items-center gap-1 text-sm font-bold text-[#00478d] hover:underline"
                >
                  <Pencil className="h-4 w-4" />
                  {credentialsReadOnly ? 'Edit details' : 'Lock fields'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="stu-fullName" className={labelCls}>
                    Full legal name
                  </label>
                  <input
                    id="stu-fullName"
                    value={form.fullName}
                    readOnly={credentialsReadOnly}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="stu-medical" className={labelCls}>
                    Medical school / affiliation
                  </label>
                  <input
                    id="stu-medical"
                    value={personal.bio}
                    readOnly={credentialsReadOnly}
                    onChange={(e) => setPersonal((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="e.g. Johns Hopkins University"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="stu-cohort" className={labelCls}>
                    Current cohort
                  </label>
                  <select
                    id="stu-cohort"
                    disabled={credentialsReadOnly}
                    value={cohortIsPreset ? form.schoolCohort : '__other__'}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '__other__') {
                        if (cohortIsPreset) setForm((p) => ({ ...p, schoolCohort: '' }));
                        return;
                      }
                      setForm((p) => ({ ...p, schoolCohort: v }));
                    }}
                    className={inputCls}
                  >
                    {cohortPresets.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__other__">Other…</option>
                  </select>
                  {!cohortIsPreset ? (
                    <input
                      id="stu-cohort-custom"
                      value={form.schoolCohort}
                      readOnly={credentialsReadOnly}
                      onChange={(e) => setForm((p) => ({ ...p, schoolCohort: e.target.value }))}
                      placeholder="Describe your cohort or program"
                      className={`${inputCls} mt-2`}
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label htmlFor="stu-school-id" className={labelCls}>
                    Student ID
                  </label>
                  <input
                    id="stu-school-id"
                    readOnly={credentialsReadOnly}
                    value={personal.studentSchoolId || ''}
                    onChange={(e) => setPersonal((p) => ({ ...p, studentSchoolId: e.target.value }))}
                    placeholder="Enter your student ID"
                    className={credentialsReadOnly ? inputReadonlyCls : inputCls}
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl bg-[#d6e3ff] p-6 dark:bg-blue-950/50">
                <Shield className="h-9 w-9 shrink-0 text-[#001b3d] dark:text-blue-200" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-[#001b3d] dark:text-blue-100">
                    {profile.isActive ? 'Verified institutional account' : 'Account status'}
                  </p>
                  <p className="text-xs text-[#00468c]/90 dark:text-blue-300/90">
                    {profile.isActive
                      ? 'Access to assigned classes and case content is active for your role.'
                      : 'Your account is inactive. Contact your lecturer or administrator.'}
                  </p>
                </div>
              </div>

              {/* Nút Lưu — đặt ngay dưới phần credentials để dễ thấy */}
              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  isLoading={saving}
                  disabled={saving}
                  className="rounded-full bg-gradient-to-r from-[#00478d] to-[#005eb8] px-8 py-3 font-bold shadow-md hover:scale-[1.01] active:scale-[0.99]"
                >
                  {!saving && <Save className="mr-2 h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e] dark:text-slate-100">
                  Recent case activity
                </h3>
                <Link
                  href="/student/history"
                  className="text-xs font-bold text-[#00478d] hover:underline"
                >
                  View all
                </Link>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-[#424752] dark:text-slate-400">No recent activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.slice(0, 6).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#eceef0] p-4 dark:bg-slate-800/80"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        {activityIcon(item.type)}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#191c1e] dark:text-slate-100">
                            {item.title}
                          </p>
                          <p className="text-xs text-[#424752] dark:text-slate-400">
                            {formatRelativeTime(item.occurredAt)}
                            {item.description ? ` · ${item.description}` : ''}
                          </p>
                        </div>
                      </div>
                      {item.status ? (
                        <span className="shrink-0 text-sm font-bold text-[#006a68]">{item.status}</span>
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#727783]" aria-hidden />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-[2rem] bg-[#e6e8ea] p-8 dark:bg-slate-800/80">
              <h3 className="mb-6 font-['Manrope',sans-serif] text-xl font-bold text-[#191c1e] dark:text-slate-100">
                Notification preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#191c1e] dark:text-slate-100">Clinical digest</p>
                    <p className="text-xs text-[#424752] dark:text-slate-400">
                      Weekly summaries (stored on this device)
                    </p>
                  </div>
                  <PillToggle
                    checked={notif.clinicalDigest}
                    onChange={(v) => patchNotif({ clinicalDigest: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#191c1e] dark:text-slate-100">Quiz reminders</p>
                    <p className="text-xs text-[#424752] dark:text-slate-400">
                      In-app reminders for reviews
                    </p>
                  </div>
                  <PillToggle
                    checked={notif.quizReminders}
                    onChange={(v) => patchNotif({ quizReminders: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#191c1e] dark:text-slate-100">AI insight alerts</p>
                    <p className="text-xs text-[#424752] dark:text-slate-400">
                      When new relevant cases appear
                    </p>
                  </div>
                  <PillToggle
                    checked={notif.aiInsightAlerts}
                    onChange={(v) => patchNotif({ aiInsightAlerts: v })}
                  />
                </div>
                <div className="border-t border-[#c2c6d4]/40 pt-6 dark:border-white/10">
                  <button
                    type="button"
                    onClick={clearLocalSession}
                    className="flex items-center gap-2 text-sm font-bold text-[#ba1a1a] hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all session data
                  </button>
                </div>
              </div>
            </div>
          </div>

          <details className="group rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <summary className="cursor-pointer font-['Manrope',sans-serif] text-lg font-bold text-[#191c1e] marker:text-[#00478d] dark:text-slate-100">
              Contact &amp; demographics
            </summary>
            <div className="mt-6">
              <PersonalInfoFields idPrefix="stu-pi" values={personal} onChange={setPersonal} />
              <p className="mt-4 text-xs text-[#727783] dark:text-slate-500">
                Email is tied to login and cannot be changed here.
              </p>
            </div>
          </details>

          <div className="flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#191c1e] dark:text-slate-100">Roles</p>
              <div className="mt-2">
                <RoleBadgeList roles={profile.roles} emptyLabel="Student" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
