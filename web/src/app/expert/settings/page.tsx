'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, RotateCcw, Save, Shield } from 'lucide-react';
import { fetchExpertProfile, updateExpertProfile } from '@/lib/api/lecturer-dashboard';
import type { ExpertProfile, UpdateExpertProfilePayload } from '@/lib/api/lecturer-dashboard';
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

const DEFAULT_FORM: UpdateExpertProfilePayload = {
  fullName: '',
  specialty: '',
  avatarUrl: '',
  autoApproveThreshold: 90,
  notifyNewQA: true,
  notifyFlagged: true,
  notifyQuizComplete: false,
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

export default function ExpertSettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<UpdateExpertProfilePayload>(DEFAULT_FORM);
  const [personal, setPersonal] = useState<PersonalInfoValues>(EMPTY_PERSONAL_INFO);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchExpertProfile();
        if (!cancelled) {
          setProfile(data);
          setForm({
            fullName: data.fullName,
            specialty: data.specialty ?? '',
            avatarUrl: data.avatarUrl ?? '',
            autoApproveThreshold: data.autoApproveThreshold,
            notifyNewQA: data.notifyNewQA,
            notifyFlagged: data.notifyFlagged,
            notifyQuizComplete: data.notifyQuizComplete,
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
    const name = form.fullName || profile?.fullName || 'E';
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
      const updated = await updateExpertProfile({
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
      specialty: profile.specialty ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      autoApproveThreshold: profile.autoApproveThreshold,
      notifyNewQA: profile.notifyNewQA,
      notifyFlagged: profile.notifyFlagged,
      notifyQuizComplete: profile.notifyQuizComplete,
    });
    setPersonal(profileToPersonalValues(profile));
  };

  const notificationItems = [
    {
      label: 'New Q&A for review',
      desc: 'When students ask new questions',
      value: form.notifyNewQA,
      setter: (v: boolean) => setForm((p) => ({ ...p, notifyNewQA: v })),
    },
    {
      label: 'Flagged content',
      desc: 'When content is flagged for expert review',
      value: form.notifyFlagged,
      setter: (v: boolean) => setForm((p) => ({ ...p, notifyFlagged: v })),
    },
    {
      label: 'Quiz completions',
      desc: 'When students complete your quizzes',
      value: form.notifyQuizComplete,
      setter: (v: boolean) => setForm((p) => ({ ...p, notifyQuizComplete: v })),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Expert Review</p>
          <h1 className="mt-1 text-2xl font-bold text-card-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your expert profile and review preferences.</p>
        </div>
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  const displayName = form.fullName || profile?.fullName || 'Expert';
  const displayEmail = profile?.email ?? '';
  const displayRole = profile?.roles?.[0] ?? 'Expert';

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Expert Review</p>
        <h1 className="mt-1 text-2xl font-bold text-card-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your expert profile and review preferences.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Avatar + identity */}
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <ProfileAvatarPicker
            avatarUrl={form.avatarUrl ?? ''}
            initials={initials || 'E'}
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
              <label htmlFor="specialty" className="mb-1.5 block text-sm font-medium text-card-foreground">Specialty</label>
              <input id="specialty" type="text" value={form.specialty ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                placeholder="e.g. Musculoskeletal Radiology"
                className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <h4 className="mb-4 mt-8 text-sm font-semibold text-card-foreground">Personal information</h4>
          <PersonalInfoFields idPrefix="exp-pi" values={personal} onChange={setPersonal} />
          <p className="mt-4 text-xs text-muted-foreground">
            Email (login): <span className="font-medium text-foreground">{displayEmail || '—'}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">Roles</h3>
          <RoleBadgeList roles={profile?.roles ?? []} emptyLabel={displayRole} />
        </div>

        {/* Review settings */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Shield className="h-5 w-5 text-primary" />
            Review Settings
          </h3>
          <div className="max-w-xs">
            <label htmlFor="autoApproveThreshold" className="mb-1.5 block text-sm font-medium text-card-foreground">
              Auto-approve accuracy threshold (%)
            </label>
            <input id="autoApproveThreshold" type="number" min={0} max={100}
              value={form.autoApproveThreshold}
              onChange={(e) => setForm((p) => ({ ...p, autoApproveThreshold: Number(e.target.value) }))}
              className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <p className="mt-1 text-xs text-muted-foreground">
              AI answers with accuracy above this will be auto-approved.
            </p>
          </div>
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
