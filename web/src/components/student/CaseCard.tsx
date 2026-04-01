import { BookOpen, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface CaseCardProps {
  id: string;
  title: string;
  thumbnail: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  duration?: string;
  progress?: number;
}

const difficultyConfig = {
  basic: {
    color: 'text-success bg-success/10',
    label: 'Basic'
  },
  intermediate: {
    color: 'text-warning bg-warning/10',
    label: 'Intermediate'
  },
  advanced: {
    color: 'text-destructive bg-destructive/10',
    label: 'Advanced'
  }
};

export default function CaseCard({
  id,
  title,
  boneLocation,
  lesionType,
  difficulty,
  duration = '15 min',
  progress = 0,
}: CaseCardProps) {
  const diffConfig = difficultyConfig[difficulty];

  return (
    <Link
      href={`/student/cases/${id}`}
      className="block bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg cursor-pointer transition-all duration-200 group"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          {/* Placeholder for X-ray image */}
          <BookOpen className="w-16 h-16 text-muted-foreground opacity-30" />
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${diffConfig.color}`}>
            {diffConfig.label}
          </span>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
            {boneLocation}
          </span>
          <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded">
            {lesionType}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          {progress > 0 && (
            <div className="flex items-center gap-1 text-accent">
              <TrendingUp className="w-4 h-4" />
              <span>{progress}% complete</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
