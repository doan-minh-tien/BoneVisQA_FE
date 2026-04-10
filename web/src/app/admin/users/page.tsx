'use client';

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import {
  UiUser,
  UserManagementTable,
  type DisplayRole,
  type UserRole,
  type UserStatus,
} from '@/components/admin/UserManagementTable';
import {
  CreateUserDialog,
  EditUserDialog,
  DeleteConfirmDialog,
} from '@/components/admin/users/UserDialogs';
import { ManageClassesDialog } from '@/components/admin/users/ManageClassesDialog';
import { UserRoleDialog, UserStatusDialog } from '@/components/admin/UserStatusDialog';
import { TableEmptyState } from '@/components/shared/TableEmptyState';
import { ToolbarField } from '@/components/shared/ToolbarField';
import { useToast } from '@/components/ui/toast';
import {
  assignAdminUserRole,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  toggleAdminUserStatus,
  updateAdminUser,
  type CreateUserPayload,
} from '@/lib/api/admin-users';
import type { AdminUser } from '@/lib/api/types';
import { ChevronDown, Filter, Loader2, Plus, Search, Users } from 'lucide-react';

const assignableRoles: UserRole[] = ['Student', 'Lecturer', 'Expert', 'Admin'];
const allRoles = assignableRoles;

type RoleTab = UserRole | 'Pending' | 'Unassigned';

function normalizeUser(user: AdminUser): UiUser {
  const roles = user.roles.map((r) => r.trim()).filter(Boolean);
  const assigned = roles.find((r) =>
    assignableRoles.includes(r as UserRole),
  ) as UserRole | undefined;
  const hasPending = roles.some((r) => r === 'Pending');

  let displayRole: DisplayRole;
  if (assigned) {
    displayRole = assigned;
  } else if (hasPending) {
    displayRole = 'Pending';
  } else {
    displayRole = 'Unassigned';
  }

  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: displayRole,
    status: user.isActive ? 'Active' : 'Inactive',
    joinedAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A',
    className: user.schoolCohort,
  };
}

export default function AdminUsersPage() {
  const toast = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<UiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<RoleTab>('Pending');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'All'>('All');
  const [submitting, setSubmitting] = useState(false);

  const [statusTarget, setStatusTarget] = useState<UiUser | null>(null);
  const [assignRoleDialog, setAssignRoleDialog] = useState<{
    user: UiUser;
    mode: 'assign' | 'change';
  } | null>(null);
  const [editTarget, setEditTarget] = useState<UiUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UiUser | null>(null);
  const [manageClassesTarget, setManageClassesTarget] = useState<UiUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAdminUsers();
        if (!cancelled) setUsers(data.map(normalizeUser));
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Failed to load users.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (activeTab === 'Pending' && u.role !== 'Pending') return false;
      if (activeTab === 'Unassigned' && u.role !== 'Unassigned') return false;
      if (
        activeTab !== 'Pending' &&
        activeTab !== 'Unassigned' &&
        u.role !== activeTab
      ) {
        return false;
      }
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
      Pending: users.filter((u) => u.role === 'Pending').length,
      Unassigned: users.filter((u) => u.role === 'Unassigned').length,
      Student: users.filter((u) => u.role === 'Student').length,
      Lecturer: users.filter((u) => u.role === 'Lecturer').length,
      Expert: users.filter((u) => u.role === 'Expert').length,
      Admin: users.filter((u) => u.role === 'Admin').length,
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRole = async (user: UiUser, selectedRole: UserRole) => {
    setSubmitting(true);
    try {
      await assignAdminUserRole(user.id, selectedRole);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, role: selectedRole, status: 'Active' as const }
            : item,
        ),
      );
      toast.success(`Role set to ${selectedRole} for ${user.name}.`);
      setAssignRoleDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign role.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (payload: CreateUserPayload) => {
    setSubmitting(true);
    try {
      await createAdminUser(payload);
      toast.success(`User "${payload.fullName}" created successfully.`);
      setCreateOpen(false);
      const data = await fetchAdminUsers();
      setUsers(data.map(normalizeUser));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user.');
      setSubmitting(false);
    }
  };

  const handleEditUser = async (userId: string, fullName: string, cohort: string | undefined) => {
    setSubmitting(true);
    try {
      await updateAdminUser(userId, { fullName, schoolCohort: cohort });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, name: fullName, className: cohort } : u,
        ),
      );
      toast.success('User details updated successfully.');
      setEditTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User deleted successfully.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user.');
    }
  };

  const handleManageClassesUpdated = (
    userId: string,
    updatedClasses: Array<{ id: string; className: string; relationType: string }>,
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, classList: updatedClasses }
          : u,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title={t('users.title', 'User Management')}
        subtitle={`${users.length} accounts loaded from the platform directory`}
      />

      <div className="mx-auto max-w-[1600px] space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            <TabButton
              label={t('users.pendingRequests', 'Pending')}
              count={countsByTab.Pending}
              active={activeTab === 'Pending'}
              onClick={() => setActiveTab('Pending')}
              highlight
            />
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

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
          <ToolbarField>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('users.searchPlaceholder', 'Search by name, email, or class...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-input pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </ToolbarField>
          <ToolbarField>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'All')}
                className="h-12 w-full appearance-none rounded-xl border border-border bg-input pl-12 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </ToolbarField>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <table className="w-full">
              <tbody>
                <TableEmptyState
                  icon={Users}
                  title="No users found"
                  description="Try adjusting the selected role tab or current search filters."
                  colSpan={5}
                />
              </tbody>
            </table>
          ) : (
            <UserManagementTable
              users={filtered}
              onToggleStatus={(user) => setStatusTarget(user)}
              onOpenAssignRole={(user, mode) => setAssignRoleDialog({ user, mode })}
              onEdit={(user) => setEditTarget(user)}
              onDelete={(user) => setDeleteTarget(user)}
              onManageClasses={(user) => setManageClassesTarget(user)}
              hideRoleButton={activeTab === 'Pending'}
            />
          )}
        </div>
      </div>

      {createOpen ? (
        <CreateUserDialog
          onCancel={() => { setCreateOpen(false); setSubmitting(false); }}
          onConfirm={handleCreateUser}
        />
      ) : null}

      {editTarget ? (
        <EditUserDialog
          userId={editTarget.id}
          initialFullName={editTarget.name}
          initialCohort={editTarget.className}
          onCancel={() => { setEditTarget(null); setSubmitting(false); }}
          onConfirm={handleEditUser}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteConfirmDialog
          userId={deleteTarget.id}
          userName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteUser}
        />
      ) : null}

      {assignRoleDialog ? (
        <UserRoleDialog
          user={assignRoleDialog.user}
          mode={assignRoleDialog.mode}
          onCancel={() => setAssignRoleDialog(null)}
          onConfirm={(role) => handleAssignRole(assignRoleDialog.user, role)}
          isLoading={submitting}
        />
      ) : null}

      {statusTarget ? (
        <UserStatusDialog
          user={statusTarget}
          onCancel={() => setStatusTarget(null)}
          onConfirm={handleToggleStatus}
          isLoading={submitting}
        />
      ) : null}

      {manageClassesTarget ? (
        <ManageClassesDialog
          user={manageClassesTarget}
          onCancel={() => setManageClassesTarget(null)}
          onUpdated={handleManageClassesUpdated}
        />
      ) : null}
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
  highlight,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
        active
          ? highlight
            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
            : 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
          active
            ? highlight
              ? 'bg-white/25 text-white'
              : 'bg-white/20 text-white'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
