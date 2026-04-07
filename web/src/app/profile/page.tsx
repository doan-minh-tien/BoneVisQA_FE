'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchMyProfile, uploadMyAvatar, type UserProfileDto } from '@/lib/api/users';

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BV'
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/auth/sign-in');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchMyProfile();
        if (!cancelled) setProfile(data);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  const roleLabel = useMemo(() => {
    const role = profile?.activeRole ?? profile?.role ?? profile?.roles?.[0] ?? 'Unassigned';
    return String(role);
  }, [profile]);

  const statusLabel = useMemo(() => {
    return String(profile?.status ?? profile?.userStatus ?? 'Active');
  }, [profile]);

  const displayName = profile?.fullName?.trim() || profile?.email?.trim() || 'Authenticated User';
  const avatarSrc = profile?.avatarUrl?.trim() || '';

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const { avatarUrl } = await uploadMyAvatar(file);
      // cache-bust avatar URL so browser re-renders immediately after upload.
      const bustedUrl = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setProfile((prev) => ({ ...(prev ?? {}), avatarUrl: bustedUrl }));
      toast.success('Avatar updated successfully.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="My Profile" subtitle="Manage your account details and avatar." />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                    {getInitials(displayName)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{displayName}</h2>
                  <p className="text-sm text-slate-600">{profile?.email || 'No email'}</p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Camera className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload avatar'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{roleLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {statusLabel}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">School / Cohort</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {profile?.schoolCohort?.trim() || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
