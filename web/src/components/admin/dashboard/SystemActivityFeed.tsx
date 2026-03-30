import { Activity, AlertCircle, Users, BookOpen, ShieldCheck } from 'lucide-react';

export const systemActivity = [
  { type: 'user', message: '12 new student registrations approved', time: '30 min ago' },
  { type: 'alert', message: 'RAG indexing pipeline completed successfully', time: '1 hour ago' },
  { type: 'course', message: 'New course "Advanced Radiology" created by Dr. Tran', time: '2 hours ago' },
  { type: 'system', message: 'System backup completed', time: '4 hours ago' },
  { type: 'alert', message: 'AI model updated to latest version', time: '6 hours ago' },
];

export default function SystemActivityFeed() {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-card-foreground">System Activity</h2>
      </div>
      <div className="space-y-3">
        {systemActivity.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              activity.type === 'alert'
                ? 'bg-warning/10 text-warning'
                : activity.type === 'system'
                ? 'bg-success/10 text-success'
                : activity.type === 'course'
                ? 'bg-accent/10 text-accent'
                : 'bg-primary/10 text-primary'
            }`}>
              {activity.type === 'alert' && <AlertCircle className="w-4 h-4" />}
              {activity.type === 'user' && <Users className="w-4 h-4" />}
              {activity.type === 'course' && <BookOpen className="w-4 h-4" />}
              {activity.type === 'system' && <ShieldCheck className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
