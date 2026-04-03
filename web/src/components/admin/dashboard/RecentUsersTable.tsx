import { Users } from 'lucide-react';
import Link from 'next/link';
import type { AdminRecentUser } from '@/lib/api/admin-dashboard';

interface RecentUsersTableProps {
  users: AdminRecentUser[];
  isLoading?: boolean;
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

export default function RecentUsersTable({ users, isLoading }: RecentUsersTableProps) {
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
      {users.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'Student'
                        ? 'bg-primary/10 text-primary'
                        : user.role === 'Lecturer'
                        ? 'bg-accent/10 text-accent'
                        : user.role === 'Expert'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      user.isActive ? 'text-success' : 'text-warning'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.isActive ? 'bg-success' : 'bg-warning'
                      }`} />
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
      )}
    </div>
  );
}
