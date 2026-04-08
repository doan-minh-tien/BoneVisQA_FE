'use client';

interface ExpertHeaderProps {
  title: string;
  subtitle?: string;
}

export default function ExpertHeader({ title, subtitle }: ExpertHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-color bg-background/95 backdrop-blur-sm">
      <div className="px-6 py-5">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}

