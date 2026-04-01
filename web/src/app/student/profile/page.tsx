'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchStudentProfile, updateStudentProfile } from '@/lib/api/student';
import type { StudentProfile, StudentProfileUpdatePayload } from '@/lib/api/types';
import { Camera, Loader2, Save, ShieldCheck } from 'lucide-react';

export default function StudentProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState<StudentProfileUpdatePayload>({
    fullName: '',
    schoolCohort: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStudentProfile();
        if (cancelled) return;
        setProfile(data);
        setForm({
          fullName: data.fullName ?? '',
          schoolCohort: data.schoolCohort ?? '',
          avatarUrl: data.avatarUrl ?? '',
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateStudentProfile(form);
      setProfile(updated);
      setForm({
        fullName: updated.fullName ?? '',
        schoolCohort: updated.schoolCohort ?? '',
        avatarUrl: updated.avatarUrl ?? '',
      });
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Profile" subtitle="Manage your personal information" />
        <div className="mx-auto max-w-3xl p-6">
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading student profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header title="Profile" subtitle="Manage your personal information" />
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-card-foreground">No profile data available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The student profile endpoint returned no user record for this session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Profile" subtitle="Manage your personal information" />

      <div className="mx-auto max-w-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="relative">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt={form.fullName || 'Student avatar'}
                  className="h-24 w-24 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                  {initials || 'BV'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-card-foreground">{form.fullName}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {form.schoolCohort || 'No cohort assigned'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    profile.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {profile.isActive ? 'Active account' : 'Inactive account'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-card-foreground">Editable profile fields</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-card-foreground">
                  Full name
                </label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="schoolCohort" className="mb-1.5 block text-sm font-medium text-card-foreground">
                  School cohort
                </label>
                <input
                  id="schoolCohort"
                  value={form.schoolCohort}
                  onChange={(e) => setForm((prev) => ({ ...prev, schoolCohort: e.target.value }))}
                  placeholder="e.g. Orthopedics - Cohort 2023"
                  className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="avatarUrl" className="mb-1.5 block text-sm font-medium text-card-foreground">
                  Avatar URL
                </label>
                <input
                  id="avatarUrl"
                  value={form.avatarUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-card-foreground">Read-only account context</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-medium text-card-foreground">Email</p>
                <div className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm text-muted-foreground">
                  {profile.email}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-card-foreground">Roles</p>
                <div className="flex min-h-[46px] flex-wrap gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5">
                  {profile.roles.length > 0 ? (
                    profile.roles.map((role) => (
                      <span key={role} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No roles returned</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" isLoading={saving} disabled={saving}>
              {!saving && <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
