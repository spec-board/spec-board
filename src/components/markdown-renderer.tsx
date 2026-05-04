'use client';

import { useEffect, useState, useMemo } from 'react';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import DOMPurify from 'dompurify';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  InlineMarkdown -- lightweight, synchronous inline markdown render  */
/*  Handles: **bold**, *italic*, `code`, [links](url), ~~strike~~     */
/* ------------------------------------------------------------------ */

interface InlineMarkdownProps {
  content: string;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

/**
 * Converts a markdown string into React elements synchronously.
 * Suitable for short text like questions, descriptions, labels etc.
 * For full documents use <MarkdownRenderer /> instead.
 */
export function InlineMarkdown({ content, className, as: Tag = 'span' }: InlineMarkdownProps) {
  const elements = useMemo(() => parseInlineMarkdown(content), [content]);
  return <Tag className={className}>{elements}</Tag>;
}

type InlineNode = string | React.ReactElement;

let _inlineKey = 0;
function nextKey() {
  return `im-${++_inlineKey}`;
}

function parseInlineMarkdown(text: string): InlineNode[] {
  if (!text) return [];

  // Order matters: bold before italic, strikethrough, code, link
  const TOKEN_RE =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(~~(.+?)~~)|(`(.+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;

  const result: InlineNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      result.push(<strong key={nextKey()}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      result.push(<em key={nextKey()}>{match[4]}</em>);
    } else if (match[5]) {
      // __underline/bold__
      result.push(<strong key={nextKey()}>{match[6]}</strong>);
    } else if (match[7]) {
      // ~~strikethrough~~
      result.push(<del key={nextKey()}>{match[8]}</del>);
    } else if (match[9]) {
      // `code`
      result.push(
        <code key={nextKey()} className="bg-[var(--secondary)] px-1 py-0.5 rounded text-[0.9em]">
          {match[10]}
        </code>
      );
    } else if (match[11]) {
      // [text](url)
      result.push(
        <a
          key={nextKey()}
          href={match[13]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--link-color)] hover:underline"
        >
          {match[12]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  MarkdownRenderer -- full async markdown-to-HTML renderer           */
/* ------------------------------------------------------------------ */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    async function processMarkdown() {
      setIsLoading(true);
      setRenderError(null);
      try {
        const result = await remark().use(remarkGfm).use(html).process(content);
        // Sanitize HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(result.toString(), {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
            'strong', 'em', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'span', 'div'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
        });
        setHtmlContent(sanitizedHtml);
      } catch (error) {
        console.error('Error processing markdown:', error);
        setRenderError('Failed to render markdown. Showing raw content.');
        // Sanitize fallback content too
        setHtmlContent(DOMPurify.sanitize(`<pre>${content}</pre>`));
      }
      setIsLoading(false);
    }

    processMarkdown();
  }, [content]);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-[var(--secondary)] rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-[var(--secondary)] rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-[var(--secondary)] rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div>
      {renderError && (
        <div className="flex items-center gap-2 text-sm mb-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20" style={{ color: 'var(--tag-text-warning)' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{renderError}</span>
        </div>
      )}
      <div
        className={cn(
          'doc-renderer prose prose-sm max-w-none',
          /* ---- Headings: docx-style hierarchy ---- */
          'prose-headings:text-[var(--foreground)] prose-headings:font-bold prose-headings:tracking-tight',
          'prose-h1:text-[1.35rem] prose-h1:leading-tight prose-h1:border-b-2 prose-h1:border-[var(--foreground)]/15 prose-h1:pb-3 prose-h1:mb-5 prose-h1:mt-8 first:prose-h1:mt-0',
          /* h2: section title -- centered, uppercase, generous spacing */
          'prose-h2:text-[1.05rem] prose-h2:leading-snug prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:text-center prose-h2:uppercase prose-h2:tracking-widest prose-h2:border-b prose-h2:border-[var(--border)]',
          /* h3: story title -- bold, left-aligned, extra bottom margin */
          'prose-h3:text-[0.95rem] prose-h3:leading-snug prose-h3:mt-6 prose-h3:mb-3 prose-h3:font-bold',
          /* h4: sub-section title -- uppercase, muted */
          'prose-h4:text-[0.8rem] prose-h4:leading-snug prose-h4:mt-5 prose-h4:mb-2 prose-h4:font-semibold prose-h4:uppercase prose-h4:tracking-wider prose-h4:text-[var(--muted-foreground)]',
          /* ---- Body text ---- */
          'prose-p:text-[var(--foreground)] prose-p:leading-[1.75] prose-p:my-2.5 prose-p:text-[0.84rem]',
          'prose-a:[color:var(--link-color)] prose-a:no-underline hover:prose-a:underline prose-a:font-medium',
          'prose-strong:text-[var(--foreground)] prose-strong:font-semibold',
          'prose-em:text-[var(--muted-foreground)]',
          /* ---- Code ---- */
          'prose-code:[color:var(--code-color)] prose-code:bg-[var(--secondary)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.8rem] prose-code:font-mono',
          'prose-pre:bg-[var(--secondary)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:rounded-lg prose-pre:text-[0.8rem]',
          /* ---- Lists: indented, spaced, styled bullets ---- */
          '[&_ul]:text-[var(--foreground)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:text-[0.84rem]',
          '[&_ol]:text-[var(--foreground)] [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:text-[0.84rem]',
          '[&_li]:my-1.5 [&_li]:pl-1.5 [&_li]:leading-[1.7]',
          '[&_li_p]:my-0.5',
          '[&_ul_ul]:mt-1.5 [&_ul_ul]:mb-0',
          '[&_ol_ol]:mt-1.5 [&_ol_ol]:mb-0',
          /* ---- Blockquote: story description block ---- */
          'prose-blockquote:border-l-[3px] prose-blockquote:border-l-[var(--primary)]/25 prose-blockquote:bg-[var(--secondary)]/30 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-4 prose-blockquote:text-[var(--foreground)] prose-blockquote:not-italic prose-blockquote:text-[0.84rem] prose-blockquote:leading-[1.8]',
          /* ---- HR: subtle divider between stories ---- */
          '[&_hr]:my-8 [&_hr]:border-[var(--border)]/50 [&_hr]:border-dashed',
          /* ---- Table: clean grid ---- */
          '[&_table]:text-[0.8rem] [&_table]:border [&_table]:border-[var(--border)] [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table]:rounded-lg [&_table]:overflow-hidden',
          '[&_thead]:bg-[var(--secondary)]',
          '[&_th]:text-[var(--foreground)] [&_th]:px-3 [&_th]:py-2.5 [&_th]:border [&_th]:border-[var(--border)] [&_th]:text-left [&_th]:font-semibold [&_th]:text-[0.78rem] [&_th]:uppercase [&_th]:tracking-wide',
          '[&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-[var(--border)] [&_td]:text-[var(--foreground)]',
          '[&_tr]:border-b [&_tr]:border-[var(--border)]',
          '[&_tbody_tr:hover]:bg-[var(--secondary)]/30',
          className
        )}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
