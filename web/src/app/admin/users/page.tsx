'use client';

import { useState, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  UserCog,
  Stethoscope,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  X,
  AlertTriangle,
} from 'lucide-react';

type Role = 'Student' | 'Lecturer' | 'Expert' | 'Curator' | 'Admin';
type Status = 'Active' | 'Inactive' | 'Pending';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  joinedAt: string;
  className?: string;
}

const initialUsers: User[] = [
  { id: '1', name: 'Nguyen Van A', email: 'nguyenvana@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-01', className: 'SE1801' },
  { id: '2', name: 'Tran Thi B', email: 'tranthib@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-01', className: 'SE1801' },
  { id: '3', name: 'Le Van C', email: 'levanc@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-01', className: 'SE1802' },
  { id: '4', name: 'Pham Thi D', email: 'phamthid@edu.vn', role: 'Student', status: 'Inactive', joinedAt: '2025-09-01', className: 'SE1802' },
  { id: '5', name: 'Hoang Van E', email: 'hoangvane@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-15', className: 'SE1803' },
  { id: '6', name: 'Vo Thi F', email: 'vothif@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-15', className: 'SE1803' },
  { id: '7', name: 'Dang Van G', email: 'dangvang@edu.vn', role: 'Student', status: 'Pending', joinedAt: '2026-01-10', className: 'SE1801' },
  { id: '8', name: 'Bui Thi H', email: 'buithih@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-01', className: 'SE1804' },
  { id: '9', name: 'Ngo Van I', email: 'ngovani@edu.vn', role: 'Student', status: 'Active', joinedAt: '2025-09-01', className: 'SE1804' },
  { id: '10', name: 'Truong Thi K', email: 'truongthik@edu.vn', role: 'Student', status: 'Active', joinedAt: '2026-01-10' },
  { id: '11', name: 'Dr. Nguyen Minh', email: 'nguyenminh@edu.vn', role: 'Lecturer', status: 'Active', joinedAt: '2024-08-01' },
  { id: '12', name: 'Dr. Tran Hoang', email: 'tranhoang@edu.vn', role: 'Lecturer', status: 'Active', joinedAt: '2024-08-01' },
  { id: '13', name: 'Dr. Le Thanh', email: 'lethanh@edu.vn', role: 'Lecturer', status: 'Inactive', joinedAt: '2024-08-01' },
  { id: '14', name: 'Dr. Pham Expert', email: 'phamexpert@edu.vn', role: 'Expert', status: 'Active', joinedAt: '2024-06-01' },
  { id: '15', name: 'Dr. Hoang Expert', email: 'hoangexpert@edu.vn', role: 'Expert', status: 'Active', joinedAt: '2024-06-01' },
  { id: '16', name: 'Nguyen Curator', email: 'nguyencurator@edu.vn', role: 'Curator', status: 'Active', joinedAt: '2024-07-01' },
  { id: '17', name: 'Tran Curator', email: 'trancurator@edu.vn', role: 'Curator', status: 'Pending', joinedAt: '2026-02-15' },
  { id: '18', name: 'Super Admin', email: 'admin@bonevisqa.com', role: 'Admin', status: 'Active', joinedAt: '2024-01-01' },
];

