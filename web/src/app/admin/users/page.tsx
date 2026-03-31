"use client";

import { useState, useMemo, useCallback } from "react";
import Header from "@/components/Header";
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
  Loader2,
  Clock,
} from "lucide-react";

type Role = "Student" | "Lecturer" | "Expert" | "Admin";
type Status = "Active" | "Inactive" | "Pending";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role | "Unassigned";
  status: Status;
  joinedAt: string;
  className?: string;
}

const initialUsers: User[] = [
  {
    id: "1",
    name: "Nguyen Van A",
    email: "nguyenvana@edu.vn",
    role: "Student",
    status: "Active",
    joinedAt: "2025-09-01",
    className: "SE1801",
  },
  {
    id: "2",
    name: "Tran Thi B",
    email: "tranthib@edu.vn",
    role: "Student",
    status: "Active",
    joinedAt: "2025-09-01",
    className: "SE1801",
  },
  {
    id: "7",
    name: "Dang Van G",
    email: "dangvang@edu.vn",
    role: "Student",
    status: "Pending",
    joinedAt: "2026-01-10",
    className: "SE1801",
  },
  {
    id: "11",
    name: "Dr. Nguyen Minh",
    email: "nguyenminh@edu.vn",
    role: "Lecturer",
    status: "Active",
    joinedAt: "2024-08-01",
  },
  {
    id: "17",
    name: "New Teacher",
    email: "newteacher@edu.vn",
    role: "Unassigned",
    status: "Pending",
    joinedAt: "2026-02-15",
  },
  {
    id: "18",
    name: "Super Admin",
    email: "admin@bonevisqa.com",
    role: "Admin",
    status: "Active",
    joinedAt: "2024-01-01",
  },
];

const roleConfig: Record<
  Role,
  { icon: typeof Users; color: string; bg: string }
