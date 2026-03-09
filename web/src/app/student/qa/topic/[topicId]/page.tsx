'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, BookOpen } from 'lucide-react';

const topicLabels: Record<string, string> = {
  shoulder: 'Shoulder',
  elbow: 'Elbow',
  wrist: 'Wrist',
  hand: 'Hand & Fingers',
  hip: 'Hip',
  knee: 'Knee',
  ankle: 'Ankle',
  foot: 'Foot & Toes',
  'cervical-spine': 'Cervical Spine',
  'thoracic-spine': 'Thoracic Spine',
  'lumbar-spine': 'Lumbar Spine',
  pelvis: 'Pelvis',
  skull: 'Skull & Facial Bones',
  ribs: 'Ribs & Sternum',
  'long-bones': 'Long Bone Fractures',
  'bone-tumors': 'Bone Tumors',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: { title: string; source: string }[];
  timestamp: Date;
}

// Mock AI response
function getMockResponse(topic: string, question: string): { content: string; references: { title: string; source: string }[] } {
  return {
    content: `Based on the medical knowledge base for **${topicLabels[topic] || topic}**, here is my analysis:\n\n**Key Points:**\n- This is a common area of inquiry in musculoskeletal radiology\n- The ${topicLabels[topic] || topic} region requires careful evaluation of bone alignment, joint space, and soft tissue\n- Common pathologies include fractures, degenerative changes, and inflammatory conditions\n\n**Regarding your question:** "${question}"\n\nThe differential diagnosis should consider the patient's age, mechanism of injury, and clinical presentation. Further imaging may be needed for definitive diagnosis.\n\n**Recommended focus areas:**\n1. Bone cortex integrity\n2. Joint space width\n3. Soft tissue swelling\n4. Alignment and positioning`,
    references: [
      { title: 'Musculoskeletal Imaging Fundamentals', source: 'Chapter 5 - Regional Anatomy' },
      { title: 'Orthopedic Radiology Guidelines', source: 'Section 3.2 - Diagnostic Criteria' },
    ],
  };
}

export default function TopicChatPage() {
  const params = useParams();
  const topicId = params.topicId as string;
  const topicLabel = topicLabels[topicId] || topicId;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello! I'm your AI assistant for **${topicLabel}**. I can answer questions about anatomy, common pathologies, imaging findings, and differential diagnoses related to this region.\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getMockResponse(topicId, trimmed);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        references: response.references,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/student/qa/topic"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">{topicLabel}</h1>
            <p className="text-xs text-muted-foreground">AI Q&A - Topic mode (RAG)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Bot className="w-3.5 h-3.5" />
          RAG Chatbot
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-md'
                    : 'bg-card border border-border text-card-foreground rounded-tl-md'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* References */}
                {msg.references && msg.references.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.references.map((ref, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{ref.title} - <span className="italic">{ref.source}</span></span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing with knowledge base...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${topicLabel}...`}
            disabled={isLoading}
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
