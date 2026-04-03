import type { ReactNode } from 'react';

export function ToolbarField({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      {label ? <p className="mb-1.5 text-sm font-medium text-card-foreground">{label}</p> : null}
      {children}
    </div>
  );
}
