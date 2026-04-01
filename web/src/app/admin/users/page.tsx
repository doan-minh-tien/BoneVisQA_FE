'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { useToast } from '@/components/ui/toast';
import {
  assignAdminUserRole,
  fetchAdminUsers,
  toggleAdminUserStatus,
} from '@/lib/api/admin-users';
import type { AdminUser } from '@/lib/api/types';
import {
  Calendar,
  ChevronDown,
  Filter,
  Loader2,
  Mail,
  Search,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';

type Role = 'Student' | 'Lecturer' | 'Expert' | 'Admin';
type Status = 'Active' | 'Inactive';

type UiUser = {
  id: string;
  name: string;
  email: string;
  role: Role | 'Unassigned';
  status: Status;
  joinedAt: string;
  className?: string;
};

const statusStyle: Record<Status, { dot: string; text: string; bg: string }> = {
  Active: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Inactive: { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

const allRoles: Role[] = ['Student', 'Lecturer', 'Expert', 'Admin'];

function normalizeUser(user: AdminUser): UiUser {
  const primaryRole = (user.roles[0] || 'Unassigned') as UiUser['role'];
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: primaryRole,
    status: user.isActive ? 'Active' : 'Inactive',
    joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A',
    className: user.schoolCohort,
  };
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Role | 'Unassigned'>('Student');
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [statusTarget, setStatusTarget] = useState<UiUser | null>(null);
  const [assignRoleDialog, setAssignRoleDialog] = useState<{ user: UiUser } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminUsers();
        if (!cancelled) {
          setUsers(data.map(normalizeUser));
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load users.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (activeTab !== 'Unassigned' && u.role !== activeTab) return false;
      if (activeTab === 'Unassigned' && u.role !== 'Unassigned') return false;
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.className?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = filterStatus === 'All' || u.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [users, search, activeTab, filterStatus]);

  const countsByTab = useMemo(
    () => ({
      Student: users.filter((u) => u.role === 'Student').length,
      Lecturer: users.filter((u) => u.role === 'Lecturer').length,
      Expert: users.filter((u) => u.role === 'Expert').length,
      Admin: users.filter((u) => u.role === 'Admin').length,
      Unassigned: users.filter((u) => u.role === 'Unassigned').length,
    }),
    [users],
  );

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setSubmitting(true);
    try {
      const nextIsActive = statusTarget.status !== 'Active';
      await toggleAdminUserStatus(statusTarget.id, nextIsActive);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === statusTarget.id
            ? { ...user, status: nextIsActive ? 'Active' : 'Inactive' }
            : user,
        ),
      );
      toast.success(`User ${nextIsActive ? 'activated' : 'deactivated'} successfully.`);
      setStatusTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRole = async (user: UiUser, selectedRole: Role) => {
    setSubmitting(true);
    try {
      await assignAdminUserRole(user.id, selectedRole);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, role: selectedRole, status: item.status === 'Inactive' ? 'Inactive' : 'Active' }
            : item,
        ),
      );
      toast.success(`Assigned ${selectedRole} role to ${user.name}.`);
      setAssignRoleDialog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign role.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header title="User Management" subtitle={`${users.length} accounts loaded from the platform directory`} />

      <div className="mx-auto max-w-[1600px] space-y-8 p-6">
        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          <TabButton
            label="Unassigned"
            count={countsByTab.Unassigned}
            active={activeTab === 'Unassigned'}
            onClick={() => setActiveTab('Unassigned')}
          />
          {allRoles.map((role) => (
            <TabButton
              key={role}
              label={role}
              count={countsByTab[role]}
              active={activeTab === role}
              onClick={() => setActiveTab(role)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or cohort..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-input pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}
              className="h-12 w-full appearance-none rounded-xl border border-border bg-input pl-12 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-card-foreground">No users found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting the role tab or the current search filters.
              </p>
            </div>
          ) : (
            <UserTable
              users={filtered}
              onToggleStatus={(user) => setStatusTarget(user)}
              onOpenAssignRole={(user) => setAssignRoleDialog({ user })}
            />
          )}
        </div>
      </div>

      {statusTarget ? (
        <ConfirmDialog
          user={statusTarget}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleToggleStatus()}
          isLoading={submitting}
        />
      ) : null}

      {assignRoleDialog ? (
        <AssignRoleDialog
          user={assignRoleDialog.user}
          onCancel={() => setAssignRoleDialog(null)}
          onConfirm={(role) => void handleAssignRole(assignRoleDialog.user, role)}
          isLoading={submitting}
        />
      ) : null}
    </div>
  );
}

