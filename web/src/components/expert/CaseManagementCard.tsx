import { Edit, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CaseManagementCardProps {
  id: string;
  title: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  addedBy: string;
  addedDate: string;
  viewCount: number;
  usageCount: number;
}

const statusConfig = {
  draft: {
    color: 'bg-muted/50 text-muted-foreground',
    icon: Clock,
    label: 'Draft'
  },
  pending: {
    color: 'bg-warning/10 text-warning',
    icon: AlertCircle,
    label: 'Pending Review'
  },
  approved: {
    color: 'bg-success/10 text-success',
    icon: CheckCircle,
    label: 'Approved'
  },
  rejected: {
    color: 'bg-destructive/10 text-destructive',
    icon: AlertCircle,
    label: 'Rejected'
  }
};

const difficultyConfig = {
  basic: 'bg-success/10 text-success',
  intermediate: 'bg-warning/10 text-warning',
  advanced: 'bg-destructive/10 text-destructive',
};

export default function CaseManagementCard({
  id,
  title,
  boneLocation,
  lesionType,
  difficulty,
  status,
  addedBy,
  addedDate,
  viewCount,
  usageCount,
}: CaseManagementCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyConfig[difficulty]}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-2">{title}</h3>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {boneLocation}
        </span>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          {lesionType}
        </span>
      </div>

      {/* Meta Info */}
      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div>
          <p className="text-xs text-muted-foreground">Added by</p>
          <p className="text-sm font-medium text-card-foreground">{addedBy}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="text-sm font-medium text-card-foreground">{addedDate}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Views</p>
          <p className="text-sm font-medium text-card-foreground">{viewCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Usage</p>
          <p className="text-sm font-medium text-card-foreground">{usageCount} times</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/expert/cases/${id}`}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">View</span>
        </Link>
        <Link
          href={`/expert/cases/${id}/edit`}
          className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer"
        >
          <Edit className="w-4 h-4 text-muted-foreground" />
        </Link>
        <button className="px-3 py-2 border border-destructive/50 rounded-lg hover:bg-destructive/10 transition-colors duration-150 cursor-pointer">
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    </div>
  );
}
