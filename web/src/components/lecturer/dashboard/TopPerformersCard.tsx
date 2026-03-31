import React from 'react';
import { Award } from 'lucide-react';
import StudentPerformanceCard from '@/components/lecturer/StudentPerformanceCard';

interface TopPerformer {
  studentName: string;
  studentId: string;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  completedCases: number;
  totalCases: number;
  lastActivity: string;
  status: 'excellent' | 'good' | 'needs-attention';
}

interface TopPerformersCardProps {
  performers: TopPerformer[];
}

export default function TopPerformersCard({ performers }: TopPerformersCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">Top Performers</h2>
        <Award className="w-5 h-5 text-warning" />
      </div>
      <div className="space-y-3">
        {performers.map((student, idx) => (
          <StudentPerformanceCard key={idx} {...student} />
        ))}
      </div>
    </div>
  );
}
