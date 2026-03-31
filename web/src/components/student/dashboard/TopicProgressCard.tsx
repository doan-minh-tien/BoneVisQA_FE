import React from 'react';

interface TopicProgress {
  name: string;
  progress: number;
  total: number;
  completed: number;
}

interface TopicProgressCardProps {
  topics: TopicProgress[];
}

export default function TopicProgressCard({ topics }: TopicProgressCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Progress by Topic</h2>
      <div className="space-y-4">
        {topics.map((topic) => (
          <div key={topic.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">{topic.name}</span>
              <span className="text-xs text-muted-foreground">
                {topic.completed}/{topic.total}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${topic.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
