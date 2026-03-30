import { TrendingUp, FileText, Award, Calendar, Clock } from 'lucide-react';

export default function QuickStats() {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-card-foreground">Platform Stats</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">Total Cases</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">1,245</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">Quizzes Created</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">328</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">AI Q&A Sessions</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">5,672</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">Avg. Response Time</span>
          </div>
          <span className="text-sm font-semibold text-card-foreground">1.2s</span>
        </div>
      </div>
    </div>
  );
}
