import { Users } from 'lucide-react';
import Link from 'next/link';

export const recentUsers = [
  { name: 'Nguyen Van A', email: 'nguyenvana@edu.vn', role: 'Student', status: 'Active', joinedAt: '2 hours ago' },
  { name: 'Tran Thi B', email: 'tranthib@edu.vn', role: 'Student', status: 'Active', joinedAt: '5 hours ago' },
  { name: 'Le Van C', email: 'levanc@edu.vn', role: 'Lecturer', status: 'Pending', joinedAt: '1 day ago' },
  { name: 'Pham Thi D', email: 'phamthid@edu.vn', role: 'Expert', status: 'Active', joinedAt: '1 day ago' },
  { name: 'Hoang Van E', email: 'hoangvane@edu.vn', role: 'Student', status: 'Active', joinedAt: '2 days ago' },
];

export default function RecentUsersTable() {
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
            {recentUsers.map((user, idx) => (
              <tr key={idx} className="hover:bg-input/50 transition-colors duration-150">
                <td className="px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'Student'
                      ? 'bg-primary/10 text-primary'
                      : user.role === 'Lecturer'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                    user.status === 'Active' ? 'text-success' : 'text-warning'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      user.status === 'Active' ? 'bg-success' : 'bg-warning'
                    }`} />
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{user.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
