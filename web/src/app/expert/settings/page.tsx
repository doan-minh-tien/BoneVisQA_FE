'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Bell, Shield, Save, RotateCcw, CheckCircle, User } from 'lucide-react';

export default function ExpertSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [notifyNewQA, setNotifyNewQA] = useState(true);
  const [notifyFlagged, setNotifyFlagged] = useState(true);
  const [notifyQuizComplete, setNotifyQuizComplete] = useState(false);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(90);
  const [displayName, setDisplayName] = useState('Dr. Expert');
  const [specialty, setSpecialty] = useState('Musculoskeletal Radiology');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your expert preferences" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Profile */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2"><User className="w-5 h-5 text-primary" />Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Display Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Specialty</label><input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
        </div>

        {/* Review Settings */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Review Settings</h3>
          <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Auto-approve accuracy threshold (%)</label><input type="number" value={autoApproveThreshold} onChange={(e) => setAutoApproveThreshold(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><p className="text-xs text-muted-foreground mt-1">AI answers with accuracy above this will be auto-approved</p></div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notifications</h3>
          <div className="space-y-4">
            {[
              { label: 'New Q&A for review', desc: 'When students ask new questions', value: notifyNewQA, setter: setNotifyNewQA },
              { label: 'Flagged content', desc: 'When content is flagged for expert review', value: notifyFlagged, setter: setNotifyFlagged },
              { label: 'Quiz completions', desc: 'When students complete your quizzes', value: notifyQuizComplete, setter: setNotifyQuizComplete },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <div><p className="text-sm font-medium text-card-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <button type="button" onClick={() => item.setter(!item.value)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${item.value ? 'bg-success' : 'bg-muted-foreground/30'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${item.value ? 'translate-x-6' : 'translate-x-1'}`} /></button>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => { setAutoApproveThreshold(90); setNotifyNewQA(true); setNotifyFlagged(true); setNotifyQuizComplete(false); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"><RotateCcw className="w-4 h-4" />Reset</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">{saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}{saved ? 'Saved!' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}
