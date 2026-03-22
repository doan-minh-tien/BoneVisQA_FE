'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import {
  Bell, Plus, Send, X, Users, Calendar, Edit, Trash2,
  CheckCircle, Clock, Pin, ChevronDown, ChevronRight,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetClasses: string[];
  createdAt: string;
  pinned: boolean;
  status: 'sent' | 'draft';
}

const initialAnnouncements: Announcement[] = [
  { id: '1', title: 'New Fracture Classification Cases Available', content: 'Three new fracture classification cases have been added to the case library. Please review Cases #15-#17 before next week\'s clinical rotation. Focus on AO/OTA classification for distal radius and tibial plateau fractures.', targetClasses: ['SE1801', 'SE1802', 'SE1803', 'SE1804'], createdAt: '2026-03-22 10:00', pinned: true, status: 'sent' },
  { id: '2', title: 'Quiz: Knee Pathology - Due Friday', content: 'A new quiz on Knee Pathology has been assigned. Please complete it by Friday 5:00 PM. The quiz covers Kellgren-Lawrence grading, meniscal tears, and ligament injuries. You have 2 attempts.', targetClasses: ['SE1803'], createdAt: '2026-03-20 14:30', pinned: false, status: 'sent' },
  { id: '3', title: 'Reminder: Clinical Rotation Preparation', content: 'Please ensure you have completed all assigned cases and quizzes before the upcoming clinical rotation starting next Monday. Check your assignment page for any pending tasks.', targetClasses: ['SE1801', 'SE1802'], createdAt: '2026-03-18 09:00', pinned: false, status: 'sent' },
  { id: '4', title: 'Spine Imaging Module Released', content: 'The new Spine Imaging module is now available with 5 comprehensive cases covering compression fractures, disc herniation, and spinal metastasis.', targetClasses: ['SE1801', 'SE1804'], createdAt: '2026-03-15 11:00', pinned: false, status: 'sent' },
  { id: '5', title: 'Draft: End of Semester Review', content: 'End of semester review schedule and topics to be covered...', targetClasses: [], createdAt: '2026-03-22 08:00', pinned: false, status: 'draft' },
];

const allClasses = ['SE1801', 'SE1802', 'SE1803', 'SE1804'];

export default function LecturerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newClasses, setNewClasses] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleClass = (cls: string) => {
    setNewClasses((prev) => prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]);
  };

  const handleSend = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const announcement: Announcement = {
      id: `a-${Date.now()}`, title: newTitle.trim(), content: newContent.trim(),
      targetClasses: newClasses.length > 0 ? newClasses : allClasses,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pinned: false, status: 'sent',
    };
    setAnnouncements((prev) => [announcement, ...prev]);
    setNewTitle(''); setNewContent(''); setNewClasses([]); setShowCreate(false);
  };

  const handleSaveDraft = () => {
    if (!newTitle.trim()) return;
    const draft: Announcement = {
      id: `a-${Date.now()}`, title: newTitle.trim(), content: newContent.trim(),
      targetClasses: newClasses, createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pinned: false, status: 'draft',
    };
    setAnnouncements((prev) => [draft, ...prev]);
    setNewTitle(''); setNewContent(''); setNewClasses([]); setShowCreate(false);
  };

  const handleDelete = (id: string) => setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  const handleTogglePin = (id: string) => setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a));

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="min-h-screen">
      <Header title="Announcements" subtitle={`${announcements.filter((a) => a.status === 'sent').length} sent, ${announcements.filter((a) => a.status === 'draft').length} drafts`} />
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium mb-6"><Plus className="w-4 h-4" />New Announcement</button>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="font-semibold text-card-foreground mb-4">New Announcement</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Title</label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Announcement title..." className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Content</label><textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Write your announcement..." rows={4} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" /></div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Target Classes</label>
                <div className="flex flex-wrap gap-2">
                  {allClasses.map((cls) => (
                    <button key={cls} onClick={() => toggleClass(cls)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${newClasses.includes(cls) ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border text-muted-foreground hover:bg-input'}`}>{cls}</button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{newClasses.length === 0 ? 'No class selected = send to all classes' : `${newClasses.length} class(es) selected`}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSend} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors"><Send className="w-4 h-4" />Send Now</button>
              <button onClick={handleSaveDraft} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">Save Draft</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-3">
          {sorted.map((a) => {
            const isExp = expandedId === a.id;
            return (
              <div key={a.id} className={`bg-card rounded-xl border overflow-hidden ${a.pinned ? 'border-primary/30' : 'border-border'} ${a.status === 'draft' ? 'opacity-70' : ''}`}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => setExpandedId(isExp ? null : a.id)} className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0">
                      {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {a.pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                          <p className="text-sm font-medium text-card-foreground">{a.title}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{a.createdAt}</span>
                          {a.targetClasses.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.targetClasses.join(', ')}</span>}
                          {a.status === 'draft' && <span className="px-2 py-0.5 bg-warning/10 text-warning rounded text-xs font-medium">Draft</span>}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleTogglePin(a.id)} title={a.pinned ? 'Unpin' : 'Pin'} className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${a.pinned ? 'bg-primary/10 text-primary' : 'hover:bg-input text-muted-foreground'}`}><Pin className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(a.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </div>

                  {isExp && (
                    <div className="mt-3 ml-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
