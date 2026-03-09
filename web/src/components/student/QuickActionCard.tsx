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
  iconColor = 'bg-primary/10 text-primary',
  badge,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="block bg-card rounded-xl p-5 border border-border hover:shadow-md hover:border-primary/30 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            {badge && (
              <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}
