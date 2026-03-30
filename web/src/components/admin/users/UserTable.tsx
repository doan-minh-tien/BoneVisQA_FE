import { Mail, Calendar, UserCheck, ShieldAlert } from "lucide-react";
import { User, statusStyle } from "./types";

export default function UserTable({
  users,
  onToggleStatus,
  onOpenAssignRole,
  onOpenRevokeRole,
}: {
  users: User[];
  onToggleStatus: (user: User) => void;
  onOpenAssignRole: (user: User) => void;
  onOpenRevokeRole: (user: User) => void;
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
                      <div className="flex items-center gap-3">
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
                        <div className="w-px h-6 bg-slate-200" />
                        <button
                          onClick={() => onOpenRevokeRole(user)}
                          className="flex items-center justify-center gap-2 p-2 rounded-lg text-rose-600 bg-rose-50 border border-rose-100/50 hover:bg-rose-100 hover:border-rose-200 transition-colors cursor-pointer group/revoke"
                          title="Revoke Roles"
                        >
                          <ShieldAlert className="w-4 h-4 group-hover/revoke:scale-110 transition-transform" />
                        </button>
                      </div>
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
