'use client';

import { useState, useEffect, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';

// Copy button state type (T028)
type CopyState = 'idle' | 'copying' | 'copied';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

/**
 * CodeBlock Component (T011-T016, T027-T031)
 *
 * Syntax-highlighted code block with copy functionality.
 * Uses prism-react-renderer for safe React-based highlighting.
 */
export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // Theme detection (T012)
  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Copy handler (T027-T029)
  const handleCopy = useCallback(async () => {
    if (copyState !== 'idle') return;

    setCopyState('copying');
    const success = await copyToClipboard(code);

    if (success) {
      setCopyState('copied');
      // Reset after 2 seconds (T029)
      setTimeout(() => setCopyState('idle'), 2000);
    } else {
      setCopyState('idle');
    }
  }, [code, copyState]);

  // Handle keyboard activation (T034)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCopy();
      }
    },
    [handleCopy]
  );

  // Select theme based on mode (T012)
  const theme = isDarkMode ? themes.vsDark : themes.vsLight;

  // Normalize language for prism (T014, T016)
  const normalizedLanguage = normalizeLanguage(language);

  // Handle empty or malformed code (T015, T016)
  if (!code || code.trim() === '') {
    return (
      <div className={cn('rounded-lg bg-[var(--secondary)]/30 p-4', className)}>
        <pre className="text-sm text-[var(--muted-foreground)] font-mono">
          {/* Empty code block */}
        </pre>
      </div>
    );
  }

  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      {/* Copy button (T027) - appears on hover */}
      <button
        onClick={handleCopy}
        onKeyDown={handleKeyDown}
        className={cn(
          'absolute top-2 right-2 p-2 rounded-md transition-all z-10',
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          'bg-[var(--secondary)] hover:bg-[var(--secondary)]/80',
          'border border-[var(--border)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]'
        )}
        aria-label={
          copyState === 'copied'
            ? 'Copied to clipboard'
            : 'Copy code to clipboard'
        }
        tabIndex={0}
      >
        {copyState === 'copied' ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}
      </button>

      {/* Aria-live region for copy confirmation (T031) */}
      <div aria-live="polite" className="sr-only">
        {copyState === 'copied' && 'Copied to clipboard'}
      </div>

      {/* Syntax highlighted code (T011) */}
      <Highlight theme={theme} code={code.trim()} language={normalizedLanguage}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              highlightClassName,
              'p-4 overflow-x-auto text-sm font-mono'
            )}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>

      {/* Language badge */}
      {normalizedLanguage !== 'text' && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-mono text-[var(--muted-foreground)] bg-[var(--secondary)]/50 rounded">
          {normalizedLanguage}
        </div>
      )}
    </div>
  );
}

/**
 * Normalize language identifier for prism-react-renderer (T014, T016)
 *
 * Maps common language aliases and handles unknown languages.
 */
function normalizeLanguage(language: string): string {
  const lang = language.toLowerCase().trim();

  // Map common aliases
  const aliases: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    md: 'markdown',
    '': 'text',
  };

  return aliases[lang] || lang || 'text';
}
