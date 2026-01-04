'use client';

import { useCallback } from 'react';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContractSection } from '@/types';

interface ContractSectionNavProps {
  sections: ContractSection[];
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

/**
 * ContractSectionNav Component (T022-T026)
 *
 * Mini table of contents for navigating contract sections.
 * Hidden when fewer than 3 sections (T025).
 */
export function ContractSectionNav({
  sections,
  onSectionClick,
  className,
}: ContractSectionNavProps) {
  // Hide when fewer than 3 sections (T025)
  if (sections.length < 3) {
    return null;
  }

  // Scroll to section handler (T023)
  const handleSectionClick = useCallback(
    (sectionId: string) => {
      // Call external handler if provided
      onSectionClick?.(sectionId);

      // Scroll to section using anchor ID
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
    [onSectionClick]
  );

  return (
    <nav
      className={cn(
        'flex flex-col gap-2 p-3 mb-4 rounded-lg',
        'bg-[var(--background)] border border-[var(--border)]',
        'sticky top-0 z-10',
        className
      )}
      aria-label="Contract sections"
    >
      {/* Header - bold and centered */}
      <div className="flex items-center justify-center gap-2">
        <List className="w-4 h-4 text-[var(--muted-foreground)]" />
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Sections
        </span>
      </div>

      {/* Scrollable section buttons */}
      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto justify-center">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-md transition-colors',
              'bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]',
              'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              'focus:outline-none focus:ring-1 focus:ring-[var(--ring)]',
              'border border-[var(--border)]/50'
            )}
          >
            {section.title}
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * Add anchor IDs to heading elements in rendered content (T026)
 *
 * This function processes HTML content and adds id attributes to H2/H3 headings.
 * Used by the ContractsViewer to enable scroll-to-section functionality.
 */
export function addAnchorIdsToHeadings(html: string): string {
  // Match H2 and H3 tags and add id attribute based on content
  return html.replace(
    /<(h[23])>([^<]+)<\/h[23]>/gi,
    (match, tag, content) => {
      const id = slugify(content);
      return `<${tag} id="${id}">${content}</${tag}>`;
    }
  );
}

/**
 * Generate a URL-safe slug from text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
