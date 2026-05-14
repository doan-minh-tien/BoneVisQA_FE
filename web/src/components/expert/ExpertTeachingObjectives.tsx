'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Clock,
  XCircle,
  Edit3,
  Send,
  GraduationCap,
} from 'lucide-react';
import {
  fetchExpertClassObjectives,
  fetchAllExpertClassObjectives,
  suggestObjective,
  fetchMyPendingSuggestions,
  type ExpertTeachingObjectivesDto,
  type TeachingObjectiveSuggestionDto,
  type SuggestObjectiveRequestDto,
} from '@/lib/api/expert-teaching-objectives';

interface ExpertTeachingObjectivesProps {
  classId?: string;
  onError?: (error: string) => void;
}

export default function ExpertTeachingObjectives({ classId, onError }: ExpertTeachingObjectivesProps) {
  const [objectives, setObjectives] = useState<ExpertTeachingObjectivesDto | null>(null);
  const [allObjectives, setAllObjectives] = useState<ExpertTeachingObjectivesDto[]>([]);
  const [mySuggestions, setMySuggestions] = useState<TeachingObjectiveSuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'objectives' | 'suggestions'>('objectives');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Suggest form state
  const [suggestForm, setSuggestForm] = useState<SuggestObjectiveRequestDto>({
    classId: '',
    topic: '',
    objective: '',
    level: 'Basic',
  });

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (classId) {
        const objData = await fetchExpertClassObjectives(classId);
        setObjectives(objData);
        setSuggestForm((prev) => ({ ...prev, classId }));
      } else {
        const allData = await fetchAllExpertClassObjectives();
        setAllObjectives(allData);
      }
      const sugData = await fetchMyPendingSuggestions();
      setMySuggestions(sugData);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load teaching objectives');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (!suggestForm.topic.trim() || !suggestForm.objective.trim() || !suggestForm.classId) {
      onError?.('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await suggestObjective(suggestForm);
      setShowSuggestModal(false);
      setSuggestForm({ classId: suggestForm.classId, topic: '', objective: '', level: 'Basic' });
      await loadData();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Pending' };
      case 'Approved':
        return { icon: Check, color: 'text-success', bgColor: 'bg-success/10', label: 'Approved' };
      case 'Rejected':
        return { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Rejected' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted', label: status };
    }
  };

  const levelColors: Record<string, string> = {
    Basic: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // If no classId, show list of all classes
  if (!classId && allObjectives.length > 0) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-card-foreground">Teaching Objectives</h3>
              <p className="text-sm text-muted-foreground">
                {allObjectives.length} classes assigned
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>

        {expanded && (
          <div className="border-t border-border p-4 space-y-3">
            {allObjectives.map((obj) => (
              <div key={obj.classId} className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-card-foreground">{obj.className}</h4>
                  <span className="text-xs text-muted-foreground">
                    {obj.currentObjectives.length} objectives
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Lecturer: {obj.lecturerName}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    {obj.focusLevel || 'Basic'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {obj.semester}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const currentObj = objectives;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-card-foreground">Teaching Objectives</h3>
            <p className="text-sm text-muted-foreground">
              {currentObj?.currentObjectives.length ?? 0} objectives • {mySuggestions.filter(s => s.status === 'Pending').length} pending
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSuggestModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Suggest
          </button>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {expanded && currentObj && (
        <div className="border-t border-border">
          {/* Class Info */}
          <div className="p-4 bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-card-foreground">{currentObj.className}</h4>
                <p className="text-sm text-muted-foreground">
                  Lecturer: {currentObj.lecturerName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                  {currentObj.focusLevel || 'Basic'}
                </span>
                <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                  {currentObj.semester}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('objectives')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'objectives'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Current Objectives ({currentObj.currentObjectives.length})
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'suggestions'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Suggestions ({mySuggestions.length})
            </button>
          </div>

          <div className="p-4">
            {/* Objectives Tab */}
            {activeTab === 'objectives' && (
              <div className="space-y-3">
                {currentObj.currentObjectives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No teaching objectives defined yet</p>
                  </div>
                ) : (
                  currentObj.currentObjectives.map((obj, idx) => (
                    <div
                      key={obj.id}
                      className="p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {idx + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-card-foreground">{obj.topic}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${levelColors[obj.level] || ''}`}>
                              {obj.level}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{obj.objective}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-3">
                {mySuggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>You haven't suggested any objectives yet</p>
                    <button
                      onClick={() => setShowSuggestModal(true)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Suggest your first objective
                    </button>
                  </div>
                ) : (
                  mySuggestions.map((suggestion) => {
                    const statusConfig = getStatusBadge(suggestion.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div key={suggestion.id} className="p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-card-foreground">{suggestion.topic}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${levelColors[suggestion.level] || ''}`}>
                                {suggestion.level}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              For: {suggestion.className || 'Class'}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bgColor}`}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                            <span className={`text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.objective}</p>
                        {suggestion.status === 'Rejected' && suggestion.rejectionReason && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                            Rejection reason: {suggestion.rejectionReason}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted: {new Date(suggestion.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggest Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <Target className="w-5 h-5" />
                Suggest Teaching Objective
              </h3>
              <button
                onClick={() => setShowSuggestModal(false)}
                className="p-1 hover:bg-muted rounded-md"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Topic *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bone Fractures, Joint Pathology"
                  value={suggestForm.topic}
                  onChange={(e) => setSuggestForm({ ...suggestForm, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Objective *
                </label>
                <textarea
                  placeholder="Describe the learning objective..."
                  value={suggestForm.objective}
                  onChange={(e) => setSuggestForm({ ...suggestForm, objective: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Difficulty Level
                </label>
                <select
                  value={suggestForm.level}
                  onChange={(e) => setSuggestForm({ ...suggestForm, level: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Basic">Basic - Foundational knowledge</option>
                  <option value="Intermediate">Intermediate - Applied understanding</option>
                  <option value="Advanced">Advanced - Expert-level proficiency</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowSuggestModal(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuggest}
                disabled={submitting || !suggestForm.topic.trim() || !suggestForm.objective.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
