import type { VisualQaCitation } from '@/lib/api/types';
import { resolveApiAssetUrl, withVersionedAssetUrl } from '@/lib/api/client';

/** Inline markers from the model, e.g. `[Doc:uuid]` or `[Case:uuid]` or `[Doc:uuid|v:12]`. */
function markerRegex() {
  return /\[(Doc|Case):([a-fA-F0-9-]{36})(?:\|v:([^\]]+))?\]/gi;
}

export type VisualQaReferenceRow = {
  key: string;
  kind: 'doc' | 'case';
  label: string;
  href: string;
  documentId?: string;
  isLegacyUnavailable?: boolean;
  latestHref?: string;
};

function idKey(kind: 'doc' | 'case', id: string): string {
  return `${kind}:${id.toLowerCase()}`;
}

function latestDocumentHref(documentId?: string): string {
  if (!documentId?.trim()) return '';
  return resolveApiAssetUrl(`/api/documents/${documentId.trim()}/latest`);
}

/**
 * Removes citation markers from markdown and collects structured reference rows
 * (markers + API citations, de-duplicated).
 */
export function buildVisualQaReferences(
  markdown: string,
  citations: VisualQaCitation[],
): { cleanMarkdown: string; references: VisualQaReferenceRow[] } {
  const markers: Array<{ kind: 'doc' | 'case'; id: string; version?: string }> = [];
  const cleanMarkdown = markdown.replace(markerRegex(), (_full, kindRaw, id, ver) => {
    const kind = String(kindRaw).toLowerCase() === 'doc' ? 'doc' : 'case';
    markers.push({
      kind,
      id,
      version: typeof ver === 'string' && ver.trim() ? ver.trim() : undefined,
    });
    return '';
  });

  const seen = new Set<string>();
  const references: VisualQaReferenceRow[] = [];

  const pushRef = (row: VisualQaReferenceRow) => {
    if (!seen.has(row.key)) {
      seen.add(row.key);
      references.push(row);
    }
  };

  for (const m of markers) {
    if (m.kind === 'doc') {
      const cit = citations.find(
        (c) =>
          (c.documentId && c.documentId.toLowerCase() === m.id.toLowerCase()) ||
          (c.documentUrl && c.documentUrl.toLowerCase().includes(m.id.replace(/-/g, '').toLowerCase())),
      );
      const rawUrl = resolveApiAssetUrl(cit?.documentUrl);
      const href = rawUrl ? withVersionedAssetUrl(rawUrl, cit?.version ?? m.version) : '';
      pushRef({
        key: idKey('doc', m.id),
        kind: 'doc',
        label: cit?.title?.trim() || `Tài liệu ${m.id.slice(0, 8)}…`,
        href,
        documentId: m.id,
        isLegacyUnavailable: !href,
        latestHref: latestDocumentHref(m.id),
      });
    } else {
      pushRef({
        key: idKey('case', m.id),
        kind: 'case',
        label: `Case lâm sàng ${m.id.slice(0, 8)}…`,
        href: `/student/cases/${m.id}`,
      });
    }
  }

  let structIdx = 0;
  for (const c of citations) {
    const docId = c.documentId?.trim();
    const caseId = c.caseId?.trim();
    if (docId) {
      const key = idKey('doc', docId);
      if (seen.has(key)) continue;
      const rawUrl = resolveApiAssetUrl(c.documentUrl);
      if (!rawUrl && !c.title?.trim()) continue;
      const href = rawUrl ? withVersionedAssetUrl(rawUrl, c.version) : '';
      pushRef({
        key,
        kind: 'doc',
        label: c.title?.trim() || `Tài liệu ${docId.slice(0, 8)}…`,
        href,
        documentId: docId,
        isLegacyUnavailable: !href,
        latestHref: latestDocumentHref(docId),
      });
    } else if (caseId) {
      const key = idKey('case', caseId);
      if (seen.has(key)) continue;
      pushRef({
        key,
        kind: 'case',
        label: c.title?.trim() || `Case lâm sàng ${caseId.slice(0, 8)}…`,
        href: `/student/cases/${caseId}`,
      });
    } else {
      const rawUrl = resolveApiAssetUrl(c.documentUrl);
      if (!rawUrl?.trim() && !c.title?.trim()) continue;
      const key = `legacy:${rawUrl || 't'}:${c.chunkOrder ?? structIdx}`;
      structIdx += 1;
      const href = rawUrl ? withVersionedAssetUrl(rawUrl, c.version) : '';
      pushRef({
        key,
        kind: 'doc',
        label:
          c.title?.trim() ||
          (c.chunkOrder != null ? `Trích đoạn ${c.chunkOrder}` : 'Tài liệu tham khảo'),
        href,
        documentId: undefined,
        isLegacyUnavailable: !href,
        latestHref: '',
      });
    }
  }

  return { cleanMarkdown, references };
}
