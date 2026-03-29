'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Bell,
  Plus,
  Send,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  getLecturerClasses,
  getClassAnnouncements,
  createAnnouncement,
  type ClassItem,
  type Announcement,
} from '@/lib/api';

export default function LecturerAnnouncementsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Expand
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    async function fetchAll() {
      try {
        const token = localStorage.getItem('token') || '';
        const userId = localStorage.getItem('userId') || '';
        const classList = await getLecturerClasses(userId, token);
        setClasses(classList);

        // Fetch announcements for all classes in parallel
        const allAnnouncements = await Promise.all(
          classList.map((c) => getClassAnnouncements(c.id, token).catch(() => [] as Announcement[])),
        );
        // Flatten and deduplicate by id
        const flat = allAnnouncements.flat();
        const unique = Array.from(new Map(flat.map((a) => [a.id, a])).values());
        // Sort by createdAt desc
        unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnnouncements(unique);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const handleSend = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedClassId) {
      setCreateError('Please fill in all fields and select a class.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const token = localStorage.getItem('token') || '';
      const created = await createAnnouncement(
        selectedClassId,
        { title: newTitle.trim(), content: newContent.trim() },
        token,
      );
      setAnnouncements((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      setSelectedClassId('');
    } catch {
      setCreateError('Failed to send announcement. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filtered =
    filterClass === 'all'
      ? announcements
      : announcements.filter((a) => a.classId === filterClass);

  return (
    <div className="min-h-screen">
      <Header title="Announcements" subtitle={`${announcements.length} total`} />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterClass('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                filterClass === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterClass(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  filterClass === c.id
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {c.className}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="font-semibold text-card-foreground mb-4">New Announcement</h3>

            {createError && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">
                  Target Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className} — {c.semester}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">
                  Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSend}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {creating ? 'Sending...' : 'Send Now'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateError('');
                  setNewTitle('');
                  setNewContent('');
                  setSelectedClassId('');
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading announcements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-card-foreground mb-1">No announcements</h3>
            <p className="text-sm text-muted-foreground">
              {announcements.length === 0
                ? 'Create an announcement to notify your students.'
                : 'No announcements for this class.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const isExp = expandedId === a.id;
              return (
                <div
                  key={a.id}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => setExpandedId(isExp ? null : a.id)}
                        className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0"
                      >
                        {isExp ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground">{a.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {a.className && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {a.className}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {isExp && (
                      <div className="mt-3 ml-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {a.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
