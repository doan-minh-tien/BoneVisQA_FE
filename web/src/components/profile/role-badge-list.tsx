'use client';

/**
 * High-contrast role chips (avoids dark-on-dark from theme `secondary` + `primary`).
 */
export function RoleBadgeList({
  roles,
  emptyLabel = '—',
}: {
  roles: string[];
  emptyLabel?: string;
}) {
  if (!roles.length) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }
  return (
    <div className="flex min-h-[46px] flex-wrap gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5">
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
        >
          {role}
        </span>
      ))}
    </div>
  );
}
