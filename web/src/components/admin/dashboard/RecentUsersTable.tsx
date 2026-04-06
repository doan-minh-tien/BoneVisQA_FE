import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import type { AdminRecentUser } from '@/lib/api/admin-dashboard';

interface RecentUsersTableProps {
  users: AdminRecentUser[];
  isLoading?: boolean;
  /** Khi đổi trang và đang tải lại chỉ danh sách user */
  isPaging?: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function formatJoinedDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'Student':
      return 'bg-primary/10 text-primary';
    case 'Lecturer':
      return 'bg-accent/10 text-accent';
    case 'Expert':
      return 'bg-warning/10 text-warning';
    case 'Admin':
      return 'bg-destructive/10 text-destructive';
    case 'Pending':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function RecentUsersTable({
  users,
  isLoading,
  isPaging,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: RecentUsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-card-foreground">Recent Users</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-card-foreground">Recent Users</h2>
        </div>
        <Link href="/admin/users" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      {users.length === 0 && !isPaging ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          No users found.
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto">
            {isPaging ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
                <span className="text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : null}
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-input/50 transition-colors duration-150">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          user.isActive ? 'text-success' : 'text-warning'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? 'bg-success' : 'bg-warning'
                          }`}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {formatJoinedDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalCount > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {from}–{to} / {totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isPaging}
                  onClick={() => onPageChange(page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || isPaging}
                  onClick={() => onPageChange(page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
