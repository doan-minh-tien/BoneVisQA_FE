'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, BookOpen, Upload, X, ImageIcon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  references?: { title: string; source: string }[];
  timestamp: Date;
}

export default function ImageChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! Upload an **X-ray, CT, or MRI** image of a bone/joint, and I\'ll help you analyze it.\n\nYou can upload your image using the button below, then ask questions about what you see.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [imageSubmitted, setImageSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/dicom'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP, or DICOM).');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && !uploadedImage) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed || 'Please analyze this image.',
      image: uploadedImage || undefined,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    if (uploadedImage) {
      setImageSubmitted(true);
      removeImage();
    }

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const isImageAnalysis = userMsg.image;
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isImageAnalysis
          ? `I've analyzed the uploaded image. Here are my findings:\n\n**Initial Assessment:**\n- Image type: Appears to be a standard radiograph\n- Region: Musculoskeletal imaging\n- Quality: Adequate for interpretation\n\n**Key Findings:**\n1. Bone alignment and cortical integrity should be evaluated systematically\n2. Joint spaces appear to require close inspection\n3. Soft tissue assessment is recommended\n\n**Suggested Diagnosis:**\n- Further clinical correlation is needed\n- Consider comparison with prior imaging if available\n\n**Recommendations:**\n- Evaluate in the context of clinical history\n- Additional views or cross-sectional imaging may be helpful\n\nFeel free to ask specific questions about any findings.`
          : `Based on the current image context:\n\n"${trimmed}"\n\nThis is a relevant question. In clinical practice, you should consider:\n\n1. **Systematic approach**: Always follow a structured evaluation method\n2. **Clinical correlation**: Imaging findings should be correlated with patient symptoms\n3. **Differential diagnosis**: Consider multiple possibilities before concluding\n\nWould you like me to elaborate on any specific aspect?`,
        references: [
          { title: 'Diagnostic Imaging Guidelines', source: 'Musculoskeletal Radiology, Ch. 7' },
          { title: 'Clinical Orthopedic Examination', source: 'Imaging Interpretation Protocol' },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 2000);
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
            href="/student/qa"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Image Q&A</h1>
            <p className="text-xs text-muted-foreground">AI Q&A - Upload X-ray / CT / MRI</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
          <ImageIcon className="w-3.5 h-3.5" />
          Image Analysis
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
                {/* Image preview in message */}
                {msg.image && (
                  <div className={`mb-2 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                    <img
                      src={msg.image}
                      alt="Uploaded medical image"
                      className="max-w-[280px] rounded-xl border border-border"
                    />
                  </div>
                )}

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
                  {imageSubmitted ? 'Analyzing image...' : 'Thinking...'}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Upload preview */}
      {uploadedImage && (
        <div className="border-t border-border bg-card px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <img src={uploadedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{uploadedFileName}</p>
              <p className="text-xs text-muted-foreground">Ready to send</p>
            </div>
            <button onClick={removeImage} className="w-8 h-8 rounded-lg hover:bg-input flex items-center justify-center cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.dcm"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-11 w-11 rounded-xl border border-border bg-input text-muted-foreground flex items-center justify-center hover:bg-border/50 disabled:opacity-50 cursor-pointer transition-colors flex-shrink-0"
          >
            <Upload className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the image..."
            disabled={isLoading}
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !uploadedImage) || isLoading}
            className="h-11 w-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
