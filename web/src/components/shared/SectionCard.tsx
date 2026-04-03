import type { ReactNode } from 'react';

export function SectionCard({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`.trim()}>
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-card-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
