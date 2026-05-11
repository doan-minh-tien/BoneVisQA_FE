'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, RefreshCw, AlertTriangle, Info, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { logsApi, type LogEntry, type LogsStats } from '@/lib/api/logs';

const levelColors: Record<string, string> = {
  Info: 'bg-blue-100 text-blue-700 border-blue-200',
  Warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Error: 'bg-red-100 text-red-700 border-red-200',
  Success: 'bg-green-100 text-green-700 border-green-200',
};

const levelIcons: Record<string, React.ElementType> = {
  Info: Info,
  Warning: AlertTriangle,
  Error: AlertCircle,
  Success: CheckCircle,
};

type LogLevel = 'All' | 'Info' | 'Warning' | 'Error' | 'Success';
type LogCategory = 'All' | 'Auth' | 'System' | 'Database' | 'API' | 'Email';

export default function AdminLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('All');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory>('All');
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await logsApi.getLogs({
        search: search || undefined,
        level: levelFilter === 'All' ? undefined : levelFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        pageIndex,
        pageSize: 50,
      });

      if (data) {
        setLogs(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await logsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [pageIndex, levelFilter, categoryFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pageIndex === 1) {
        fetchLogs();
      } else {
        setPageIndex(1);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);

  const handleRefresh = () => {
    fetchLogs(true);
    fetchStats();
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Message', 'User', 'IP'],
      ...logs.map((log) => [log.timestamp, log.level, log.category, log.message, log.user || '', log.ip || '']),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header
        title={t('logs.title', 'System Logs')}
        subtitle={t('logs.subtitle', 'Monitor system activity and errors')}
      />

      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Logs</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{stats?.total ?? total}</p>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">Errors</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{stats?.errors ?? 0}</p>
          </div>
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="mt-1 text-2xl font-bold text-warning">{stats?.warnings ?? 0}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{stats?.today ?? 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-input pl-12 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
              className="h-11 rounded-xl border border-border bg-input px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Levels</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
              <option value="Success">Success</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as LogCategory)}
              className="h-11 rounded-xl border border-border bg-input px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Categories</option>
              <option value="Auth">Auth</option>
              <option value="System">System</option>
              <option value="Database">Database</option>
              <option value="API">API</option>
              <option value="Email">Email</option>
            </select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 text-left">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Level</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Message</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const Icon = levelIcons[log.level] || Info;
                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${levelColors[log.level] || ''}`}>
                            <Icon className="h-3 w-3" />
                            {log.level}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-card-foreground">{log.category}</td>
                        <td className="px-4 py-3 text-sm text-card-foreground">{log.message}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{log.user || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pageIndex - 1) * 50 + 1} to {Math.min(pageIndex * 50, total)} of {total} entries
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.max(1, p - 1))} disabled={pageIndex === 1}>
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {pageIndex} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))} disabled={pageIndex === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
