'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import {
  Tags,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  Hash,
} from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  topicId: string;
  usageCount: number;
}

const initialTopics: Topic[] = [
  { id: 't1', name: 'Fracture Classification', description: 'Classification systems for bone fractures', documentCount: 4, color: 'bg-primary' },
  { id: 't2', name: 'Degenerative Disease', description: 'Osteoarthritis and degenerative conditions', documentCount: 3, color: 'bg-accent' },
  { id: 't3', name: 'Bone Tumor', description: 'Bone tumors and neoplastic conditions', documentCount: 2, color: 'bg-destructive' },
  { id: 't4', name: 'Osteoporosis', description: 'Bone density and metabolic bone disease', documentCount: 3, color: 'bg-warning' },
  { id: 't5', name: 'Anatomy', description: 'Musculoskeletal anatomy references', documentCount: 2, color: 'bg-success' },
  { id: 't6', name: 'Spine', description: 'Spinal pathology and conditions', documentCount: 3, color: 'bg-secondary' },
  { id: 't7', name: 'Trauma', description: 'Acute trauma and dislocation cases', documentCount: 2, color: 'bg-primary' },
  { id: 't8', name: 'Pediatric', description: 'Pediatric musculoskeletal conditions', documentCount: 1, color: 'bg-accent' },
  { id: 't9', name: 'Post-Operative', description: 'Post-operative imaging and follow-up', documentCount: 1, color: 'bg-warning' },
  { id: 't10', name: 'Inflammatory Disease', description: 'Inflammatory arthritis conditions', documentCount: 1, color: 'bg-destructive' },
];

const initialTags: Tag[] = [
  { id: 'tg1', name: 'fracture', topicId: 't1', usageCount: 5 },
  { id: 'tg2', name: 'AO/OTA', topicId: 't1', usageCount: 2 },
  { id: 'tg3', name: 'classification', topicId: 't1', usageCount: 3 },
  { id: 'tg4', name: 'guidelines', topicId: 't1', usageCount: 2 },
  { id: 'tg5', name: 'Salter-Harris', topicId: 't8', usageCount: 1 },
  { id: 'tg6', name: 'osteoarthritis', topicId: 't2', usageCount: 3 },
  { id: 'tg7', name: 'imaging', topicId: 't2', usageCount: 4 },
  { id: 'tg8', name: 'differential', topicId: 't2', usageCount: 2 },
  { id: 'tg9', name: 'tumor', topicId: 't3', usageCount: 2 },
  { id: 'tg10', name: 'osteosarcoma', topicId: 't3', usageCount: 1 },
  { id: 'tg11', name: 'radiology', topicId: 't3', usageCount: 2 },
  { id: 'tg12', name: 'osteoporosis', topicId: 't4', usageCount: 2 },
  { id: 'tg13', name: 'DEXA', topicId: 't4', usageCount: 2 },
  { id: 'tg14', name: 'T-score', topicId: 't4', usageCount: 1 },
  { id: 'tg15', name: 'bone density', topicId: 't4', usageCount: 1 },
  { id: 'tg16', name: 'screening', topicId: 't4', usageCount: 1 },
  { id: 'tg17', name: 'knee', topicId: 't5', usageCount: 2 },
  { id: 'tg18', name: 'anatomy', topicId: 't5', usageCount: 2 },
  { id: 'tg19', name: 'atlas', topicId: 't5', usageCount: 1 },
  { id: 'tg20', name: 'spine', topicId: 't6', usageCount: 3 },
  { id: 'tg21', name: 'MRI', topicId: 't6', usageCount: 2 },
  { id: 'tg22', name: 'spinal cord', topicId: 't6', usageCount: 1 },
  { id: 'tg23', name: 'shoulder', topicId: 't7', usageCount: 1 },
  { id: 'tg24', name: 'dislocation', topicId: 't7', usageCount: 2 },
  { id: 'tg25', name: 'trauma', topicId: 't7', usageCount: 1 },
  { id: 'tg26', name: 'pediatric', topicId: 't8', usageCount: 1 },
  { id: 'tg27', name: 'growth plate', topicId: 't8', usageCount: 1 },
  { id: 'tg28', name: 'hip', topicId: 't9', usageCount: 1 },
  { id: 'tg29', name: 'post-op', topicId: 't9', usageCount: 1 },
  { id: 'tg30', name: 'rheumatoid', topicId: 't10', usageCount: 1 },
  { id: 'tg31', name: 'inflammatory', topicId: 't10', usageCount: 1 },
];

