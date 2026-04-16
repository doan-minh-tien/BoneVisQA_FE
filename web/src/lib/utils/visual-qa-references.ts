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
  snippet?: string;
  pageLabel?: string;
  isLegacyUnavailable?: boolean;
  latestHref?: string;
};

function withPdfPageAnchor(url: string, citation?: VisualQaCitation): string {
  if (!url) return url;
  const startPage =
    (typeof citation?.startPage === 'number' && Number.isFinite(citation.startPage) && citation.startPage > 0
      ? citation.startPage
      : undefined) ??
    (typeof citation?.pageNumber === 'number' && Number.isFinite(citation.pageNumber) && citation.pageNumber > 0
      ? citation.pageNumber
      : undefined);
  if (!startPage) return url;
  return `${url.replace(/#.*$/, '')}#page=${startPage}`;
}

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
    const cit = citations.find(
      (c) =>
        (m.kind === 'doc' &&
          ((c.documentId && c.documentId.toLowerCase() === m.id.toLowerCase()) ||
            (c.documentUrl && c.documentUrl.toLowerCase().includes(m.id.replace(/-/g, '').toLowerCase())))) ||
        (m.kind === 'case' && c.caseId && c.caseId.toLowerCase() === m.id.toLowerCase()),
    );
    if (m.kind === 'doc') {
      const rawUrl = resolveApiAssetUrl(cit?.documentUrl);
      const href = rawUrl ? withVersionedAssetUrl(rawUrl, cit?.version ?? m.version) : '';
      pushRef({
        key: idKey('doc', m.id),
        kind: 'doc',
        label: cit?.displayLabel?.trim() || cit?.label?.trim() || cit?.title?.trim() || `Document ${m.id.slice(0, 8)}...`,
        href,
        documentId: m.id,
        snippet: cit?.snippet?.trim() || undefined,
        pageLabel: cit?.pageLabel?.trim() || undefined,
        isLegacyUnavailable: !href,
        latestHref: latestDocumentHref(m.id),
      });
    } else {
      pushRef({
        key: idKey('case', m.id),
        kind: 'case',
        label: cit?.displayLabel?.trim() || cit?.label?.trim() || `Clinical case ${m.id.slice(0, 8)}...`,
        href: cit?.href?.trim() || `/student/cases/${m.id}`,
        snippet: cit?.snippet?.trim() || undefined,
        pageLabel: cit?.pageLabel?.trim() || undefined,
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
      const href = rawUrl ? withPdfPageAnchor(withVersionedAssetUrl(rawUrl, c.version), c) : '';
      pushRef({
        key,
        kind: 'doc',
        label:
          c.displayLabel?.trim() ||
          c.label?.trim() ||
          c.title?.trim() ||
          `Document ${docId.slice(0, 8)}...`,
        href,
        documentId: docId,
        snippet: c.snippet?.trim() || undefined,
        pageLabel: c.pageLabel?.trim() || undefined,
        isLegacyUnavailable: !href,
        latestHref: latestDocumentHref(docId),
      });
    } else if (caseId) {
      const key = idKey('case', caseId);
      if (seen.has(key)) continue;
      pushRef({
        key,
        kind: 'case',
        label: c.displayLabel?.trim() || c.label?.trim() || c.title?.trim() || `Clinical case ${caseId.slice(0, 8)}...`,
        href: `/student/cases/${caseId}`,
        snippet: c.snippet?.trim() || undefined,
        pageLabel: c.pageLabel?.trim() || undefined,
      });
    } else {
      const rawUrl = resolveApiAssetUrl(c.documentUrl);
      if (!rawUrl?.trim() && !c.title?.trim()) continue;
      const key = `legacy:${rawUrl || 't'}:${structIdx}`;
      structIdx += 1;
      const href = rawUrl ? withPdfPageAnchor(withVersionedAssetUrl(rawUrl, c.version), c) : '';
      pushRef({
        key,
        kind: 'doc',
        label:
          c.displayLabel?.trim() ||
          c.label?.trim() ||
          c.title?.trim() ||
          'Reference document',
        href,
        documentId: undefined,
        snippet: c.snippet?.trim() || undefined,
        pageLabel: c.pageLabel?.trim() || undefined,
        isLegacyUnavailable: !href,
        latestHref: '',
      });
    }
  }

  return { cleanMarkdown, references };
}
