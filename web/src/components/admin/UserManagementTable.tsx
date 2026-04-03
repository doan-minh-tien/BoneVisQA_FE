import { Calendar, Mail, UserCheck } from 'lucide-react';

export type UserRole = 'Student' | 'Lecturer' | 'Expert' | 'Admin';
export type UserStatus = 'Active' | 'Inactive';

export type UiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | 'Pending';
  status: UserStatus;
  joinedAt: string;
  className?: string;
};

const statusStyle: Record<UserStatus, { dot: string; text: string; bg: string }> = {
  Active: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Inactive: { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

export function UserManagementTable({
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
          <tr className="border-b border-slate-200/60 bg-slate-50/50">
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              User Profile
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Contact Info
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Joined Date
            </th>
            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => {
            const status = statusStyle[user.status];
            const isActive = user.status === 'Active';
            return (
              <tr
                key={user.id}
                className="group even:bg-slate-50/55 transition-colors duration-200 hover:bg-blue-50/70"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200/50 bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-700 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      {user.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                      {user.role === 'Pending' ? (
                        <span className="text-xs font-medium text-slate-400">New Registration</span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">{user.role}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="rounded-md bg-slate-100 p-1.5 text-slate-400">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    {user.email}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${status.bg} ${status.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {user.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{user.joinedAt}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    {user.role === 'Pending' ? (
                      <button
                        onClick={() => onOpenAssignRole(user)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 hover:shadow-md active:scale-95"
                      >
                        <UserCheck className="h-4 w-4" />
                        Assign Role
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(user)}
                        className="group/btn flex cursor-pointer items-center gap-3"
                        title={isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        <span
                          className={`text-xs font-bold transition-colors ${
                            isActive
                              ? 'text-slate-400 group-hover/btn:text-emerald-600'
                              : 'text-slate-400 group-hover/btn:text-slate-600'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div
                          className={`relative h-6 w-11 rounded-full shadow-inner transition-all duration-300 ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
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