export default function CuratorTagsPage() {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [search, setSearch] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [addingTagTo, setAddingTagTo] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredTopics = useMemo(() => {
    if (!search) return topics;
    const q = search.toLowerCase();
    const matchingTagTopicIds = tags.filter((t) => t.name.toLowerCase().includes(q)).map((t) => t.topicId);
    return topics.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || matchingTagTopicIds.includes(t.id));
  }, [topics, tags, search]);

  const getTagsForTopic = (topicId: string) => tags.filter((t) => t.topicId === topicId).sort((a, b) => b.usageCount - a.usageCount);

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const colors = ['bg-primary', 'bg-accent', 'bg-warning', 'bg-success', 'bg-secondary', 'bg-destructive'];
    const newTopic: Topic = {
      id: `t-${Date.now()}`,
      name: newTopicName.trim(),
      description: newTopicDesc.trim(),
      documentCount: 0,
      color: colors[topics.length % colors.length],
    };
    setTopics((prev) => [...prev, newTopic]);
    setNewTopicName('');
    setNewTopicDesc('');
    setShowAddTopic(false);
  };

  const handleDeleteTopic = (id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    setTags((prev) => prev.filter((t) => t.topicId !== id));
  };

  const handleAddTag = (topicId: string) => {
    if (!newTagName.trim()) return;
    const newTag: Tag = {
      id: `tg-${Date.now()}`,
      name: newTagName.trim().toLowerCase(),
      topicId,
      usageCount: 0,
    };
    setTags((prev) => [...prev, newTag]);
    setNewTagName('');
    setAddingTagTo(null);
  };

  const handleDeleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRenameTopic = (id: string) => {
    if (!editName.trim()) return;
    setTopics((prev) => prev.map((t) => t.id === id ? { ...t, name: editName.trim() } : t));
    setEditingTopic(null);
    setEditName('');
  };

  const totalTags = tags.length;
  const totalTopics = topics.length;

  return (
    <div className="min-h-screen">
      <Header title="Tags & Topics" subtitle={`${totalTopics} topics, ${totalTags} tags`} />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setShowAddTopic(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Add Topic Form */}
        {showAddTopic && (
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <h3 className="font-semibold text-card-foreground mb-3">New Topic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g., Metabolic Disease"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Description</label>
                <input
                  type="text"
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddTopic} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">
                Create Topic
              </button>
              <button onClick={() => setShowAddTopic(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => {
            const topicTags = getTagsForTopic(topic.id);
            const isExpanded = expandedTopic === topic.id;

            return (
              <div key={topic.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Topic Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className={`w-3 h-3 rounded-full ${topic.color} shrink-0`} />
                    <div className="min-w-0">
                      {editingTopic === topic.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameTopic(topic.id)}
                            className="px-2 py-1 rounded border border-border bg-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button onClick={(e) => { e.stopPropagation(); handleRenameTopic(topic.id); }} className="text-xs text-primary hover:underline cursor-pointer">Save</button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingTopic(null); }} className="text-xs text-muted-foreground hover:underline cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-card-foreground">{topic.name}</p>
                          <p className="text-xs text-muted-foreground">{topic.description}</p>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      {topic.documentCount}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="w-3 h-3" />
                      {topicTags.length}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingTopic(topic.id); setEditName(topic.name); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-input cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {isExpanded && (
                  <div className="px-5 py-4 border-t border-border bg-input/10">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {topicTags.map((tag) => (
                        <span key={tag.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium group">
                          {tag.name}
                          <span className="text-primary/50">({tag.usageCount})</span>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {topicTags.length === 0 && (
                        <p className="text-xs text-muted-foreground">No tags yet</p>
                      )}
                    </div>

                    {addingTagTo === topic.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag(topic.id)}
                          placeholder="Tag name..."
                          className="w-40 px-2 py-1.5 rounded-lg border border-border bg-input text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          autoFocus
                        />
                        <button onClick={() => handleAddTag(topic.id)} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 cursor-pointer transition-colors">Add</button>
                        <button onClick={() => setAddingTagTo(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-input cursor-pointer transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTagTo(topic.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Add Tag
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-card-foreground">No topics found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
