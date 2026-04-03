"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { User, Role, Status, initialUsers, roleConfig, allRoles } from "@/components/admin/users/types";
import UserTable from "@/components/admin/users/UserTable";
import AssignRoleDialog from "@/components/admin/users/AssignRoleDialog";
import ConfirmDialog from "@/components/admin/users/ConfirmDialog";
import RevokeDialog from "@/components/admin/users/RevokeDialog";
import { getAdminUsersByRole, assignAdminRole, revokeAdminRole } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Role | "Pending">("Pending");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        const data = await getAdminUsersByRole(activeTab, token);
        const fetchedUsers = Array.isArray(data) ? data : (data.users || data.result || data.data || []);
        
        if (!Array.isArray(fetchedUsers)) {
           setErrorMsg(`Data parsed is not an array. Type: ${typeof fetchedUsers}`);
        }
        
        const mappedUsers: User[] = fetchedUsers.map((u: any) => ({
          id: u.id || u.applicationUserId || u.userId || Math.random().toString(),
          name: u.fullName || u.name || "Unknown",
          email: u.email || "",
          role: activeTab === "Pending" ? "Unassigned" : (u.roles?.[0] || activeTab),
          status: activeTab === "Pending" ? "Pending" : (u.isActive === false ? "Inactive" : "Active"),
          joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          className: u.schoolCohort || u.className || undefined,
        }));
        setUsers(mappedUsers);
      } catch (err: any) {
        setErrorMsg(`Exception: ${err.message}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [activeTab]);

  const [confirmDialog, setConfirmDialog] = useState<{
    user: User;
    action: "activate" | "deactivate";
  } | null>(null);

  const [assignRoleDialog, setAssignRoleDialog] = useState<{
    user: User;
  } | null>(null);

  const [revokeDialog, setRevokeDialog] = useState<User | null>(null);

  const handleRevokeRole = async () => {
    if (!revokeDialog) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") || "" : "";
      const response = await revokeAdminRole(revokeDialog.id, token);

      if (!response) {
        showToast("Empty response from server", "error");
        return;
      }

      // Xoá user khỏi UI tab hiện tại
      setUsers((prev) => prev.filter((u) => u.id !== revokeDialog.id));

      setRevokeDialog(null);
      showToast(response.message || "Đã thu hồi quyền thành công!");
    } catch (error: any) {
      console.warn("Error revoking role:", error);
      showToast(error.message || "Có lỗi xảy ra khi thu hồi quyền!", "error");
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      // Logic for Tabs (already filtered by API, just local state safety check)
      if (activeTab === "Pending") {
        if (u.status !== "Pending") return false;
      } else {
        if (u.status === "Pending") return false;
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
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") || "" : "";
      
      const response = await assignAdminRole(user.id, selectedRole, token);
      
      if (!response) {
        showToast("Empty response from server", "error");
        return;
      }

      // Xoá user khỏi UI tab Pending (hoặc Cập nhật role tuỳ cách hiển thị hiện tại)
      setUsers((prev) => prev.filter((u) => u.id !== user.id));

      setAssignRoleDialog(null);
      showToast(response.message || `Đã phân quyền ${selectedRole} thành công!`);
      
    } catch (error: any) {
      console.warn("Error assigning role:", error);
      showToast(error.message || "Có lỗi xảy ra khi phân quyền!", "error");
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
        <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 w-fit">
          <button
            onClick={() => setActiveTab("Pending")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === "Pending"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            {t('users.pendingRequests', 'Pending Requests')}
            {users.filter((u) => u.status === "Pending").length > 0 && (
              <span
                className={`flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full ${activeTab === "Pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}
              >
                {users.filter((u) => u.status === "Pending").length}
              </span>
            )}
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1" />
          
          {allRoles.map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            const isActive = activeTab === role;
            const roleKey = role.toLowerCase() as 'admin'|'student'|'lecturer'|'expert';
            return (
              <button
                key={role}
                onClick={() => setActiveTab(role)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`} />
                {t(`users.roles.${roleKey}`, role) + 's'}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('users.searchPlaceholder', 'Search by name, email or class...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm placeholder:text-slate-400"
            />
          </div>
          <div className="relative w-full md:w-56">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | "All")}
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium text-slate-700 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Data Container Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          {errorMsg ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-red-50/50">
              <h3 className="text-lg font-bold text-red-600">Lỗi khi gọi API</h3>
              <p className="text-red-500 mt-2 max-w-lg break-all">{errorMsg}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No users found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500">Loading users...</p>
            </div>
          ) : activeTab === "Student" ? (
            <div className="flex flex-col">
              {Object.entries(studentsByClass).map(([cls, classUsers]) => {
                const isClassCollapsed = collapsedClasses.has(cls);
                return (
                  <div
                    key={cls}
                    className="border-b text-slate-200/60 last:border-0"
                  >
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
                        onOpenRevokeRole={(user) => setRevokeDialog(user)}
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
              onOpenRevokeRole={(user) => setRevokeDialog(user)}
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

      {/* Revoke Dialog */}
      {revokeDialog && (
        <RevokeDialog
          user={revokeDialog}
          onConfirm={handleRevokeRole}
          onCancel={() => setRevokeDialog(null)}
        />
      )}

      {/* Toast Message UI */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <p className="font-semibold text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
