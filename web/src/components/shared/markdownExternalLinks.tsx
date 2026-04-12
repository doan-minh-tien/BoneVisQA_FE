import type { Components } from 'react-markdown';

/** Opens http(s) links from AI markdown in a new tab (safe rel). */
export const markdownExternalLinkComponents: Partial<Components> = {
  a: ({ href, children, ...props }) => {
    const h = href != null ? String(href) : '';
    const external = /^https?:\/\//i.test(h) || h.startsWith('//');
    return (
      <a
        href={h || undefined}
        {...props}
        {...(external ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  },
};
