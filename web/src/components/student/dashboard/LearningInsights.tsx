import React from 'react';
import { TrendingUp, Clock, Award, Target } from 'lucide-react';

export default function LearningInsights() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">+15%</p>
        <p className="text-sm text-muted-foreground">Accuracy This Week</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <Clock className="w-6 h-6 text-accent" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">4.5h</p>
        <p className="text-sm text-muted-foreground">Study Time This Week</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
          <Award className="w-6 h-6 text-warning" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">12</p>
        <p className="text-sm text-muted-foreground">Badges Earned</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border text-center">
        <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
          <Target className="w-6 h-6 text-success" />
        </div>
        <p className="text-2xl font-bold text-card-foreground">87%</p>
        <p className="text-sm text-muted-foreground">Goal Achievement</p>
      </div>
    </div>
  );
}
