import { Eye, Edit, Flag, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface DocumentCardProps {
  id: string;
  title: string;
  topic: string;
  tags: string[];
  status: 'active' | 'outdated' | 'draft';
  version: string;
  uploadedAt: string;
  retrievalCount: number;
  lastIndexed: string;
}

const statusConfig = {
  active: {
    color: 'bg-success/10 text-success',
    icon: CheckCircle,
    label: 'Active',
  },
  outdated: {
    color: 'bg-warning/10 text-warning',
    icon: AlertTriangle,
    label: 'Outdated',
  },
  draft: {
    color: 'bg-muted/50 text-muted-foreground',
    icon: Clock,
    label: 'Draft',
  },
};

export default function DocumentCard({
  id,
  title,
  topic,
  tags,
  status,
  version,
  uploadedAt,
  retrievalCount,
  lastIndexed,
}: DocumentCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
              v{version}
            </span>
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-2">{title}</h3>
        </div>
      </div>

      {/* Topic & Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded">
          {topic}
        </span>
        {tags.slice(0, 2).map((tag) => (
          <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
            {tag}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
            +{tags.length - 2}
          </span>
        )}
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Uploaded</p>
          <p className="text-sm font-medium text-card-foreground">{uploadedAt}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last Indexed</p>
          <p className="text-sm font-medium text-card-foreground">{lastIndexed}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Retrievals</p>
          <p className="text-sm font-medium text-card-foreground">{retrievalCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Version</p>
          <p className="text-sm font-medium text-card-foreground">{version}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/curator/documents/${id}`}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-150 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">View</span>
        </Link>
        <Link
          href={`/curator/documents/${id}/edit`}
          className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer"
        >
          <Edit className="w-4 h-4 text-muted-foreground" />
        </Link>
        <button className="px-3 py-2 border border-warning/50 rounded-lg hover:bg-warning/10 transition-colors duration-150 cursor-pointer">
          <Flag className="w-4 h-4 text-warning" />
        </button>
      </div>
    </div>
  );
}
