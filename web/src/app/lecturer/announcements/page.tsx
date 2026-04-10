'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { LecturerAnnouncementRow } from '@/components/lecturer/LecturerAnnouncementRow';
import { useToast } from '@/components/ui/toast';
import { Bell, Plus, Send, Loader2 } from 'lucide-react';
import {
  getLecturerClasses,
  getClassAnnouncements,
  createAnnouncement,
  isValidGuidString,
} from '@/lib/api/lecturer';
import type { ClassItem, Announcement } from '@/lib/api/types';

function LecturerAnnouncementsContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const classIdFromUrl = searchParams.get('classId');
  const openNewFromUrl = searchParams.get('new') === '1';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Filter
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    async function fetchAll() {
      try {
        const userId = localStorage.getItem('userId') || '';
        const classList = await getLecturerClasses(userId);
        setClasses(classList);

        // Fetch announcements for all classes in parallel
        const allAnnouncements = await Promise.all(
          classList.map((c) => getClassAnnouncements(c.id).catch(() => [] as Announcement[])),
        );
        // Flatten and deduplicate by id
        const flat = allAnnouncements.flat().filter(
          (a) => isValidGuidString(a.id) && isValidGuidString(a.classId),
        );
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

  // Deep link from class detail: ?classId=...&new=1
  useEffect(() => {
    if (loading || classes.length === 0 || !classIdFromUrl) return;
    const exists = classes.some((c) => c.id === classIdFromUrl);
    if (!exists) return;
    setFilterClass(classIdFromUrl);
    setSelectedClassId(classIdFromUrl);
    if (openNewFromUrl) setShowCreate(true);
  }, [loading, classes, classIdFromUrl, openNewFromUrl]);

  const handleSend = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedClassId) {
      setCreateError('Please fill in all fields and select a class.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const created = await createAnnouncement(selectedClassId, {
        title: newTitle.trim(),
        content: newContent.trim(),
        sendEmail,
      });
      setAnnouncements((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      setSendEmail(true);
      // Keep class selected when filtering one class (e.g. from class page)
      if (filterClass === 'all') {
        setSelectedClassId('');
      } else {
        setSelectedClassId(filterClass);
      }
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

  const subtitle =
    filterClass === 'all'
      ? `${filtered.length} total`
      : `${filtered.length} in this class · ${announcements.length} total`;

  return (
    <div className="min-h-screen">
      <Header title="Announcements" subtitle={subtitle} />

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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">Send email notification</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Students enrolled in this class will receive an email with the announcement.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                    sendEmail ? 'bg-success' : 'bg-muted-foreground/30'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      sendEmail ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
                  setSendEmail(true);
                  if (filterClass === 'all') setSelectedClassId('');
                  else setSelectedClassId(filterClass);
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
            {filtered.map((a) => (
              <LecturerAnnouncementRow
                key={a.id}
                announcement={a}
                showClassName={filterClass === 'all'}
                onUpdated={(updated) =>
                  setAnnouncements((prev) =>
                    prev.map((x) =>
                      x.id === updated.id
                        ? { ...x, ...updated, className: x.className || updated.className }
                        : x,
                    ),
                  )
                }
                onDeleted={(id) => setAnnouncements((prev) => prev.filter((x) => x.id !== id))}
                onError={(msg) => toast.error(msg)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementsFallback() {
  return (
    <div className="min-h-screen">
      <Header title="Announcements" subtitle="Loading…" />
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

export default function LecturerAnnouncementsPage() {
  return (
    <Suspense fallback={<AnnouncementsFallback />}>
      <LecturerAnnouncementsContent />
    </Suspense>
  );
}
