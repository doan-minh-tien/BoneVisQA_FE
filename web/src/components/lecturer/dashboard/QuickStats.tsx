import React from 'react';
import { Calendar, MessageSquare, ClipboardList, TrendingUp } from 'lucide-react';

export default function QuickStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">12</p>
        <p className="text-sm text-muted-foreground">Sessions This Week</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
          <MessageSquare className="w-6 h-6 text-success" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">28</p>
        <p className="text-sm text-muted-foreground">Student Questions</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
          <ClipboardList className="w-6 h-6 text-warning" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">45</p>
        <p className="text-sm text-muted-foreground">Pending Gradings</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <TrendingUp className="w-6 h-6 text-accent" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">+8%</p>
        <p className="text-sm text-muted-foreground">Performance Growth</p>
      </div>
    </div>
  );
}
