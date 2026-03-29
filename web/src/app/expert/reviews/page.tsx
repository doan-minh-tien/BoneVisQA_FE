'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import {
  MessageSquareText, Search, CheckCircle, Clock, XCircle, Eye, Edit, Star, Send,
  ChevronDown, ChevronRight, User, Calendar, Filter,
} from 'lucide-react';

type ReviewStatus = 'pending' | 'approved' | 'edited' | 'rejected';

interface QAItem {
  id: string;
  studentName: string;
  caseTitle: string;
  question: string;
  aiAnswer: string;
  status: ReviewStatus;
  askedAt: string;
  accuracy: number | null;
  expertNote: string;
}

const initialItems: QAItem[] = [
  { id: '1', studentName: 'Nguyen Van A', caseTitle: 'Distal Radius Fracture', question: 'What is the difference between a Colles fracture and a Smith fracture?', aiAnswer: "A Colles fracture involves dorsal displacement of the distal radius fragment (fall on outstretched hand), while a Smith fracture involves volar displacement (reverse Colles, fall on back of hand). Both are extra-articular distal radius fractures but with opposite displacement directions.", status: 'approved', askedAt: '2026-03-22 09:30', accuracy: 95, expertNote: 'Accurate and well-explained.' },
  { id: '2', studentName: 'Tran Thi B', caseTitle: 'Osteoarthritis of the Knee', question: 'How do you differentiate OA from RA on X-ray?', aiAnswer: "OA shows asymmetric joint space narrowing, osteophytes, subchondral sclerosis, and subchondral cysts. RA shows symmetric joint space narrowing, periarticular osteopenia, marginal erosions, and soft tissue swelling without osteophytes.", status: 'pending', askedAt: '2026-03-22 10:15', accuracy: null, expertNote: '' },
  { id: '3', studentName: 'Le Van C', caseTitle: 'Osteosarcoma of the Femur', question: 'What are the classic radiographic features of osteosarcoma?', aiAnswer: "Classic features include: aggressive periosteal reaction (sunburst pattern, Codman triangle), mixed lytic-scite lesion, soft tissue mass, and typically located at the metaphysis of long bones in adolescents.", status: 'edited', askedAt: '2026-03-21 14:20', accuracy: 80, expertNote: 'Good but should mention that "sclerotic" not "scite" and add that distal femur is the most common location.' },
  { id: '4', studentName: 'Pham Thi D', caseTitle: 'Shoulder Dislocation', question: 'What associated injuries should be checked after anterior shoulder dislocation?', aiAnswer: "Check for: 1) Hill-Sachs lesion (compression fracture of humeral head), 2) Bankart lesion (labral tear), 3) Greater tuberosity fracture, 4) Axillary nerve injury (check deltoid sensation), 5) Rotator cuff tear in patients >40.", status: 'pending', askedAt: '2026-03-22 11:00', accuracy: null, expertNote: '' },
  { id: '5', studentName: 'Hoang Van E', caseTitle: 'Clavicle Fracture', question: 'When is surgical fixation indicated for clavicle fractures?', aiAnswer: "Surgical indications: >2cm shortening, comminuted fracture with displacement, open fracture, neurovascular compromise, skin tenting, floating shoulder, and polytrauma patients.", status: 'rejected', askedAt: '2026-03-20 16:45', accuracy: 40, expertNote: 'Incomplete answer. Missing that >100% displacement is also an indication. The shortening threshold varies (some use 1.5cm). Also should mention that non-union risk increases with displacement.' },
  { id: '6', studentName: 'Vo Thi F', caseTitle: 'Tibial Plateau Fracture', question: 'Explain the Schatzker classification system.', aiAnswer: "Schatzker classification: Type I - lateral split, Type II - lateral split-depression, Type III - lateral pure depression, Type IV - medial plateau, Type V - bicondylar, Type VI - plateau with metadiaphyseal dissociation.", status: 'pending', askedAt: '2026-03-22 08:50', accuracy: null, expertNote: '' },
];

