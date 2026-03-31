import DocumentDetail from '@/components/admin/documents/DocumentDetail';
import { Files } from 'lucide-react';

export default async function AdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
              <Files className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Document Details</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl">
            View indexing records and metadata for the selected document.
          </p>
        </div>
      </div>

      <DocumentDetail id={id} />
    </div>
  );
}
