import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  iconColor?: string;
  badge?: string;
}

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  iconColor = 'bg-primary/15 text-primary',
  badge,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-105 ${iconColor}`}
        >
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-headline text-base font-bold tracking-tight text-slate-900 transition-colors group-hover:text-primary">
              {title}
            </h3>
            {badge ? (
              <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
