'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { SettingsFormSkeleton } from '@/components/shared/DashboardSkeletons';
import { fetchAdminProfile, updateAdminProfile } from '@/lib/api/lecturer-dashboard';
import type { AdminProfile, UpdateAdminProfilePayload } from '@/lib/api/lecturer-dashboard';
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

export default function AdminSettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<{ fullName: string; avatarUrl: string }>({ fullName: '', avatarUrl: '' });
  const [personal, setPersonal] = useState<PersonalInfoValues>(EMPTY_PERSONAL_INFO);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminProfile();
        if (!cancelled) {
          setProfile(data);
          setForm({ fullName: data.fullName, avatarUrl: data.avatarUrl ?? '' });
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
    const name = form.fullName || profile?.fullName || 'A';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }, [form.fullName, profile?.fullName]);

  const buildPayload = (): UpdateAdminProfilePayload => ({
    fullName: form.fullName.trim(),
    avatarUrl: form.avatarUrl.trim() || undefined,
    ...personalValuesToApiPatch(personal),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      if (!payload.fullName) {
        toast.error('Full name is required.');
        setSaving(false);
        return;
      }
      const updated = await updateAdminProfile(payload);
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
    setForm({ fullName: profile.fullName, avatarUrl: profile.avatarUrl ?? '' });
    setPersonal(profileToPersonalValues(profile));
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">System Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-card-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your admin account profile.</p>
        </div>
        <SettingsFormSkeleton />
      </div>
    );
  }

  const displayName = form.fullName || profile?.fullName || 'Admin';
  const displayEmail = profile?.email ?? '';

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">System Administration</p>
        <h1 className="mt-1 text-2xl font-bold text-card-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your admin account profile.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <ProfileAvatarPicker
            avatarUrl={form.avatarUrl ?? ''}
            initials={initials || 'A'}
            alt={displayName}
            size="sm"
            onUrlChange={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
            onError={(msg) => toast.error(msg)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-card-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Uploaded images will be saved after you click <span className="font-medium text-foreground">Save Changes</span>.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Admin
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                Active account
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </h3>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-card-foreground">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <h4 className="mb-4 mt-8 text-sm font-semibold text-card-foreground">Personal information</h4>
          <PersonalInfoFields idPrefix="admin-pi" values={personal} onChange={setPersonal} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-card-foreground">Account</h3>
          <div className="space-y-5">
            <div>
              <p className="mb-1.5 text-sm font-medium text-card-foreground">Roles</p>
              <RoleBadgeList roles={profile?.roles ?? []} emptyLabel="Admin" />
            </div>
            <p className="text-xs text-muted-foreground">
              Email is tied to your login and cannot be changed here: <span className="font-medium text-foreground">{displayEmail || '—'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input"
          >
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
