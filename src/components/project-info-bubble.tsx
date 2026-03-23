'use client';

import { useState, useRef, useEffect } from 'react';
import { cn, formatRelativeTime, formatLocaleDate } from '@/lib/utils';
import type { Constitution, Feature } from '@/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import {
  MessageCircleQuestion,
  ChevronDown,
  ChevronRight,
  Shield,
  Calendar,
  Tag,
  FileText,
  X,
  GitBranch,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Wand2,
  ScrollText,
  Settings,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';

interface ProjectInfoBubbleProps {
  constitution: Constitution | null;
  hasConstitution: boolean;
  description?: string;
  features: Feature[];
  totalClarifications: number;
  onDescriptionChange?: (description: string) => void | Promise<void>;
  onFeatureClick?: (feature: Feature) => void;
  onSaveAndGenerateConstitution?: (description: string) => void | Promise<void>;
  isGeneratingConstitution?: boolean;
}

export function ProjectInfoBubble({
  constitution,
  hasConstitution,
  description,
  features,
  totalClarifications,
  onDescriptionChange,
  onFeatureClick,
  onSaveAndGenerateConstitution,
  isGeneratingConstitution = false,
}: ProjectInfoBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [editDescription, setEditDescription] = useState(description || '');
  const [showAIConfigDialog, setShowAIConfigDialog] = useState(false);
  const { aiSettings, openSettings } = useSettingsStore();

  useEffect(() => {
    if (isOpen) {
      setEditDescription(description || '');
      setActiveTab('info');
    }
  }, [isOpen, description]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowAIConfigDialog(false);
      }
    }
    if (isOpen || showAIConfigDialog) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, showAIConfigDialog]);

  const handleSaveAndGenerate = async () => {
    // Check if AI provider is configured before proceeding
    if (!aiSettings.hasApiKey && !aiSettings.apiKey) {
      setShowAIConfigDialog(true);
      return;
    }
    // Save description first, then generate constitution
    // Both operations update the description in the database
    await onDescriptionChange?.(editDescription);
    await onSaveAndGenerateConstitution?.(editDescription);
  };

  const principleCount = constitution?.principles?.length ?? 0;
  const featuresWithClarifications = features.filter(f => f.totalClarifications > 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--secondary)] border border-[var(--border)] hover:bg-[var(--secondary)]/80 transition-colors text-sm text-[var(--foreground)]"
      >
        <Info className="w-4 h-4" />
        <span className="text-[var(--muted-foreground)]">Project Info</span>
        <ChevronDown className={cn('w-4 h-4 text-[var(--muted-foreground)]', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setIsOpen(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-10" onClick={e => e.stopPropagation()}>
            <div className="relative flex items-center justify-center border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-semibold">Project Info</h2>
              <button onClick={() => setIsOpen(false)} className="absolute right-4 p-1 hover:bg-[var(--secondary)] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-[var(--border)]">
              <button
                onClick={() => setActiveTab('info')}
                className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors', activeTab === 'info' ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}
              >
                Project Info
              </button>
              {hasConstitution && (
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors', activeTab === 'history' ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')}
                >
                  Constitution History
                  {constitution?.version && <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--secondary)]">v{constitution.version}</span>}
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Project Description - Always visible as textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Project Description <span className="text-[var(--foreground)]">*</span></h3>
                    </div>
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Describe your project goals, tech stack, and key requirements. This will be used to generate the project Constitution."
                      className="w-full h-32 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] outline-none focus:border-[var(--ring)] resize-none text-sm placeholder:text-[var(--muted-foreground)]"
                    />
                    {onSaveAndGenerateConstitution && (
                      <button
                        onClick={handleSaveAndGenerate}
                        disabled={!editDescription.trim() || isGeneratingConstitution}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--primary-foreground)] rounded-lg text-sm font-medium transition-colors"
                      >
                        {isGeneratingConstitution ? (
                          <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating Constitution...
                          </>
                        ) : (
                          <>
                            Save & Generate Constitution
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Constitution - Principles & Version */}
                  {hasConstitution && constitution && (
                    <ConstitutionContent constitution={constitution} />
                  )}
                </div>
              )}
              {activeTab === 'history' && hasConstitution && constitution && (
                <ConstitutionHistory constitution={constitution} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Provider not configured dialog */}
      {showAIConfigDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md mx-4 shadow-2xl">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[var(--foreground)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  AI Provider Required
                </h3>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                To generate the project Constitution, you need to configure an AI provider with a valid API key in Settings first.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2">
              <button
                onClick={() => setShowAIConfigDialog(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAIConfigDialog(false);
                  setIsOpen(false);
                  openSettings('ai');
                }}
                className="btn btn-primary btn-sm"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConstitutionContent({ constitution }: { constitution: Constitution }) {
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const togglePrinciple = (index: number) => {
    const newExpanded = new Set(expandedPrinciples);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedPrinciples(newExpanded);
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedSections(newExpanded);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Version display */}
      {constitution.version && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Constitution</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--foreground)]">v{constitution.version}</span>
        </div>
      )}
      {(constitution.ratifiedDate || constitution.lastAmendedDate) && (
        <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
          {constitution.ratifiedDate && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /><span>Ratified: {formatLocaleDate(constitution.ratifiedDate)}</span></div>}
          {constitution.lastAmendedDate && <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /><span>Last Amended: {formatLocaleDate(constitution.lastAmendedDate)}</span></div>}
        </div>
      )}
      {/* Project Description */}
      {constitution.description && (
        <div>
          <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Project Description</h4>
          <p className="text-sm bg-[var(--secondary)]/30 p-3 rounded-lg">{constitution.description}</p>
        </div>
      )}
      {constitution.principles?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--muted-foreground)]" />Core Principles</h4>
          <div className="space-y-2">
            {constitution.principles.map((principle, index) => (
              <div key={index} className="rounded-lg border border-[var(--border)] overflow-hidden">
                <button onClick={() => togglePrinciple(index)} className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors text-left">
                  <span className="font-medium text-sm">{principle.name}</span>
                  {expandedPrinciples.has(index) ? <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />}
                </button>
                {expandedPrinciples.has(index) && principle.description && <div className="px-3 pb-3 text-sm"><MarkdownRenderer content={principle.description} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {constitution.sections?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--muted-foreground)]" />Additional Sections</h4>
          <div className="space-y-2">
            {constitution.sections.map((section, index) => (
              <div key={index} className="rounded-lg border border-[var(--border)] overflow-hidden">
                <button onClick={() => toggleSection(index)} className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors text-left">
                  <span className="font-medium text-sm">{section.name}</span>
                  {expandedSections.has(index) ? <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />}
                </button>
                {expandedSections.has(index) && section.content && <div className="px-3 pb-3 text-sm"><MarkdownRenderer content={section.content} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConstitutionHistory({ constitution }: { constitution: Constitution }) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleVersion = (id: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedVersions(newExpanded);
  };

  // Build version history from constitution data - use versions array from API if available
  const versions = constitution.versions && constitution.versions.length > 0
    ? constitution.versions.map(v => ({
        id: v.id,
        version: v.version,
        date: v.createdAt,
        type: v.changeType === 'create' ? 'Initial' : v.changeType === 'major' ? 'Major' : v.changeType === 'minor' ? 'Minor' : 'Amendment',
        projectDescription: v.description,
        content: v.content,
        principles: v.principles,
        changeNote: v.changeNote,
      }))
    : constitution.version
      ? [{
          id: 'current',
          version: constitution.version,
          date: constitution.lastAmendedDate || constitution.ratifiedDate || 'Unknown',
          type: constitution.ratifiedDate === constitution.lastAmendedDate ? 'Initial' : 'Amendment',
          projectDescription: constitution.description,
          content: constitution.rawContent,
          principles: constitution.principles,
          changeNote: undefined,
        }]
      : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Constitution Version History</h3>
        <span className="text-xs px-2 py-1 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {versions.length > 0 ? (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="rounded-lg border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => toggleVersion(v.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">v{v.version}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]">{v.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">{formatRelativeTime(v.date)}</span>
                  {expandedVersions.has(v.id) ? (
                    <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                  )}
                </div>
              </button>
              {expandedVersions.has(v.id) && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Project Description at this version */}
                  {v.projectDescription && (
                    <div>
                      <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Project Description</h4>
                      <p className="text-sm text-[var(--foreground)] bg-[var(--secondary)]/30 p-2 rounded">
                        {v.projectDescription}
                      </p>
                    </div>
                  )}
                  {/* Change note if available */}
                  {v.changeNote && (
                    <div>
                      <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Change Note</h4>
                      <p className="text-sm text-[var(--foreground)] bg-[var(--secondary)]/30 p-2 rounded">
                        {v.changeNote}
                      </p>
                    </div>
                  )}
                  {/* Principles from this version */}
                  {v.principles && v.principles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Principles ({v.principles.length})</h4>
                      <ul className="text-sm space-y-1">
                        {v.principles.map((p: any, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <Shield className="w-3.5 h-3.5 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                            <span>{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">No version history available.</p>
      )}

      {constitution.syncImpactReport && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--secondary)]/50">
          <h4 className="text-xs font-medium mb-2">Sync Impact Report</h4>
          {constitution.syncImpactReport.versionChange && (
            <p className="text-sm text-[var(--muted-foreground)]">{constitution.syncImpactReport.versionChange}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ClarityContent({ features, onFeatureClick }: { features: Feature[]; onFeatureClick?: (feature: Feature) => void }) {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleFeature = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) newExpanded.delete(featureId);
    else newExpanded.add(featureId);
    setExpandedFeatures(newExpanded);
  };

  const toggleSession = (sessionKey: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionKey)) newExpanded.delete(sessionKey);
    else newExpanded.add(sessionKey);
    setExpandedSessions(newExpanded);
  };

  return (
    <div className="divide-y divide-[var(--border)]">
      {features.map((feature) => (
        <div key={feature.id}>
          <div className="flex items-center justify-between p-3 hover:bg-[var(--secondary)] transition-colors">
            <button onClick={() => toggleFeature(feature.id)} className="flex items-center gap-2 flex-1 min-w-0">
              {expandedFeatures.has(feature.id) ? <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />}
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-sm capitalize truncate">{feature.name}</span>
                {feature.branch && <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><GitBranch className="w-3 h-3" /><span className="truncate">{feature.branch}</span></span>}
              </div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--muted-foreground)]">{feature.totalClarifications} Q&A</span>
              <button onClick={() => onFeatureClick?.(feature)} className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors" title="Open feature details">
                <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>
          {expandedFeatures.has(feature.id) && (
            <div className="pl-6 pr-3 pb-3">
              {feature.clarificationSessions.map((session) => {
                const sessionKey = `${feature.id}-${session.date}`;
                return (
                  <div key={sessionKey} className="mt-2 rounded-lg border border-[var(--border)] overflow-hidden">
                    <button onClick={() => toggleSession(sessionKey)} className="w-full flex items-center justify-between p-2 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)] transition-colors">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        <span className="text-[var(--muted-foreground)]">{formatRelativeTime(session.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">{session.clarifications.length} Q&A</span>
                        {expandedSessions.has(sessionKey) ? <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />}
                      </div>
                    </button>
                    {expandedSessions.has(sessionKey) && (
                      <div className="p-2 space-y-2">
                        {session.clarifications.map((qa, qaIndex) => (
                          <div key={qaIndex} className="rounded-lg bg-[var(--secondary)]/20 p-2 text-sm">
                            <div className="flex items-start gap-2"><HelpCircle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" /><p className="text-[var(--muted-foreground)]">{qa.question}</p></div>
                            <div className="flex items-start gap-2 mt-2 pl-6"><CheckCircle2 className="w-4 h-4 text-[var(--foreground)] mt-0.5 flex-shrink-0" /><p className="text-[var(--foreground)]">{qa.answer}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