const roleConfig: Record<Role, { icon: typeof Users; color: string; bg: string }> = {
  Student: { icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10' },
  Lecturer: { icon: UserCog, color: 'text-accent', bg: 'bg-accent/10' },
  Expert: { icon: Stethoscope, color: 'text-warning', bg: 'bg-warning/10' },
  Curator: { icon: BookOpen, color: 'text-secondary', bg: 'bg-secondary/10' },
  Admin: { icon: ShieldCheck, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const statusStyle: Record<Status, { dot: string; text: string }> = {
  Active: { dot: 'bg-success', text: 'text-success' },
  Inactive: { dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
  Pending: { dot: 'bg-warning', text: 'text-warning' },
};

const allRoles: Role[] = ['Student', 'Lecturer', 'Expert', 'Curator', 'Admin'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Role>('Student');
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{ user: User; action: 'activate' | 'deactivate' } | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== activeTab) return false;
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.className?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = filterStatus === 'All' || u.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [users, search, activeTab, filterStatus]);

  const studentsByClass = useMemo(() => {
    if (activeTab !== 'Student') return {};
    const map: Record<string, User[]> = {};
    for (const s of filtered) {
      const cls = s.className || 'Unassigned';
      if (!map[cls]) map[cls] = [];
      map[cls].push(s);
    }
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [filtered, activeTab]);

  const toggleClass = (cls: string) => {
    setCollapsedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls);
      else next.add(cls);
      return next;
    });
  };

  const handleToggleStatus = useCallback((user: User) => {
    const action = user.status === 'Active' ? 'deactivate' : 'activate';
    setConfirmDialog({ user, action });
  }, []);

  const confirmToggle = useCallback(() => {
    if (!confirmDialog) return;
    const { user, action } = confirmDialog;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, status: action === 'activate' ? 'Active' : 'Inactive' }
          : u
      )
    );
    setConfirmDialog(null);
  }, [confirmDialog]);

  return (
    <div className="min-h-screen">
      <Header title="User Management" subtitle={`${users.length} users total`} />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Role Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {allRoles.map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            const count = users.filter((u) => u.role === role).length;
            const isActive = activeTab === role;

            return (
              <button
                key={role}
                onClick={() => { setActiveTab(role); setSearch(''); setFilterStatus('All'); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 cursor-pointer -mb-px ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-card-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{role}s</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === 'Student' ? 'Search by name, email, or class...' : 'Search by name or email...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}
              className="h-10 pl-10 pr-8 rounded-lg bg-card border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium text-card-foreground">No {activeTab.toLowerCase()}s found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : activeTab === 'Student' ? (
            <div>
              {Object.entries(studentsByClass).map(([cls, classUsers]) => {
                const isClassCollapsed = collapsedClasses.has(cls);
                return (
                  <div key={cls}>
                    <button
                      onClick={() => toggleClass(cls)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-input/20 hover:bg-input/40 transition-colors duration-150 cursor-pointer border-b border-border"
                    >
                      <div className="flex items-center gap-2">
                        {isClassCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-card-foreground">{cls}</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {classUsers.length}
                        </span>
                      </div>
                    </button>
                    {!isClassCollapsed && (
                      <UserTable users={classUsers} onToggleStatus={handleToggleStatus} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <UserTable users={filtered} onToggleStatus={handleToggleStatus} />
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          user={confirmDialog.user}
          action={confirmDialog.action}
          onConfirm={confirmToggle}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

function UserTable({
  users,
  onToggleStatus,
}: {
  users: User[];
  onToggleStatus: (user: User) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-2.5">Name</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-2.5">Email</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-2.5">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-2.5">Joined</th>
            <th className="text-right text-xs font-medium text-muted-foreground uppercase px-5 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => {
            const status = statusStyle[user.status];
            const isActive = user.status === 'Active';
            return (
              <tr key={user.id} className="hover:bg-input/30 transition-colors duration-150">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-card-foreground">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {user.joinedAt}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => onToggleStatus(user)}
                      className="group flex items-center gap-2 cursor-pointer"
                      title={isActive ? 'Deactivate user' : 'Activate user'}
                    >
                      <div className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                        isActive ? 'bg-success' : user.status === 'Pending' ? 'bg-warning' : 'bg-muted-foreground/30'
                      }`}>
                        <div className={`absolute top-0.75 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          isActive ? 'translate-x-5.5' : 'translate-x-0.75'
                        }`} />
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline ${
                        isActive ? 'text-success' : 'text-muted-foreground'
                      } group-hover:underline`}>
                        {isActive ? 'Active' : user.status === 'Pending' ? 'Pending' : 'Inactive'}
                      </span>
                    </button>
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

function ConfirmDialog({
  user,
  action,
  onConfirm,
  onCancel,
}: {
  user: User;
  action: 'activate' | 'deactivate';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDeactivate = action === 'deactivate';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isDeactivate ? 'bg-destructive/10' : 'bg-success/10'
        }`}>
          {isDeactivate ? (
            <UserX className="w-6 h-6 text-destructive" />
          ) : (
            <UserCheck className="w-6 h-6 text-success" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-card-foreground text-center mb-2">
          {isDeactivate ? 'Deactivate User' : 'Activate User'}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isDeactivate ? (
            <>Are you sure you want to deactivate <strong className="text-card-foreground">{user.name}</strong>? They will no longer be able to log in.</>
          ) : (
            <>Are you sure you want to activate <strong className="text-card-foreground">{user.name}</strong>? They will be able to log in and access the system.</>
          )}
        </p>

        {/* Warning for deactivate */}
        {isDeactivate && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning">
              This action will immediately revoke access. The user can be reactivated later.
            </p>
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-input/50 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email} &middot; {user.role}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors ${
              isDeactivate
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-success hover:bg-success/90'
            }`}
          >
            {isDeactivate ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
