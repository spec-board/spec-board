/**
 * AST-based markdown parsing utilities
 *
 * This module provides a cleaner, more maintainable approach to parsing
 * structured markdown files using the unified/remark ecosystem.
 */

export {
  // Core parser
  parseMarkdown,

  // Section extraction
  extractSections,
  findSection,
  findSections,
  getSubsections,

  // Code blocks
  extractCodeBlocks,
  extractAllCodeBlocks,

  // Lists
  extractListItems,
  extractSimpleList,

  // Tables
  extractTables,

  // Text
  extractText,
  extractIntroText,

  // Metadata
  extractMetadata,
  extractMetadataValue,

  // Types
  type Section,
  type CodeBlock,
  type TableData,
  type ListItemData,
} from './ast-utils'

// Document parsers
export { parseQuickstartAST } from './quickstart-parser'
export { parsePlanAST } from './plan-parser'
export { parseResearchAST } from './research-parser'
export { parseDataModelAST } from './data-model-parser'

// Contract parser
export {
  parseContractMetadata,
  parseContractSections,
  inferContractType,
  parseCodeBlocks,
  parseContractTitle,
  parseContract,
} from './contract-parser'
