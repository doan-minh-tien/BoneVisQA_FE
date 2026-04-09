'use client';

import { useEffect, useState } from 'react';
import ExpertHeader from '@/components/expert/ExpertHeader';
import {
  Bell,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  User,
  Loader2,
  AlertCircle,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BadgeCheck,
  FileText,
} from 'lucide-react';
import { fetchExpertProfile, updateExpertProfile } from '@/lib/api/expert-profile';
import { uploadImage } from '@/lib/api/upload';
import type { ExpertProfileUpdatePayload } from '@/lib/api/types';

/* ─── small helper ───────────────────────────────────────────────── */
function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-card-foreground mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

/* ─── page ───────────────────────────────────────────────────────── */
export default function ExpertSettingsPage() {
  /* profile state */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<ExpertProfileUpdatePayload>({
    fullName: '',
    specialty: '',
    avatarUrl: '',
    dateOfBirth: '',
    phoneNumber: '',
    gender: '',
    address: '',
    bio: '',
  });
  const [email, setEmail] = useState('');

  /* notification toggles (local-only, UI demo) */
  const [notifyNewQA, setNotifyNewQA] = useState(true);
  const [notifyFlagged, setNotifyFlagged] = useState(true);
  const [notifyQuizComplete, setNotifyQuizComplete] = useState(false);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(90);

  /* ── load profile on mount ─── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await fetchExpertProfile();
        setEmail(profile.email ?? '');
        setForm({
          fullName: profile.fullName ?? '',
          specialty: profile.specialty ?? '',
          avatarUrl: profile.avatarUrl ?? '',
          dateOfBirth: profile.dateOfBirth ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          gender: profile.gender ?? '',
          address: profile.address ?? '',
          bio: profile.bio ?? '',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── helpers ─── */
  const set = (key: keyof ExpertProfileUpdatePayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      // strip empty strings → undefined so backend ignores them  
      const payload: ExpertProfileUpdatePayload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : v]),
      ) as ExpertProfileUpdatePayload;
      payload.fullName = form.fullName; // always send fullName
      await updateExpertProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  /* ── render loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen">
        <ExpertHeader title="Settings" subtitle="Manage your expert preferences" />
        <div className="p-6 max-w-3xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ExpertHeader title="Settings" subtitle="Manage your expert preferences" />

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* ── Profile section ── */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Information
          </h3>

          {/* Avatar upload */}
          <div className="flex items-center gap-5 mb-6">
            {/* Preview */}
            <div className="relative w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden shrink-0">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {/* Upload overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-card-foreground">
                {form.fullName || 'Your Name'}
              </p>
              <p className="text-xs text-muted-foreground">{email}</p>
              <label
                htmlFor="avatar-upload"
                className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium cursor-pointer transition-colors ${uploading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-input text-card-foreground'
                  }`}
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                {uploading ? 'Uploading…' : 'Upload Image'}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" icon={User}>
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                className={inputCls}
              />
            </Field>

            <Field label="Email (read-only)" icon={Mail}>
              <input
                type="email"
                value={email}
                readOnly
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </Field>

            <Field label="Specialty" icon={BadgeCheck}>
              <input
                type="text"
                value={form.specialty ?? ''}
                onChange={set('specialty')}
                placeholder="e.g. Musculoskeletal Radiology"
                className={inputCls}
              />
            </Field>

            <Field label="Phone Number" icon={Phone}>
              <input
                type="tel"
                value={form.phoneNumber ?? ''}
                onChange={set('phoneNumber')}
                placeholder="+84 …"
                className={inputCls}
              />
            </Field>

            <Field label="Date of Birth" icon={Calendar}>
              <input
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={set('dateOfBirth')}
                className={inputCls}
              />
            </Field>

            <Field label="Gender" icon={User}>
              <select value={form.gender ?? ''} onChange={set('gender')} className={inputCls}>
                <option value="">— select —</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Address" icon={MapPin}>
                <input
                  type="text"
                  value={form.address ?? ''}
                  onChange={set('address')}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Bio" icon={FileText}>
                <textarea
                  rows={3}
                  value={form.bio ?? ''}
                  onChange={set('bio')}
                  placeholder="A short introduction about yourself…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Review Settings ── */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Review Settings
          </h3>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Auto-approve accuracy threshold (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={autoApproveThreshold}
              onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-1">
              AI answers with accuracy above this will be auto-approved
            </p>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              {
                label: 'New Q&A for review',
                desc: 'When students ask new questions',
                value: notifyNewQA,
                setter: setNotifyNewQA,
              },
              {
                label: 'Flagged content',
                desc: 'When content is flagged for expert review',
                value: notifyFlagged,
                setter: setNotifyFlagged,
              },
              {
                label: 'Quiz completions',
                desc: 'When students complete your quizzes',
                value: notifyQuizComplete,
                setter: setNotifyQuizComplete,
              },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => item.setter(!item.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${item.value ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${item.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setAutoApproveThreshold(90);
              setNotifyNewQA(true);
              setNotifyFlagged(true);
              setNotifyQuizComplete(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
