'use client';

import { Bell, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [fullName, setFullName] = useState('Dr. Sarah Nguyen');
  const [roleLabel, setRoleLabel] = useState('Senior Lecturer');

  useEffect(() => {
    const storedName = localStorage.getItem('fullName');
    const activeRole = localStorage.getItem('activeRole');
    if (storedName) setFullName(storedName);
    if (activeRole) {
      const normalized = activeRole.toLowerCase();
      const labelMap: Record<string, string> = {
        admin: 'System Administrator',
        lecturer: 'Senior Lecturer',
        expert: 'Clinical Expert',
        student: 'Medical Student',
      };
      setRoleLabel(labelMap[normalized] ?? 'Radiology Staff');
    }
  }, []);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [fullName]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-color bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="relative hidden w-full max-w-2xl md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search studies, cases, lectures, or AI findings..."
            className="h-11 w-full rounded-xl border border-border-color bg-surface pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border-color bg-surface text-text-muted hover:text-text-main">
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-cyan-accent shadow-[0_0_8px_rgba(0,229,255,0.8)]"></span>
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-border-color bg-surface px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initials || 'BV'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-main">{fullName}</p>
              <p className="truncate text-xs text-text-muted">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text-main">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="px-6 pb-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="h-11 w-full rounded-xl border border-border-color bg-surface pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-accent/70"
          />
        </div>
      </div>
    </header>
  );
}
