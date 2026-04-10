'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, RotateCcw, Save, CheckCircle, Lock, LogOut, Upload, Shield } from 'lucide-react';
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
        checked ? 'bg-primary' : 'bg-surface-container-high'
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

function StatBentoCard({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] p-6 ${
        highlight
          ? 'bg-primary-container text-white'
          : 'bg-surface-container-highest text-on-surface'
      }`}
      style={{ minHeight: '140px' }}
    >
      <div className="absolute top-4 right-4 opacity-30">
        {icon}
      </div>
      <div />
      <div>
        <div className={`text-4xl font-extrabold font-headline ${highlight ? 'text-white' : 'text-on-surface'}`}>
          {value}
        </div>
        <div className={`text-sm font-medium mt-0.5 ${highlight ? 'opacity-80' : 'text-on-surface-variant'}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function LecturerSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'security'>('profile');

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
          <h1 className="mt-1 text-2xl font-bold text-card-foreground">Faculty Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your lecturer profile and preferences.</p>
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

  const displayName = form.fullName || profile?.fullName || 'Lecturer';
  const displayEmail = profile?.email ?? '';
  const displayRole = profile?.roles?.[0] ?? 'Lecturer';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Academic Management</p>
        <h1 className="mt-1 text-2xl font-bold text-card-foreground">Faculty Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your lecturer profile and preferences.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Card + Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Large Profile Card */}
          <div className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm text-center">
            <div className="relative mb-6 inline-block">
              <ProfileAvatarPicker
                avatarUrl={form.avatarUrl ?? ''}
                initials={initials || 'L'}
                alt={displayName}
                size="lg"
                onUrlChange={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
                onError={(msg) => toast.error(msg)}
              />
            </div>
            <h2 className="text-3xl font-extrabold font-headline text-on-surface mb-1 tracking-tight">
              {displayName}
            </h2>
            <p className="text-primary font-semibold mb-4">{profile?.department || 'No Department'}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {displayRole}
              </span>
              {profile?.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className="w-full rounded-full border-2 border-outline-variant py-3 px-6 font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              Edit Profile
            </button>
          </div>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatBentoCard
              icon={
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                </svg>
              }
              value={profile?.roles?.length ?? 1}
              label="Roles"
              highlight={false}
            />
            <StatBentoCard
              icon={
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              }
              value={profile?.roles?.length ?? 0}
              label="Classes"
              highlight={true}
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Quick Actions</h3>
            <button
              type="button"
              onClick={() => router.push('/lecturer/dashboard')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors text-left cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-on-surface text-sm">Dashboard</p>
                <p className="text-xs text-on-surface-variant">View overview</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.push('/lecturer/classes')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors text-left cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-on-surface text-sm">My Classes</p>
                <p className="text-xs text-on-surface-variant">Manage students</p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-surface-container-low rounded-full p-1.5">
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeSection === 'profile'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('notifications')}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeSection === 'notifications'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Notifications
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('security')}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                activeSection === 'security'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Security
            </button>
          </div>

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Personal Information Card */}
              <div className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold font-headline text-on-surface">Personal Information</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Your core profile data</p>
                  </div>
                  <div className="bg-secondary-container/30 px-4 py-2 rounded-full flex items-center gap-2 border border-secondary-container">
                    <Shield className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1">
                    <label htmlFor="fullName" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="department" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
                      Department
                    </label>
                    <input
                      id="department"
                      type="text"
                      value={form.department ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                      placeholder="e.g. Orthopedic Radiology"
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
                      Email
                    </label>
                    <input
                      type="text"
                      value={displayEmail}
                      readOnly
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 font-mono font-bold text-on-surface opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
                      Faculty ID
                    </label>
                    <input
                      type="text"
                      value={profile?.id?.slice(0, 8).toUpperCase() ?? 'LECT-0001'}
                      readOnly
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Additional Personal Fields */}
                <h4 className="mt-8 mb-4 text-sm font-semibold text-on-surface">Additional Information</h4>
                <PersonalInfoFields idPrefix="lec-pi" values={personal} onChange={setPersonal} />

                {/* Roles */}
                <div className="mt-6">
                  <h4 className="mb-3 text-sm font-semibold text-on-surface">Roles</h4>
                  <RoleBadgeList roles={profile?.roles ?? []} emptyLabel={displayRole} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-full border border-outline-variant px-6 py-3 font-medium text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Changes
                </button>
                <Button type="button" onClick={handleSave} disabled={saving} isLoading={saving} size="lg">
                  {!saving && <Save className="h-4 w-4" />}
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm">
                <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Notification Preferences</h3>
                <p className="text-sm text-on-surface-variant mb-6">Choose what updates you want to receive</p>
                <div className="space-y-5">
                  {notificationItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors"
                    >
                      <div>
                        <p className="font-medium text-on-surface">{item.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle checked={item.value} onChange={item.setter} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm">
                <Button type="button" onClick={handleSave} disabled={saving} isLoading={saving} size="lg">
                  {!saving && <Save className="h-4 w-4" />}
                  {saved ? 'Saved!' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm">
                <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Security & Access</h3>
                <p className="text-sm text-on-surface-variant mb-6">Manage your account security settings</p>
                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-on-surface">Change Password</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Update your account password</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-on-surface">Active Sessions</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Manage your logged-in devices</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-error-container/20 hover:bg-error-container/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-error/10 flex items-center justify-center">
                        <LogOut className="h-5 w-5 text-error" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-error">Sign Out</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Log out of your account on this device</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Account Info */}
              <div className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-sm">
                <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Account Information</h3>
                <p className="text-sm text-on-surface-variant mb-6">Your account details and activity</p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Last Login</p>
                    <p className="font-medium text-on-surface">
                      {profile?.lastLogin
                        ? new Date(profile.lastLogin).toLocaleString()
                        : 'Recently'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Account Created</p>
                    <p className="font-medium text-on-surface">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
