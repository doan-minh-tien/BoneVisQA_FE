'use client';

import { Eye, EyeOff, Loader2, Mail, ShieldCheck, User, UserCog, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '../UserManagementTable';
import { CreateUserPayload } from '@/lib/api/admin-users';

interface CreateUserDialogProps {
  onCancel: () => void;
  onConfirm: (payload: CreateUserPayload) => Promise<void>;
}

interface EditUserDialogProps {
  userId: string;
  initialFullName: string;
  initialCohort: string | undefined;
  onCancel: () => void;
  onConfirm: (userId: string, fullName: string, cohort: string | undefined) => Promise<void>;
}

interface DeleteConfirmDialogProps {
  userId: string;
  userName: string;
  onCancel: () => void;
  onConfirm: (userId: string) => Promise<void>;
}

// ── Create User Dialog ──────────────────────────────────────────────────────

export function CreateUserDialog({ onCancel, onConfirm }: CreateUserDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cohort, setCohort] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        schoolCohort: cohort.trim() || undefined,
        role,
        sendWelcomeEmail: sendEmail,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg animate-in rounded-2xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in-95">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <UserPlus className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Create new user</h3>
            <p className="text-sm text-slate-500">Fill in the details to create a new account.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Nguyen Van A"
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.fullName ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'
                }`}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.edu"
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.email ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-12 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.password ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Cohort + Role row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cohort / Class</label>
              <input
                type="text"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="e.g. Class 2025-A"
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Student">Student</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Expert">Expert</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Send welcome email toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span className="text-sm font-medium text-slate-700">
              Send welcome email with account credentials
            </span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Create user
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit User Dialog ─────────────────────────────────────────────────────────

export function EditUserDialog({
  userId,
  initialFullName,
  initialCohort,
  onCancel,
  onConfirm,
}: EditUserDialogProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [cohort, setCohort] = useState(initialCohort ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm(userId, fullName.trim(), cohort.trim() || undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in-95">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <UserCog className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Edit user</h3>
            <p className="text-sm text-slate-500">Update name and cohort information.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.fullName ? 'border-red-400' : 'border-border focus:border-primary'
                }`}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cohort / Class</label>
            <input
              type="text"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              placeholder="e.g. Class 2025-A"
              className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <p className="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            <strong>Note:</strong> To change the user&apos;s role, use the &ldquo;Change role&rdquo; button in the user row. Email cannot be changed.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Dialog ──────────────────────────────────────────────

export function DeleteConfirmDialog({
  userId,
  userName,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(userId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-in rounded-2xl bg-white p-8 shadow-2xl duration-200 fade-in zoom-in-95">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-8 border-rose-100/60 bg-rose-50">
          <User className="h-8 w-8 text-rose-600" />
        </div>

        <h3 className="mb-2 text-center text-2xl font-bold text-slate-800">Delete user?</h3>
        <p className="mb-6 px-2 text-center text-sm text-slate-500">
          Are you sure you want to permanently delete{' '}
          <strong className="font-bold text-slate-800">{userName}</strong>? This action cannot be undone and will remove all their data from the system.
        </p>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-700">
            Warning: All associated data — learning progress, quiz attempts, expert reviews, and more — will be permanently lost.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Yes, delete user
          </button>
        </div>
      </div>
    </div>
  );
}
