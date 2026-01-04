/**
 * Contract Parser - Utilities for parsing contract markdown files
 *
 * Extracts metadata, sections, and code blocks from contract documents
 * for enhanced display in the ContractsViewer component.
 */

import type {
  ContractMetadata,
  ContractSection,
  ContractCodeBlock,
  ParsedContract,
  ContractType,
} from '@/types';

/**
 * Parse contract metadata from markdown content (T007)
 *
 * Extracts key-value pairs in the format: **Key**: Value
 * ONLY from the document header (before the first ## heading)
 * Common fields: Feature, Date, Type, Endpoint, Base Path, Location
 */
export function parseContractMetadata(content: string): ContractMetadata {
  const metadata: ContractMetadata = {};

  // Only extract metadata from the header section (before first ## heading)
  // This prevents picking up documentation text that describes the extraction pattern
  const firstH2Index = content.indexOf('\n## ');
  const headerContent = firstH2Index > 0 ? content.slice(0, firstH2Index) : content;

  // Match patterns like **Feature**: value or **Date**: value
  // Only match simple values (not containing backticks or arrows which indicate documentation)
  const patterns: { key: keyof ContractMetadata; regex: RegExp }[] = [
    { key: 'feature', regex: /\*\*Feature\*\*:\s*([^`\n→]+?)(?:\n|$)/i },
    { key: 'date', regex: /\*\*Date\*\*:\s*([^`\n→]+?)(?:\n|$)/i },
    { key: 'type', regex: /\*\*Type\*\*:\s*([^`\n→]+?)(?:\n|$)/i },
    { key: 'endpoint', regex: /\*\*Endpoint\*\*:\s*([^`\n→]+?)(?:\n|$)/i },
    { key: 'basePath', regex: /\*\*Base Path\*\*:\s*([^`\n→]+?)(?:\n|$)/i },
    { key: 'location', regex: /\*\*Location\*\*:\s*(`[^`]+`)(?:\n|$)/i },
  ];

  for (const { key, regex } of patterns) {
    const match = headerContent.match(regex);
    if (match && match[1]) {
      metadata[key] = match[1].trim();
    }
  }

  return metadata;
}

/**
 * Generate a URL-safe slug from heading text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Parse contract sections from markdown content (T008)
 *
 * Extracts only H2 (##) headings for cleaner section navigation.
 * Returns sections with id (slug), title, and level.
 */
export function parseContractSections(content: string): ContractSection[] {
  const sections: ContractSection[] = [];

  // Match H2 headings only (not inside code blocks)
  // First, remove code blocks to avoid matching headings inside them
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  // Match only ## at start of line (H2 sections only for cleaner navigation)
  const headingRegex = /^(##)\s+(.+?)$/gm;
  let match;

  while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();

    sections.push({
      id: slugify(title),
      title,
      level,
    });
  }

  return sections;
}

/**
 * Infer contract type from metadata (T009)
 *
 * Logic:
 * - If endpoint or basePath present -> 'api'
 * - If location present or type contains "Component" -> 'component'
 * - Otherwise -> 'unknown'
 */
export function inferContractType(metadata: ContractMetadata): ContractType {
  // Check for API indicators
  if (metadata.endpoint || metadata.basePath) {
    return 'api';
  }

  // Check for Component indicators
  if (metadata.location) {
    return 'component';
  }

  if (metadata.type && metadata.type.toLowerCase().includes('component')) {
    return 'component';
  }

  return 'unknown';
}

/**
 * Extract code blocks from markdown content (T014)
 *
 * Parses fenced code blocks with language detection.
 * Returns array of code blocks with language, code, and line count.
 */
export function parseCodeBlocks(content: string): ContractCodeBlock[] {
  const codeBlocks: ContractCodeBlock[] = [];

  // Match fenced code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const code = match[2];
    const lineCount = code.split('\n').length;

    codeBlocks.push({
      language,
      code,
      lineCount,
    });
  }

  return codeBlocks;
}

/**
 * Extract title from markdown content
 *
 * Looks for the first H1 heading (# Title)
 */
export function parseContractTitle(content: string): string | undefined {
  // Match first H1 heading
  const match = content.match(/^#\s+(.+?)$/m);
  return match ? match[1].trim() : undefined;
}

/**
 * Parse a complete contract document
 *
 * Combines all parsing functions to return a fully parsed contract.
 */
export function parseContract(content: string): ParsedContract {
  return {
    rawContent: content,
    metadata: parseContractMetadata(content),
    sections: parseContractSections(content),
    codeBlocks: parseCodeBlocks(content),
    title: parseContractTitle(content),
  };
}
