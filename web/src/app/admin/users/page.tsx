'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import {
  UiUser,
  UserManagementTable,
  type UserRole,
  type UserStatus,
} from '@/components/admin/UserManagementTable';
import { UserRoleDialog, UserStatusDialog } from '@/components/admin/UserStatusDialog';
import { TableEmptyState } from '@/components/shared/TableEmptyState';
import { ToolbarField } from '@/components/shared/ToolbarField';
import { useToast } from '@/components/ui/toast';
import {
  assignAdminUserRole,
  fetchAdminUsers,
  toggleAdminUserStatus,
} from '@/lib/api/admin-users';
import type { AdminUser } from '@/lib/api/types';
import { ChevronDown, Filter, Loader2, Search, Users } from 'lucide-react';

const allRoles: UserRole[] = ['Student', 'Lecturer', 'Expert', 'Admin'];

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
  const [activeTab, setActiveTab] = useState<UserRole | 'Unassigned' | 'Pending'>('Student');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'All'>('All');
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

  const handleAssignRole = async (user: UiUser, selectedRole: UserRole) => {
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

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <Header
        title={t('users.title', 'User Management')}
        subtitle={t('users.subtitle', 'Manage user roles, statuses, and permissions')}
      />

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        {/* Modern Apple-like Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 w-fit overflow-x-auto">
          <TabButton
            label={t('users.pendingRequests', 'Pending Requests')}
            count={users.filter(u => u.status === 'Pending').length}
            active={activeTab === 'Pending'}
            onClick={() => setActiveTab('Pending')}
          />
          {allRoles.map((role) => (
            <TabButton
              key={role}
              label={t(`users.roles.${role.toLowerCase()}`, role)}
              count={countsByTab[role]}
              active={activeTab === role}
              onClick={() => setActiveTab(role)}
            />
          ))}
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
              onOpenAssignRole={(user) => setAssignRoleDialog({ user })}
            />
          )}
        </div>
      </div>

      {statusTarget ? (
        <UserStatusDialog
          user={statusTarget}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleToggleStatus()}
          isLoading={submitting}
        />
      ) : null}

      {assignRoleDialog ? (
        <UserRoleDialog
          user={assignRoleDialog.user}
          onCancel={() => setAssignRoleDialog(null)}
          onConfirm={(role) => void handleAssignRole(assignRoleDialog.user, role)}
          isLoading={submitting}
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
