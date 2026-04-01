import { AlertTriangle, ChevronDown, Loader2, UserCheck, UserX, X } from 'lucide-react';
import { useState } from 'react';
import type { UiUser, UserRole } from './UserManagementTable';

export function UserRoleDialog({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: UiUser;
  onConfirm: (role: UserRole) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-in rounded-2xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in-95">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800">Assign Role</h3>
          <p className="mt-1 text-sm text-slate-500">Approve this user and grant them access.</p>
        </div>

        <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {user.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="mb-2 block text-sm font-bold text-slate-700">Select Role to Assign</label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Expert">Expert</option>
              <option value="Admin">Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedRole)}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Confirm & Assign
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserStatusDialog({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: UiUser;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const isDeactivate = user.status === 'Active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-in rounded-2xl bg-white p-8 shadow-2xl duration-200 fade-in zoom-in-95">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
            isDeactivate ? 'border-8 border-rose-100/50 bg-rose-50' : 'border-8 border-emerald-100/50 bg-emerald-50'
          }`}
        >
          {isDeactivate ? (
            <UserX className="h-8 w-8 text-rose-600" />
          ) : (
            <UserCheck className="h-8 w-8 text-emerald-600" />
          )}
        </div>

        <h3 className="mb-2 text-center text-2xl font-bold text-slate-800">
          {isDeactivate ? 'Deactivate User' : 'Activate User'}
        </h3>
        <p className="mb-8 px-4 text-center text-sm text-slate-500">
          {isDeactivate ? (
            <>
              Are you sure you want to deactivate <strong className="font-bold text-slate-900">{user.name}</strong>?
              They will no longer be able to log in.
            </>
          ) : (
            <>
              Are you sure you want to activate <strong className="font-bold text-slate-900">{user.name}</strong>?
              They will be able to log in and access the system.
            </>
          )}
        </p>

        {isDeactivate ? (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-orange-200/50 bg-orange-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <p className="text-xs font-medium text-orange-700">
              This action will immediately revoke access. The user can be reactivated later.
            </p>
          </div>
        ) : null}

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-70 ${
              isDeactivate
                ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Saving...' : isDeactivate ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