> = {
  Student: { icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-100" },
  Lecturer: { icon: UserCog, color: "text-violet-600", bg: "bg-violet-100" },
  Expert: { icon: Stethoscope, color: "text-amber-600", bg: "bg-amber-100" },
  Admin: {
    icon: ShieldCheck,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
};

const statusStyle: Record<Status, { dot: string; text: string; bg: string }> = {
  Active: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  Inactive: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
  Pending: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
};

const allRoles: Role[] = ["Student", "Lecturer", "Expert", "Admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Role | "Pending">("Pending");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(
    new Set(),
  );

  const [confirmDialog, setConfirmDialog] = useState<{
    user: User;
    action: "activate" | "deactivate";
  } | null>(null);

  const [assignRoleDialog, setAssignRoleDialog] = useState<{
    user: User;
  } | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      // Logic for Tabs
      if (activeTab === "Pending") {
        if (u.status !== "Pending") return false;
      } else {
        if (u.role !== activeTab || u.status === "Pending") return false;
      }

      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.className?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = filterStatus === "All" || u.status === filterStatus;
      
      return matchSearch && matchStatus;
    });
  }, [users, search, activeTab, filterStatus]);

  const studentsByClass = useMemo(() => {
    if (activeTab !== "Student") return {};
    const map: Record<string, User[]> = {};
    for (const s of filtered) {
      const cls = s.className || "Unassigned";
      if (!map[cls]) map[cls] = [];
      map[cls].push(s);
    }
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
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
    const action = user.status === "Active" ? "deactivate" : "activate";
    setConfirmDialog({ user, action });
  }, []);

  const confirmToggle = useCallback(() => {
    if (!confirmDialog) return;
    const { user, action } = confirmDialog;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, status: action === "activate" ? "Active" : "Inactive" }
          : u,
      ),
    );
    setConfirmDialog(null);
  }, [confirmDialog]);

  const handleAssignRole = async (user: User, selectedRole: Role) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      // GỌI API
      const response = await fetch(
        `${apiUrl}/api/Admin/${user.id}/assign-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") || "" : ""}`
          },
          body: JSON.stringify({ roles: [selectedRole] }),
        },
      );

      if (!response.ok) {
        // Nếu lỗi, không ném exception Error ra ngoài để tránh Next.js hiển thị màn hình đỏ
        const errorData = await response.json().catch(() => null);
        alert(errorData?.message || "Failed to assign role");
        return;
      }

      // ĐỌC PAYLOAD TỪ BE TRẢ VỀ
      const data = await response.json();
      const assignedRole = data.result?.roles?.[0] as Role || selectedRole;
      const isUserActive = data.result ? data.result.isActive : true;

      // CẬP NHẬT GIAO DIỆN
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                role: assignedRole,
                status: isUserActive ? "Active" : "Inactive",
              }
            : u,
        ),
      );

      setAssignRoleDialog(null);
      alert(data.message || "Assign user successfully.");
    } catch (error) {
      console.warn("Error assigning role:", error);
      alert("Có lỗi xảy ra khi cập nhật phân quyền!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <Header
        title="User Management"
        subtitle={`${users.length} total members in the platform`}
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        {/* Premium Tabs Strip */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-x-auto hide-scrollbar">
          {/* Pending Tab Special */}
          <button
            onClick={() => {
              setActiveTab("Pending");
              setSearch("");
              setFilterStatus("All");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === "Pending"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Requests</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "Pending"
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {users.filter((u) => u.status === "Pending").length}
            </span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-2 shrink-0" />

          {/* Regular Role Tabs */}
          {allRoles.map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            const count = users.filter((u) => u.role === role && u.status !== "Pending").length;
            const isActive = activeTab === role;

            return (
              <button
                key={role}
                onClick={() => {
                  setActiveTab(role);
                  setSearch("");
                  setFilterStatus("All");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white/80" : ""}`} />
                <span>{role}s</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter section */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "Student"
                  ? "Search by student name, email, or class id..."
                  : "Search profiles by name or email address..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50/50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            />
          </div>
          {activeTab !== "Pending" && (
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as Status | "All")
                }
                className="w-full h-12 pl-12 pr-10 rounded-xl bg-slate-50/50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Users</option>
                <option value="Inactive">Inactive Users</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center bg-slate-50/30">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700">
                No {activeTab.toLowerCase()}s found
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Try adjusting your search query or filters
              </p>
            </div>
          ) : activeTab === "Student" ? (
            <div>
              {Object.entries(studentsByClass).map(([cls, classUsers]) => {
                const isClassCollapsed = collapsedClasses.has(cls);
                return (
                  <div key={cls}>
                    <button
                      onClick={() => toggleClass(cls)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-slate-50/80 hover:bg-slate-100/80 transition-colors duration-200 cursor-pointer border-b border-slate-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-md bg-white shadow-sm border border-slate-200">
                          {isClassCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {cls}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-100/50 text-blue-700 rounded-full text-xs font-semibold">
                          {classUsers.length} Students
                        </span>
                      </div>
                    </button>
                    {!isClassCollapsed && (
                      <UserTable
                        users={classUsers}
                        onToggleStatus={handleToggleStatus}
                        onOpenAssignRole={(user) =>
                          setAssignRoleDialog({ user })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <UserTable
              users={filtered}
              onToggleStatus={handleToggleStatus}
              onOpenAssignRole={(user) => setAssignRoleDialog({ user })}
            />
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

      {/* Assign Role Dialog */}
      {assignRoleDialog && (
        <AssignRoleDialog
          user={assignRoleDialog.user}
          onConfirm={(role) => handleAssignRole(assignRoleDialog.user, role)}
          onCancel={() => setAssignRoleDialog(null)}
        />
      )}
    </div>
  );
}

function UserTable({
  users,
  onToggleStatus,
  onOpenAssignRole,
}: {
  users: User[];
  onToggleStatus: (user: User) => void;
  onOpenAssignRole: (user: User) => void;
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
                    {user.status === "Pending" ? (
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
}: {
  user: User;
  onConfirm: (role: Role) => Promise<void>;
  onCancel: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>("Student");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await onConfirm(selectedRole);
    setIsLoading(false);
  };

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
            onClick={handleSubmit}
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
  action,
  onConfirm,
  onCancel,
}: {
  user: User;
  action: "activate" | "deactivate";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDeactivate = action === "deactivate";

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
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-md cursor-pointer transition-all active:scale-95 ${isDeactivate ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"}`}
          >
            {isDeactivate ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
