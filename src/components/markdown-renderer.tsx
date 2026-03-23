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

type InlineNode = string | JSX.Element;

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
          'prose prose-sm max-w-none',
          'prose-headings:text-[var(--foreground)] prose-headings:font-semibold',
          'prose-h1:text-xl prose-h1:border-b prose-h1:border-[var(--border)] prose-h1:pb-2',
          'prose-h2:text-lg prose-h2:mt-6',
          'prose-h3:text-base prose-h3:mt-4',
          'prose-p:text-[var(--foreground)] prose-p:leading-relaxed',
          'prose-a:[color:var(--link-color)] prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-[var(--foreground)]',
          'prose-code:[color:var(--code-color)] prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded',
          'prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700',
          '[&_ul]:text-[var(--foreground)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
          '[&_ol]:text-[var(--foreground)] [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
          '[&_li]:my-1 [&_li]:pl-1',
          'prose-blockquote:border-l-[var(--border)] prose-blockquote:text-[var(--muted-foreground)]',
          '[&_table]:text-sm [&_table]:border [&_table]:border-[var(--border)] [&_table]:border-collapse [&_table]:w-full',
          '[&_thead]:bg-[var(--secondary)]',
          '[&_th]:text-[var(--foreground)] [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:text-left [&_th]:font-semibold',
          '[&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-[var(--border)]',
          '[&_tr]:border-b [&_tr]:border-[var(--border)]',
          className
        )}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