const statusConfig: Record<ReviewStatus, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Approved' },
  edited: { icon: Edit, color: 'text-primary', bg: 'bg-primary/10', label: 'Edited' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
};

export default function ExpertReviewsPage() {
  const [items, setItems] = useState<QAItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'All'>('All');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [ratingItem, setRatingItem] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const match = i.studentName.toLowerCase().includes(q) || i.caseTitle.toLowerCase().includes(q) || i.question.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || i.status === filterStatus;
      return match && matchStatus;
    });
  }, [items, search, filterStatus]);

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  const handleApprove = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'approved' as ReviewStatus, accuracy: i.accuracy ?? 90 } : i));
  };

  const handleReject = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'rejected' as ReviewStatus } : i));
  };

  const handleSaveNote = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, expertNote: noteText, status: 'edited' as ReviewStatus } : i));
    setEditingNote(null);
    setNoteText('');
  };

  const handleSetAccuracy = (id: string, rating: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, accuracy: rating * 20 } : i));
    setRatingItem(null);
  };

  return (
    <div className="min-h-screen">
      <Header title="Q&A Reviews" subtitle={`${pendingCount} pending reviews`} />
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by student, case, or question..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            {(['All', 'pending', 'approved', 'edited', 'rejected'] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${filterStatus === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-input'}`}>
                {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} {s === 'pending' && `(${pendingCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Q&A List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center"><MessageSquareText className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-lg font-medium text-card-foreground">No Q&A items found</p></div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const st = statusConfig[item.status];
                const StIcon = st.icon;
                const isExp = expandedItem === item.id;
                return (
                  <div key={item.id} className="px-5 py-4 hover:bg-input/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => setExpandedItem(isExp ? null : item.id)} className="flex items-start gap-2 text-left cursor-pointer flex-1 min-w-0">
                        {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground">{item.question}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.studentName}</span>
                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded font-medium">{item.caseTitle}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.askedAt}</span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.accuracy !== null && <span className={`text-xs font-medium ${item.accuracy >= 80 ? 'text-success' : item.accuracy >= 50 ? 'text-warning' : 'text-destructive'}`}>{item.accuracy}%</span>}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${st.bg} ${st.color}`}><StIcon className="w-3.5 h-3.5" />{st.label}</span>
                      </div>
                    </div>

                    {isExp && (
                      <div className="mt-4 ml-6 space-y-4">
                        {/* AI Answer */}
                        <div className="p-4 rounded-lg bg-input/30 border border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">AI-Generated Answer:</p>
                          <p className="text-sm text-card-foreground leading-relaxed">{item.aiAnswer}</p>
                        </div>

                        {/* Expert Note */}
                        {item.expertNote && (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-2">Expert Note:</p>
                            <p className="text-sm text-card-foreground leading-relaxed">{item.expertNote}</p>
                          </div>
                        )}

                        {/* Edit Note */}
                        {editingNote === item.id && (
                          <div>
                            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add clinical note or edit the answer..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleSaveNote(item.id)} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 cursor-pointer transition-colors">Save Note</button>
                              <button onClick={() => setEditingNote(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Accuracy Rating */}
                        {ratingItem === item.id && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Accuracy:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => handleSetAccuracy(item.id, star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="cursor-pointer p-0.5">
                                <Star className={`w-5 h-5 transition-colors ${star <= (hoverRating || (item.accuracy ? item.accuracy / 20 : 0)) ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && <button onClick={() => handleApprove(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 cursor-pointer transition-colors"><CheckCircle className="w-3.5 h-3.5" />Approve</button>}
                          <button onClick={() => { setEditingNote(item.id); setNoteText(item.expertNote); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 cursor-pointer transition-colors"><Edit className="w-3.5 h-3.5" />Edit/Add Note</button>
                          <button onClick={() => setRatingItem(ratingItem === item.id ? null : item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 cursor-pointer transition-colors"><Star className="w-3.5 h-3.5" />Rate</button>
                          {item.status === 'pending' && <button onClick={() => handleReject(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 cursor-pointer transition-colors"><XCircle className="w-3.5 h-3.5" />Reject</button>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
