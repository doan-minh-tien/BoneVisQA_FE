'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import {
  Settings,
  Database,
  Cpu,
  Clock,
  Save,
  RotateCcw,
  Bell,
  Shield,
  FileText,
  CheckCircle,
} from 'lucide-react';

export default function CuratorSettingsPage() {
  const [saved, setSaved] = useState(false);

  // Indexing settings
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-3-large');
  const [autoIndex, setAutoIndex] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState(50);

  // Quality settings
  const [outdatedThreshold, setOutdatedThreshold] = useState(180);
  const [lowRelevanceThreshold, setLowRelevanceThreshold] = useState(0.4);
  const [autoFlagOutdated, setAutoFlagOutdated] = useState(true);

  // Notification settings
  const [notifyIndexComplete, setNotifyIndexComplete] = useState(true);
  const [notifyIndexFailed, setNotifyIndexFailed] = useState(true);
  const [notifyQualityAlert, setNotifyQualityAlert] = useState(true);
  const [notifyNewUpload, setNotifyNewUpload] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setChunkSize(512);
    setChunkOverlap(50);
    setEmbeddingModel('text-embedding-3-large');
    setAutoIndex(true);
    setMaxFileSize(50);
    setOutdatedThreshold(180);
    setLowRelevanceThreshold(0.4);
    setAutoFlagOutdated(true);
    setNotifyIndexComplete(true);
    setNotifyIndexFailed(true);
    setNotifyQualityAlert(true);
    setNotifyNewUpload(false);
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Configure curator preferences and pipeline settings" />

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Indexing Pipeline Settings */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Indexing Pipeline
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Chunk Size (tokens)</label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 256-1024</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Overlap (tokens)</label>
                <input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 10-20% of chunk size</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Embedding Model</label>
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="text-embedding-3-large">text-embedding-3-large (3072 dim)</option>
                <option value="text-embedding-3-small">text-embedding-3-small (1536 dim)</option>
                <option value="text-embedding-ada-002">text-embedding-ada-002 (1536 dim)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Max File Size (MB)</label>
              <input
                type="number"
                value={maxFileSize}
                onChange={(e) => setMaxFileSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-card-foreground">Auto-index on upload</p>
                <p className="text-xs text-muted-foreground">Automatically start indexing when a new document is uploaded</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoIndex(!autoIndex)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${autoIndex ? 'bg-success' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoIndex ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>
        </div>

        {/* Content Quality Settings */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Content Quality
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Outdated Threshold (days)</label>
                <input
                  type="number"
                  value={outdatedThreshold}
                  onChange={(e) => setOutdatedThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Flag documents older than this</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1.5">Low Relevance Threshold</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={lowRelevanceThreshold}
                  onChange={(e) => setLowRelevanceThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">Flag segments below this score (0-1)</p>
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-card-foreground">Auto-flag outdated documents</p>
                <p className="text-xs text-muted-foreground">Automatically create quality alerts for outdated content</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoFlagOutdated(!autoFlagOutdated)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${autoFlagOutdated ? 'bg-success' : 'bg-muted-foreground/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoFlagOutdated ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Indexing completed', desc: 'Notify when a document finishes indexing', value: notifyIndexComplete, setter: setNotifyIndexComplete },
              { label: 'Indexing failed', desc: 'Notify when indexing encounters an error', value: notifyIndexFailed, setter: setNotifyIndexFailed },
              { label: 'Quality alerts', desc: 'Notify when new content quality issues are detected', value: notifyQualityAlert, setter: setNotifyQualityAlert },
              { label: 'New uploads', desc: 'Notify when other users upload documents', value: notifyNewUpload, setter: setNotifyNewUpload },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => item.setter(!item.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${item.value ? 'bg-success' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Save / Reset */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
