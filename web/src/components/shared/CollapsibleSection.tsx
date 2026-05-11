'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export default function CollapsibleSection({
  title,
  description,
  icon,
  defaultOpen = true,
  children,
  headerActions,
  className = '',
  titleClassName = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-3 text-left hover:bg-muted/30 transition-colors cursor-pointer flex-1"
        >
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h3 className={`text-lg font-bold text-foreground ${titleClassName}`}>{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ml-2 ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>
        {headerActions && (
          <div className="ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
