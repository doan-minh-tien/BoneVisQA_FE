'use client';

import { useState, useRef } from 'react';
import { uploadAdminDocument } from '@/lib/api/admin-documents';
import { X, UploadCloud, File, Loader2, AlertCircle } from 'lucide-react';

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentDialog({
  isOpen,
  onClose,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (isUploading) return;
    setFile(null);
    setTitle('');
    setError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // If title is empty, default it to the filename without extension
      if (!title) {
        const name = e.target.files[0].name;
        setTitle(name.substring(0, name.lastIndexOf('.')) || name);
      }
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      if (!title) {
        const name = e.dataTransfer.files[0].name;
        setTitle(name.substring(0, name.lastIndexOf('.')) || name);
      }
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    try {
      setIsUploading(true);
      await uploadAdminDocument({
        file,
        categoryId: '',
        tagIds: [],
      });
      
      // Cleanup and notify parent
      handleDismiss();
      onSuccess();
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={handleDismiss} 
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
            <p className="text-gray-500 text-sm mt-1">Add a new file to the knowledge base.</p>
          </div>
          <button
            onClick={handleDismiss}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* File Upload Zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Document File <span className="text-red-500">*</span>
              </label>
              
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
                  relative group flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer
                  ${file ? 'border-primary/50 bg-primary/5' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'}
                  ${isUploading ? 'opacity-60 pointer-events-none' : ''}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={isUploading}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 break-all px-4">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 50MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                placeholder="Enter document title"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !title.trim()}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_rgba(8,145,178,0.25)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
