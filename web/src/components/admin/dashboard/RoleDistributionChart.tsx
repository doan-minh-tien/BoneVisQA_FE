import { ShieldCheck } from 'lucide-react';

interface RoleDistributionChartProps {
  isLoading: boolean;
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

export default function RoleDistributionChart({ isLoading, roleDistribution }: RoleDistributionChartProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-card-foreground">User Distribution by Role</h2>
      </div>
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {roleDistribution.map((item) => (
            <div key={item.role}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-card-foreground">{item.role}</span>
                <span className="text-sm text-muted-foreground">
                  {item.count.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-300 rounded-full`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
