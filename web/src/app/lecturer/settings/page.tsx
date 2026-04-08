'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, RotateCcw, Save } from 'lucide-react';
import { SettingsFormSkeleton } from '@/components/shared/DashboardSkeletons';
import { fetchLecturerProfile, updateLecturerProfile } from '@/lib/api/lecturer-dashboard';
import type { LecturerProfile, UpdateLecturerProfilePayload } from '@/lib/api/lecturer-dashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { RoleBadgeList } from '@/components/profile/role-badge-list';
import {
  EMPTY_PERSONAL_INFO,
  PersonalInfoFields,
  personalValuesToApiPatch,
  profileToPersonalValues,
  type PersonalInfoValues,
} from '@/components/profile/personal-info-fields';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';

const DEFAULT_FORM: UpdateLecturerProfilePayload = {
  fullName: '',
  department: '',
  avatarUrl: '',
  notifyNewStudent: true,
  notifyQuizComplete: true,
  notifyNewQuestion: false,
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-success' : 'bg-muted-foreground/30'
      }`}
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function LecturerSettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<UpdateLecturerProfilePayload>(DEFAULT_FORM);
  const [personal, setPersonal] = useState<PersonalInfoValues>(EMPTY_PERSONAL_INFO);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLecturerProfile();
        if (!cancelled) {
          setProfile(data);
          setForm({
            fullName: data.fullName,
            department: data.department ?? '',
            avatarUrl: data.avatarUrl ?? '',
            notifyNewStudent: data.notifyNewStudent,
            notifyQuizComplete: data.notifyQuizComplete,
            notifyNewQuestion: data.notifyNewQuestion,
          });
          setPersonal(profileToPersonalValues(data));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to load profile.');
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
    const name = form.fullName || profile?.fullName || 'L';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }, [form.fullName, profile?.fullName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateLecturerProfile({
        ...form,
        ...personalValuesToApiPatch(personal),
      });
      setProfile(updated);
      setPersonal(profileToPersonalValues(updated));
      setSaved(true);
      toast.success('Profile updated successfully.');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName,
      department: profile.department ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      notifyNewStudent: profile.notifyNewStudent,
      notifyQuizComplete: profile.notifyQuizComplete,
      notifyNewQuestion: profile.notifyNewQuestion,
    });
    setPersonal(profileToPersonalValues(profile));
  };

  const notificationItems = [
    {
      label: 'New student enrolled',
      desc: 'When a student is added to your class',
      value: form.notifyNewStudent,
      setter: (v: boolean) => setForm((p) => ({ ...p, notifyNewStudent: v })),
    },
    {
      label: 'Quiz completions',
      desc: 'When students complete assigned quizzes',
      value: form.notifyQuizComplete,
      setter: (v: boolean) => setForm((p) => ({ ...p, notifyQuizComplete: v })),
    },
    {
      label: 'New student questions',
      desc: 'When students ask questions in Q&A',
      value: form.notifyNewQuestion,
      setter: (v: boolean) => setForm((p) => ({ ...p, notifyNewQuestion: v })),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Academic Management</p>
          <h1 className="mt-1 text-2xl font-bold text-card-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your lecturer profile and preferences.</p>
        </div>
        <SettingsFormSkeleton />
      </div>
    );
  }

  const displayName = form.fullName || profile?.fullName || 'Lecturer';
  const displayEmail = profile?.email ?? '';
  const displayRole = profile?.roles?.[0] ?? 'Lecturer';

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Academic Management</p>
        <h1 className="mt-1 text-2xl font-bold text-card-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your lecturer profile and preferences.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Avatar + identity */}
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <ProfileAvatarPicker
            avatarUrl={form.avatarUrl ?? ''}
            initials={initials || 'L'}
            alt={displayName}
            size="sm"
            onUrlChange={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
            onError={(msg) => toast.error(msg)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-card-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ảnh đã tải sẽ lưu sau khi bạn bấm <span className="font-medium text-foreground">Save Changes</span>.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {displayRole}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                Active account
              </span>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-card-foreground">Full name</label>
              <input id="fullName" type="text" value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-card-foreground">Department</label>
              <input id="department" type="text" value={form.department ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Orthopedics"
                className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <h4 className="mb-4 mt-8 text-sm font-semibold text-card-foreground">Personal information</h4>
          <PersonalInfoFields idPrefix="lec-pi" values={personal} onChange={setPersonal} />
          <p className="mt-4 text-xs text-muted-foreground">
            Email (login): <span className="font-medium text-foreground">{displayEmail || '—'}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">Roles</h3>
          <RoleBadgeList roles={profile?.roles ?? []} emptyLabel={displayRole} />
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h3>
          <div className="space-y-4">
            {notificationItems.map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle checked={item.value} onChange={item.setter} />
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input cursor-pointer">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <Button type="button" onClick={handleSave} disabled={saving} isLoading={saving}>
            {!saving && <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
