import Header from '@/components/Header';
import DocumentDetail from '@/components/admin/documents/DocumentDetail';

export default async function AdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen">
      <Header
        title="Document Details"
        subtitle="View indexing records, metadata, and processing progress."
      />
      <div className="mx-auto max-w-7xl p-6">
        <DocumentDetail id={id} />
      </div>
    </div>
  );
}
