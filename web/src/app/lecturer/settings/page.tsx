'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Bell, User, Save, RotateCcw, CheckCircle, GraduationCap } from 'lucide-react';

export default function LecturerSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState('Prof. Lecturer');
  const [department, setDepartment] = useState('Orthopedics');
  const [notifyNewStudent, setNotifyNewStudent] = useState(true);
  const [notifyQuizComplete, setNotifyQuizComplete] = useState(true);
  const [notifyLowScore, setNotifyLowScore] = useState(true);
  const [notifyNewQuestion, setNotifyNewQuestion] = useState(false);
  const [lowScoreThreshold, setLowScoreThreshold] = useState(50);
  const [defaultQuizDuration, setDefaultQuizDuration] = useState(30);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your lecturer preferences" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Profile */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2"><User className="w-5 h-5 text-primary" />Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Display Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Department</label><input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
        </div>

        {/* Class Defaults */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />Class Defaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Default Quiz Duration (minutes)</label><input type="number" value={defaultQuizDuration} onChange={(e) => setDefaultQuizDuration(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-sm font-medium text-card-foreground mb-1.5">Low Score Alert Threshold (%)</label><input type="number" value={lowScoreThreshold} onChange={(e) => setLowScoreThreshold(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><p className="text-xs text-muted-foreground mt-1">Get notified when a student scores below this</p></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-5 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notifications</h3>
          <div className="space-y-4">
            {[
              { label: 'New student enrolled', desc: 'When a student is added to your class', value: notifyNewStudent, setter: setNotifyNewStudent },
              { label: 'Quiz completions', desc: 'When students complete assigned quizzes', value: notifyQuizComplete, setter: setNotifyQuizComplete },
              { label: 'Low score alerts', desc: `When a student scores below ${lowScoreThreshold}%`, value: notifyLowScore, setter: setNotifyLowScore },
              { label: 'New student questions', desc: 'When students ask questions in Q&A', value: notifyNewQuestion, setter: setNotifyNewQuestion },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <div><p className="text-sm font-medium text-card-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <button type="button" onClick={() => item.setter(!item.value)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${item.value ? 'bg-success' : 'bg-muted-foreground/30'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${item.value ? 'translate-x-6' : 'translate-x-1'}`} /></button>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => { setLowScoreThreshold(50); setDefaultQuizDuration(30); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-card-foreground hover:bg-input cursor-pointer transition-colors"><RotateCcw className="w-4 h-4" />Reset</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors">{saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}{saved ? 'Saved!' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}
