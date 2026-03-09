import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function QuickStatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  trend = 'neutral',
}: QuickStatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
      ? 'text-destructive'
      : 'text-muted-foreground';

  return (
    <div className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-card-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
