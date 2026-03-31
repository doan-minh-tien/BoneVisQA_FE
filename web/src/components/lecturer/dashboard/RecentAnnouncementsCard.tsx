import React from 'react';
import { Bell } from 'lucide-react';

interface Announcement {
  title: string;
  date: string;
  priority: string;
}

interface RecentAnnouncementsCardProps {
  announcements: Announcement[];
}

export default function RecentAnnouncementsCard({ announcements }: RecentAnnouncementsCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Recent Announcements</h2>
      <div className="space-y-3">
        {announcements.map((announcement, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Bell className={`w-4 h-4 mt-0.5 ${announcement.priority === 'high' ? 'text-destructive' : 'text-primary'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">{announcement.title}</p>
              <p className="text-xs text-muted-foreground">{announcement.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
