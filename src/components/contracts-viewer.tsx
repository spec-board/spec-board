'use client';

import { useState, useMemo } from 'react';
import { FileCode, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';
import { ContractMetadataHeader } from './contract-metadata-header';
import { ContractSectionNav, addAnchorIdsToHeadings } from './contract-section-nav';
import {
  parseContractMetadata,
  parseContractSections,
  inferContractType,
} from '@/lib/markdown/contract-parser';
import type { SpecKitFile } from '@/types';
import DOMPurify from 'dompurify';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

interface ContractFileProps {
  file: SpecKitFile;
  defaultExpanded?: boolean;
}

/**
 * Render markdown content with code blocks replaced by CodeBlock components
 */
function renderContractContent(content: string): React.ReactNode {
  // Split content by code blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add markdown content before this code block
    if (match.index > lastIndex) {
      const markdownContent = content.slice(lastIndex, match.index);
      parts.push(
        <MarkdownContent key={`md-${keyIndex}`} content={markdownContent} />
      );
    }

    // Add the code block
    const language = match[1] || 'text';
    const code = match[2];
    parts.push(
      <CodeBlock
        key={`code-${keyIndex}`}
        code={code}
        language={language}
        className="my-4"
      />
    );

    lastIndex = match.index + match[0].length;
    keyIndex++;
  }

  // Add remaining markdown content after last code block
  if (lastIndex < content.length) {
    const markdownContent = content.slice(lastIndex);
    parts.push(
      <MarkdownContent key={`md-${keyIndex}`} content={markdownContent} />
    );
  }

  return parts.length > 0 ? parts : <MarkdownContent content={content} />;
}

/**
 * Render markdown content as sanitized HTML with anchor IDs (T026, T032)
 */
function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    const result = remark().use(remarkGfm).use(remarkHtml).processSync(content);
    // Add anchor IDs to headings (T026)
    const htmlWithAnchors = addAnchorIdsToHeadings(String(result));
    // Sanitize HTML (T032)
    return DOMPurify.sanitize(htmlWithAnchors);
  }, [content]);

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Check if file is a YAML file by extension
 */
function isYamlFile(filePath: string): boolean {
  return filePath.endsWith('.yaml') || filePath.endsWith('.yml');
}

/**
 * Extract OpenAPI metadata from YAML content
 */
function parseYamlMetadata(content: string): { title?: string; description?: string; version?: string; basePath?: string } {
  const result: { title?: string; description?: string; version?: string; basePath?: string } = {};

  // Extract info.title
  const titleMatch = content.match(/^\s*title:\s*(.+)$/m);
  if (titleMatch) result.title = titleMatch[1].trim();

  // Extract info.description
  const descMatch = content.match(/^\s*description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim();

  // Extract info.version
  const versionMatch = content.match(/^\s*version:\s*(.+)$/m);
  if (versionMatch) result.version = versionMatch[1].trim();

  // Extract servers[0].url or basePath
  const serverUrlMatch = content.match(/servers:\s*\n\s*-\s*url:\s*(.+)/);
  if (serverUrlMatch) result.basePath = serverUrlMatch[1].trim();

  return result;
}

function ContractFile({ file, defaultExpanded = false }: ContractFileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured');
  const fileName = file.path.split('/').pop() || file.path;
  const isYaml = isYamlFile(file.path);

  // Parse contract metadata and sections (T007-T009)
  const metadata = useMemo(
    () => parseContractMetadata(file.content),
    [file.content]
  );
  const sections = useMemo(
    () => parseContractSections(file.content),
    [file.content]
  );
  const contractType = useMemo(() => inferContractType(metadata), [metadata]);

  // For YAML files, extract OpenAPI metadata
  const yamlMetadata = useMemo(
    () => isYaml ? parseYamlMetadata(file.content) : null,
    [file.content, isYaml]
  );

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors"
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <FileCode className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--tag-text-info)' }} />
        <span className="font-mono text-sm flex-1 text-left truncate">{fileName}</span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-[var(--border)]">
          {isYaml ? (
            <>
              {/* YAML/OpenAPI Metadata Header */}
              {yamlMetadata && (yamlMetadata.title || yamlMetadata.basePath) && (
                <div className="flex flex-wrap items-center gap-3 p-3 mb-4 rounded-lg bg-[var(--secondary)]/20 border border-[var(--border)]">
                  <span className="px-2 py-0.5 text-xs font-medium rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
                    OpenAPI
                  </span>
                  {yamlMetadata.title && (
                    <span className="text-sm font-medium">{yamlMetadata.title}</span>
                  )}
                  {yamlMetadata.version && (
                    <span className="text-xs text-[var(--muted-foreground)]">v{yamlMetadata.version}</span>
                  )}
                  {yamlMetadata.basePath && (
                    <span className="font-mono text-sm text-[var(--foreground)]">{yamlMetadata.basePath}</span>
                  )}
                </div>
              )}
              {/* YAML Content with Syntax Highlighting */}
              <CodeBlock
                code={file.content}
                language="yaml"
                className="my-0"
              />
            </>
          ) : (
            <>
              {/* View Mode Toggle for Markdown contracts */}
              <div className="flex items-center justify-between mb-4">
                <ContractMetadataHeader
                  metadata={metadata}
                  contractType={contractType}
                />
                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                  <button
                    onClick={() => setViewMode('structured')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium transition-colors',
                      viewMode === 'structured'
                        ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                        : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50'
                    )}
                  >
                    Structured
                  </button>
                  <button
                    onClick={() => setViewMode('markdown')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium transition-colors border-l border-[var(--border)]',
                      viewMode === 'markdown'
                        ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                        : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/50'
                    )}
                  >
                    Markdown
                  </button>
                </div>
              </div>

              {viewMode === 'structured' ? (
                <div className="max-h-[70vh] overflow-y-auto">
                  {/* Section Navigation (T024) - sticky within scrollable container */}
                  <ContractSectionNav sections={sections} />

                  {/* Contract Content with Syntax Highlighting (T013) */}
                  <div className="contract-content">
                    {renderContractContent(file.content)}
                  </div>
                </div>
              ) : (
                /* Raw Markdown View */
                <CodeBlock
                  code={file.content}
                  language="markdown"
                  className="my-0"
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ContractsViewerProps {
  contracts: SpecKitFile[];
  className?: string;
}

export function ContractsViewer({ contracts, className }: ContractsViewerProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No contracts yet</p>
        <p className="text-sm mt-2">Create files in the contracts/ directory to define API contracts</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {contracts.length} contract{contracts.length !== 1 ? 's' : ''} defined
        </p>
      </div>
      <div>
        {contracts.map((contract, index) => (
          <ContractFile
            key={contract.path}
            file={contract}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
