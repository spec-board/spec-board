'use client';

import { useState, useMemo } from 'react';
import { Database, ChevronDown, ChevronRight, Calendar, Box, List, ShieldCheck, ArrowRightLeft, HardDrive, ArrowUpDown, Filter, Search, Fingerprint, Clock, GitBranch, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseDataModelAST } from '@/lib/markdown';
import { MarkdownRenderer } from './markdown-renderer';
import type { ParsedDataModel, DataEntity, DataEnum, ValidationRule, StateTransition, StateTransitionsData, StorageSchemaData, DataIntegrityRule, DataModelSection } from '@/types';

interface DataModelViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

function EntityCard({ entity }: { entity: DataEntity }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Box className="w-4 h-4 text-blue-500" />
        <h4 className="font-medium flex-1">{entity.name}</h4>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2">
          {entity.description && (
            <p className="text-sm text-[var(--muted-foreground)]">{entity.description}</p>
          )}
          {entity.codeBlock && (
            <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
              {entity.codeBlock}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function EntitiesSection({ entities }: { entities: DataEntity[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (entities.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Box className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold">Entities</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{entities.length} entities</span>
      </button>
      {isExpanded && (
        <div className="space-y-2">
          {entities.map((entity, idx) => (
            <EntityCard key={idx} entity={entity} />
          ))}
        </div>
      )}
    </div>
  );
}

function EnumCard({ dataEnum }: { dataEnum: DataEnum }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <List className="w-4 h-4 text-purple-500" />
        <h4 className="font-medium flex-1">{dataEnum.name}</h4>
      </button>

      {isExpanded && dataEnum.codeBlock && (
        <div className="p-3">
          <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
            {dataEnum.codeBlock}
          </pre>
        </div>
      )}
    </div>
  );
}

function EnumsSection({ enums }: { enums: DataEnum[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (enums.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <List className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold">Enums</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{enums.length} enums</span>
      </button>
      {isExpanded && (
        <div className="space-y-2">
          {enums.map((dataEnum, idx) => (
            <EnumCard key={idx} dataEnum={dataEnum} />
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationRulesSection({ rules }: { rules: ValidationRule[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (rules.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <h3 className="font-semibold">Validation Rules</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{rules.length} fields</span>
      </button>
      {isExpanded && (
        <div className="space-y-3 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {rules.map((rule, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-medium mb-1">{rule.field}</h4>
              <ul className="space-y-1">
                {rule.rules.map((r, rIdx) => (
                  <li key={rIdx} className="text-xs text-[var(--muted-foreground)] flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StateTransitionsSection({ data }: { data: StateTransitionsData }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data.subsections.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <ArrowRightLeft className="w-4 h-4 text-orange-500" />
        <h3 className="font-semibold">State Transitions</h3>
      </button>
      {isExpanded && (
        <div className="space-y-4">
          {data.subsections.map((sub, idx) => (
            <div key={idx} className="p-3 bg-[var(--secondary)]/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-[var(--muted-foreground)]">{sub.title}</h4>
              {sub.codeBlock && (
                <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto mb-2">
                  {sub.codeBlock}
                </pre>
              )}
              {/* Transitions table within subsection */}
              {sub.transitions && sub.transitions.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-2">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--secondary)]/50">
                      <tr>
                        <th className="text-left p-2 font-medium">State</th>
                        <th className="text-left p-2 font-medium">Condition</th>
                        <th className="text-left p-2 font-medium">Transitions To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sub.transitions.map((t, tIdx) => (
                        <tr key={tIdx} className="border-t border-[var(--border)]">
                          <td className="p-2 font-medium">{t.state}</td>
                          <td className="p-2 text-[var(--muted-foreground)]">{t.condition}</td>
                          <td className="p-2">
                            {t.transitionsTo.map((to, toIdx) => (
                              <span key={toIdx} className="inline-block px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs mr-1">
                                {to}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sub.description && (
                <MarkdownRenderer content={sub.description} className="text-sm" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StorageSchemaSection({ data }: { data: StorageSchemaData }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data.subsections.length === 0 && !data.note) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <HardDrive className="w-4 h-4 text-cyan-500" />
        <h3 className="font-semibold">localStorage Schema</h3>
      </button>
      {isExpanded && (
        <div className="space-y-4">
          {data.subsections.map((sub, idx) => (
            <div key={idx} className="p-3 bg-[var(--secondary)]/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-[var(--muted-foreground)]">{sub.title}</h4>
              {/* Keys table */}
              {sub.keys && sub.keys.length > 0 && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-2">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--secondary)]/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Key</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sub.keys.map((k, kIdx) => (
                        <tr key={kIdx} className="border-t border-[var(--border)]">
                          <td className="p-2">
                            <code className="px-1.5 py-0.5 bg-[var(--secondary)] rounded text-xs">{k.key}</code>
                          </td>
                          <td className="p-2">
                            <code className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">{k.type}</code>
                          </td>
                          <td className="p-2 text-[var(--muted-foreground)]">{k.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Code block */}
              {sub.codeBlock && (
                <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
                  {sub.codeBlock}
                </pre>
              )}
            </div>
          ))}
          {/* Note */}
          {data.note && (
            <p className="text-sm text-[var(--muted-foreground)] italic px-3">
              <strong>Note:</strong> {data.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SortingBehaviorSection({ behaviors }: { behaviors: { option: string; description: string }[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (behaviors.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <ArrowUpDown className="w-4 h-4 text-yellow-500" />
        <h3 className="font-semibold">Sorting Behavior</h3>
      </button>
      {isExpanded && (
        <div className="space-y-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {behaviors.map((b, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-medium">By {b.option}</h4>
              <MarkdownRenderer content={b.description} className="text-xs text-[var(--muted-foreground)]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilteringBehaviorSection({ filters }: { filters: { filter: string; condition: string }[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (filters.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Filter className="w-4 h-4 text-pink-500" />
        <h3 className="font-semibold">Filtering Behavior</h3>
      </button>
      {isExpanded && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)]/50">
              <tr>
                <th className="text-left p-2 font-medium">Filter</th>
                <th className="text-left p-2 font-medium">Condition</th>
              </tr>
            </thead>
            <tbody>
              {filters.map((f, idx) => (
                <tr key={idx} className="border-t border-[var(--border)]">
                  <td className="p-2 font-medium">{f.filter}</td>
                  <td className="p-2 text-[var(--muted-foreground)]">{f.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SearchBehaviorSection({ behaviors }: { behaviors: string[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (behaviors.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Search className="w-4 h-4 text-indigo-500" />
        <h3 className="font-semibold">Search Behavior</h3>
      </button>
      {isExpanded && (
        <ul className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {behaviors.map((b, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="text-indigo-500">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getIntegrityIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('id') || t.includes('unique')) return Fingerprint;
  if (t.includes('timestamp') || t.includes('time')) return Clock;
  if (t.includes('migration') || t.includes('version')) return GitBranch;
  return ShieldCheck;
}

function getIntegrityColor(title: string) {
  const t = title.toLowerCase();
  if (t.includes('id') || t.includes('unique')) return 'emerald';
  if (t.includes('timestamp') || t.includes('time')) return 'amber';
  if (t.includes('migration') || t.includes('version')) return 'violet';
  return 'emerald';
}

function renderCodeInText(text: string, colorClass: string) {
  return text.split('`').map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className={cn('px-1 py-0.5 rounded text-xs font-mono', colorClass)}>
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function DataIntegritySection({ rules }: { rules: DataIntegrityRule[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (rules.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <h3 className="font-semibold">Data Integrity</h3>
      </button>
      {isExpanded && (
        <div className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rules.map((rule, idx) => {
              const Icon = getIntegrityIcon(rule.title);
              const color = getIntegrityColor(rule.title);
              const colorClasses = {
                emerald: { text: 'text-emerald-400', bullet: 'text-emerald-500', code: 'bg-emerald-500/20 text-emerald-300' },
                amber: { text: 'text-amber-400', bullet: 'text-amber-500', code: 'bg-amber-500/20 text-amber-300' },
                violet: { text: 'text-violet-400', bullet: 'text-violet-500', code: 'bg-violet-500/20 text-violet-300' },
              }[color];
              return (
                <div key={idx} className="bg-[var(--background)]/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('w-4 h-4', colorClasses.text)} />
                    <h4 className={cn('text-sm font-semibold', colorClasses.text)}>{rule.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {rule.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs flex items-start gap-1.5">
                        <span className={cn('mt-0.5', colorClasses.bullet)}>•</span>
                        <span className="text-[var(--muted-foreground)]">
                          {renderCodeInText(item, colorClasses.code)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OtherSectionsSection({ sections }: { sections: DataModelSection[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (sections.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <FileText className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold">Additional Sections</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{sections.length} sections</span>
      </button>
      {isExpanded && (
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div key={idx} className="p-3 bg-[var(--secondary)]/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">{section.title}</h4>
              <MarkdownRenderer content={section.content} className="text-sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StructuredDataModelView({ parsed }: { parsed: ParsedDataModel }) {
  return (
    <div className="space-y-2">
      {/* Metadata */}
      {(parsed.feature || parsed.date) && (
        <div className="flex flex-wrap gap-4 p-3 bg-[var(--secondary)]/30 rounded-lg mb-4">
          {parsed.feature && (
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span className="font-medium">{parsed.feature}</span>
            </div>
          )}
          {parsed.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span>{parsed.date}</span>
            </div>
          )}
        </div>
      )}

      <EntitiesSection entities={parsed.entities} />
      <EnumsSection enums={parsed.enums} />
      <ValidationRulesSection rules={parsed.validationRules} />
      <StateTransitionsSection data={parsed.stateTransitions} />
      <StorageSchemaSection data={parsed.storageSchema} />
      <SortingBehaviorSection behaviors={parsed.sortingBehavior} />
      <FilteringBehaviorSection filters={parsed.filteringBehavior} />
      <SearchBehaviorSection behaviors={parsed.searchBehavior} />
      <DataIntegritySection rules={parsed.dataIntegrity} />
      <OtherSectionsSection sections={parsed.otherSections} />
    </div>
  );
}

export function DataModelViewer({ content, filePath, className }: DataModelViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return parseDataModelAST(content);
  }, [content]);

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <Database className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No data model yet</p>
        <p className="text-sm mt-2">Create a data-model.md file to define data structures</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1 mb-4" role="tablist" aria-label="View mode">
        <button
          onClick={() => setShowRawMarkdown(false)}
          role="tab"
          aria-selected={!showRawMarkdown}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            !showRawMarkdown
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Structured
        </button>
        <button
          onClick={() => setShowRawMarkdown(true)}
          role="tab"
          aria-selected={showRawMarkdown}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            showRawMarkdown
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Markdown
        </button>
      </div>

      {/* Content */}
      {showRawMarkdown ? (
        <pre className="text-sm font-mono whitespace-pre-wrap bg-[var(--secondary)]/30 p-4 rounded-lg overflow-auto">
          {content}
        </pre>
      ) : (
        parsed && <StructuredDataModelView parsed={parsed} />
      )}
    </div>
  );
}