function UserTable({
  users,
  onToggleStatus,
  onOpenAssignRole,
}: {
  users: UiUser[];
  onToggleStatus: (user: UiUser) => void;
  onOpenAssignRole: (user: UiUser) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200/60">
            <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
              User Profile
            </th>
            <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
              Contact Info
            </th>
            <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
              Status
            </th>
            <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
              Joined Date
            </th>
            <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => {
            const status = statusStyle[user.status];
            const isActive = user.status === "Active";
            return (
              <tr
                key={user.id}
                className="hover:bg-slate-50 transition-colors duration-200 group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-indigo-700 shadow-sm border border-indigo-200/50 group-hover:scale-105 transition-transform duration-300">
                      {user.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">
                        {user.name}
                      </span>
                      {user.role === "Unassigned" ? (
                        <span className="text-xs text-slate-400 font-medium">New Registration</span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">{user.role}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="p-1.5 rounded-md bg-slate-100 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                    />
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{user.joinedAt}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-3">
                    {user.role === "Unassigned" ? (
                      <button
                        onClick={() => onOpenAssignRole(user)}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Assign Role
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(user)}
                        className="flex items-center gap-3 cursor-pointer group/btn"
                        title={isActive ? "Deactivate user" : "Activate user"}
                      >
                        <span
                          className={`text-xs font-bold transition-colors ${isActive ? "text-slate-400 group-hover/btn:text-emerald-600" : "text-slate-400 group-hover/btn:text-slate-600"}`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                        <div
                          className={`relative w-11 h-6 rounded-full transition-all duration-300 shadow-inner ${isActive ? "bg-emerald-500" : "bg-slate-200"}`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isActive ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </div>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AssignRoleDialog({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: UiUser;
  onConfirm: (role: Role) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("Student");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800">Assign Role</h3>
          <p className="text-sm text-slate-500 mt-1">Approve this user and grant them access.</p>
        </div>
        
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
            {user.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">
              {user.name}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Role to Assign
          </label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full h-12 pl-4 pr-10 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all shadow-sm"
            >
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Expert">Expert</option>
              <option value="Admin">Admin</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedRole)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Confirm & Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// KHÔI PHỤC LẠI COMPONENT BỊ MẤT
function ConfirmDialog({
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDeactivate ? "bg-rose-50 border-8 border-rose-100/50" : "bg-emerald-50 border-8 border-emerald-100/50"}`}
        >
          {isDeactivate ? (
            <UserX className="w-8 h-8 text-rose-600" />
          ) : (
            <UserCheck className="w-8 h-8 text-emerald-600" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">
          {isDeactivate ? "Deactivate User" : "Activate User"}
        </h3>
        <p className="text-sm text-slate-500 text-center mb-8 px-4">
          {isDeactivate ? (
            <>
              Are you sure you want to deactivate{" "}
              <strong className="text-slate-900 font-bold">{user.name}</strong>?
              They will no longer be able to log in.
            </>
          ) : (
            <>
              Are you sure you want to activate{" "}
              <strong className="text-slate-900 font-bold">{user.name}</strong>?
              They will be able to log in and access the system.
            </>
          )}
        </p>

        {isDeactivate && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200/50 mb-8">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700 font-medium">
              This action will immediately revoke access. The user can be
              reactivated later.
            </p>
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-70 ${isDeactivate ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"}`}
          >
            {isLoading ? 'Saving...' : isDeactivate ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
        active ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {count}
      </span>
    </button>
  );
}
