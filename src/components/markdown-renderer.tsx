'use client';

import { useEffect, useState } from 'react';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import DOMPurify from 'dompurify';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div>
      {renderError && (
        <div className="flex items-center gap-2 text-yellow-500 text-sm mb-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{renderError}</span>
        </div>
      )}
      <div
        className={cn(
          'prose prose-invert prose-sm max-w-none',
          'prose-headings:text-zinc-100 prose-headings:font-semibold',
          'prose-h1:text-xl prose-h1:border-b prose-h1:border-zinc-700 prose-h1:pb-2',
          'prose-h2:text-lg prose-h2:mt-6',
          'prose-h3:text-base prose-h3:mt-4',
          'prose-p:text-zinc-300 prose-p:leading-relaxed',
          'prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-zinc-200',
          'prose-code:text-pink-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded',
          'prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700',
          '[&_ul]:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
          '[&_ol]:text-zinc-300 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
          '[&_li]:my-1 [&_li]:pl-1',
          'prose-blockquote:border-l-zinc-600 prose-blockquote:text-zinc-400',
          '[&_table]:text-sm [&_table]:border [&_table]:border-zinc-600 [&_table]:border-collapse [&_table]:w-full',
          '[&_thead]:bg-zinc-800',
          '[&_th]:text-zinc-200 [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-zinc-600 [&_th]:text-left [&_th]:font-semibold',
          '[&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-zinc-600',
          '[&_tr]:border-b [&_tr]:border-zinc-600',
          className
        )}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
