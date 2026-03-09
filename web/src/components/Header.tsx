'use client';

import { Bell, Search, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: Title */}
      <div>
        <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 h-9 pl-10 pr-4 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors duration-150">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        {/* Mobile Menu */}
        <button className="w-9 h-9 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer transition-colors duration-150 md:hidden">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
