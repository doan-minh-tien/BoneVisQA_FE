import DocumentList from '@/components/admin/documents/DocumentList';
import { Files } from 'lucide-react';

export default function AdminDocumentsPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
              <Files className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Documents</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl">
            Manage your knowledge base documents. Keep track of file indexing status and update content.
          </p>
        </div>
      </div>

      <DocumentList />
    </div>
  );
}
