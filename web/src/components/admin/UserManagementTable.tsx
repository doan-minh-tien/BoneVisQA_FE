import { Calendar, Pencil, School, Trash2, UserCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type UserRole = 'Student' | 'Lecturer' | 'Expert' | 'Admin';
export type DisplayRole = UserRole | 'Pending' | 'Unassigned';
export type UserStatus = 'Active' | 'Inactive';

export type UiUser = {
  id: string;
  name: string;
  email: string;
  role: DisplayRole;
  status: UserStatus;
  joinedAt: string;
  className?: string;
  classList?: Array<{ id: string; className: string; relationType: string }>;
};

function roleBadgeClass(role: DisplayRole): string {
  switch (role) {
    case 'Student':
      return 'bg-blue-500/15 text-blue-700 border-blue-500/25';
    case 'Lecturer':
      return 'bg-violet-500/15 text-violet-800 border-violet-500/25';
    case 'Expert':
      return 'bg-fuchsia-500/15 text-fuchsia-800 border-fuchsia-500/25';
    case 'Admin':
      return 'bg-slate-500/15 text-slate-800 border-slate-500/30';
    case 'Pending':
      return 'bg-amber-500/15 text-amber-900 border-amber-500/30';
    case 'Unassigned':
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function roleShortLabel(role: DisplayRole): string {
  switch (role) {
    case 'Lecturer':
      return 'Lect.';
    case 'Unassigned':
      return 'None';
    default:
      return role;
  }
}

const statusCompact: Record<UserStatus, { dot: string; label: string; wrap: string }> = {
  Active: {
    dot: 'bg-success',
    label: 'Active',
    wrap: 'border-success/35 bg-success/10 text-success',
  },
  Inactive: {
    dot: 'bg-muted-foreground',
    label: 'Off',
    wrap: 'border-border bg-muted text-muted-foreground',
  },
};

function needsRoleAssignment(role: DisplayRole): boolean {
  return role === 'Unassigned' || role === 'Pending';
}

function canAssignToClass(role: DisplayRole): boolean {
  return role === 'Student' || role === 'Lecturer' || role === 'Expert';
}

function UserRowCard({
  user,
  hideRoleButton,
  onToggleStatus,
  onOpenAssignRole,
  onEdit,
  onDelete,
}: {
  user: UiUser;
  hideRoleButton?: boolean;
  onToggleStatus: (user: UiUser) => void;
  onOpenAssignRole: (user: UiUser, mode: 'assign' | 'change') => void;
  onEdit: (user: UiUser) => void;
  onDelete: (user: UiUser) => void;
}) {
  const pendingQueue = needsRoleAssignment(user.role);
  const isActive = user.status === 'Active';
  const st = statusCompact[user.status];

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-bold text-primary">
            {user.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${roleBadgeClass(user.role)}`}
                title={user.role}
              >
                {roleShortLabel(user.role)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${st.wrap}`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Assigned class</p>
        <div className="mt-1 flex flex-col gap-1">
          {user.classList && user.classList.length > 0 ? (
            <>
              <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <BookOpen className="h-3 w-3 shrink-0" />
                <span className="truncate">{user.classList[0].className}</span>
              </span>
              {user.classList.length > 1 ? (
                <span className="text-[10px] text-muted-foreground">+{user.classList.length - 1} more</span>
              ) : null}
            </>
          ) : (
            <span className="text-xs italic text-muted-foreground/90">Unassigned</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {user.joinedAt}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        {!hideRoleButton ? (
          <button
            type="button"
            onClick={() => onOpenAssignRole(user, pendingQueue ? 'assign' : 'change')}
            className="inline-flex min-w-[7.5rem] flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 py-2 text-[11px] font-bold shadow-sm sm:flex-none sm:px-3"
          >
            {pendingQueue ? <UserCheck className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {pendingQueue ? 'Assign role' : 'Role'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="inline-flex min-w-[7.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-2 text-[11px] font-bold text-muted-foreground sm:flex-none sm:px-3"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(user)}
          className="inline-flex min-w-[7.5rem] flex-1 items-center justify-center gap-1 rounded-lg border border-destructive/30 px-2 py-2 text-[11px] font-bold text-destructive sm:flex-none sm:px-3"
        >
          <Trash2 className="h-3.5 w-3.5" /> Del
        </button>
        <button
          type="button"
          onClick={() => onToggleStatus(user)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-[11px] font-bold"
          title={isActive ? 'Deactivate' : 'Activate'}
        >
          <span className={isActive ? 'text-success' : 'text-muted-foreground'}>{st.label}</span>
          <span className={`relative inline-block h-5 w-9 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`}>
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${
                isActive ? 'left-4' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>
    </article>
  );
}

export function UserManagementTable({
  users,
  onToggleStatus,
  onOpenAssignRole,
  onEdit,
  onDelete,
  hideRoleButton,
}: {
  users: UiUser[];
  onToggleStatus: (user: UiUser) => void;
  onOpenAssignRole: (user: UiUser, mode: 'assign' | 'change') => void;
  onEdit: (user: UiUser) => void;
  onDelete: (user: UiUser) => void;
  hideRoleButton?: boolean;
}) {
  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {users.map((user) => (
          <UserRowCard
            key={user.id}
            user={user}
            hideRoleButton={hideRoleButton}
            onToggleStatus={onToggleStatus}
            onOpenAssignRole={onOpenAssignRole}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden md:block md:overflow-hidden">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="w-[28%] px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:px-4">
                User
              </th>
              <th className="w-[26%] px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:px-3">
                Assigned class
              </th>
              <th className="w-[11%] px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="w-[12%] px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Joined
              </th>
              <th className="w-[23%] px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:px-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const pendingQueue = needsRoleAssignment(user.role);
              const isActive = user.status === 'Active';
              const st = statusCompact[user.status];
              return (
                <tr key={user.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-3 align-top lg:px-4">
                    <div className="flex min-w-0 gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-bold text-primary">
                        {user.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top lg:px-3">
                    <div className="min-w-0 space-y-1">
                      {user.classList && user.classList.length > 0 ? (
                        <>
                          <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            <BookOpen className="h-3 w-3 shrink-0 opacity-90" />
                            <span className="truncate">{user.classList[0].className}</span>
                          </span>
                          {user.classList.length > 1 ? (
                            <p className="text-[10px] text-muted-foreground">
                              +{user.classList.length - 1} more
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/90">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${st.wrap}`}
                    >
                      <span className={`h-1 w-1 shrink-0 rounded-full ${st.dot}`} />
                      <span className="truncate">{st.label}</span>
                    </span>
                    {user.role === 'Pending' && user.status === 'Inactive' ? (
                      <p className="mt-1 text-[9px] leading-tight text-primary">Awaiting role</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-3 align-top">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="truncate">{user.joinedAt}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 align-top lg:px-4">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {!hideRoleButton ? (
                        <button
                          type="button"
                          onClick={() => onOpenAssignRole(user, pendingQueue ? 'assign' : 'change')}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-bold shadow-sm hover:bg-muted"
                          title={pendingQueue ? 'Assign role' : 'Change role'}
                        >
                          {pendingQueue ? <UserCheck className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                          <span className="hidden xl:inline">{pendingQueue ? 'Role' : 'Change'}</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/25 px-2 py-1 text-[10px] font-bold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(user)}
                        className="inline-flex items-center gap-1 pl-1"
                        title={isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        <span
                          className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? 'bg-success' : 'bg-muted'}`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${
                              isActive ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
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
    </>
  );
}
