'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, BarChart3, AlertCircle, CheckCircle, AlertTriangle, FileText, List, ClipboardCheck, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';
import { STAGES, getStageConfig } from '../base/types';

interface AnalyzeModalProps extends BaseModalProps {
  onGenerateAnalysis?: () => Promise<void>;
}

type AnalyzeStatus = 'idle' | 'generating' | 'ready' | 'error';

type DocType = DocumentType | 'analysis';

interface AnalysisResult {
  specPlanScore?: number;
  planTasksScore?: number;
  constitutionScore?: number;
  isValid?: boolean;
  issues?: Array<{
    severity: string;
    description: string;
    location?: string;
    suggestion?: string;
  }>;
}

// Parse simple analysis from content
function parseAnalysisContent(content: string): AnalysisResult | null {
  const result: AnalysisResult = {
    issues: [],
  };

  // Extract scores
  const scoreMatches = content.match(/\*\*Score\*\*:\s*(\d+)%/g);
  if (scoreMatches) {
    const scores = scoreMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
    if (scores.length >= 1) result.specPlanScore = scores[0];
    if (scores.length >= 2) result.planTasksScore = scores[1];
    if (scores.length >= 3) result.constitutionScore = scores[2];
  }

  // Check validity
  result.isValid = content.includes('✅ Valid') || !content.includes('❌ Issues Found');

  // Extract issues
  const issueMatches = content.matchAll(/(?:🔴|🟡|🔵)\s*\*\*(\w+)\*\*:\s*(.+)/g);
  for (const match of issueMatches) {
    if (match[1] && match[2]) {
      result.issues?.push({
        severity: match[1].toLowerCase(),
        description: match[2],
      });
    }
  }

  return result;
}

export function AnalyzeModal({ feature, onClose, onStageChange, onDelete, onGenerateAnalysis }: AnalyzeModalProps) {
  const [status, setStatus] = useState<AnalyzeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocType>('spec');
  const [localContent, setLocalContent] = useState<string>('');

  // Get project from store
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Check state
  const hasAnalysis = !!feature.analysisContent;
  const hasSpec = !!feature.specContent;
  const hasPlan = !!feature.planContent;
  const hasTasks = !!feature.tasksContent;
  const hasAllDocs = hasSpec && hasPlan && hasTasks;

  // Get next stage config (analyze is the last stage, so no next stage)
  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const hasNextStage = currentIndex >= 0 && currentIndex < STAGES.length - 1;
  const nextStage = hasNextStage ? STAGES[currentIndex + 1] : undefined;
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  // Get available document options
  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  // Get content for selected document
  const selectedDocContent = useMemo(() => {
    if (selectedDoc === 'analysis') return localContent;
    const option = documentOptions.find(o => o.type === selectedDoc);
    return option?.content || null;
  }, [documentOptions, selectedDoc, localContent]);

  // Set initial status
  useEffect(() => {
    if (hasAnalysis) {
      setStatus('ready');
      setLocalContent(feature.analysisContent || '');
    } else if (hasAllDocs) {
      setStatus('idle');
    }
  }, [hasAnalysis, hasAllDocs, feature.analysisContent]);

  // Parse analysis
  const analysis = useMemo(() => {
    if (!localContent) return null;
    return parseAnalysisContent(localContent);
  }, [localContent]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (!analysis) return 0;
    const scores = [
      analysis.specPlanScore || 0,
      analysis.planTasksScore || 0,
      analysis.constitutionScore || 0,
    ].filter(s => s > 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [analysis]);

  // Count issues by severity
  const issueCounts = useMemo(() => {
    if (!analysis?.issues) return { error: 0, warning: 0, info: 0 };
    return {
      error: analysis.issues.filter(i => i.severity === 'error').length,
      warning: analysis.issues.filter(i => i.severity === 'warning').length,
      info: analysis.issues.filter(i => i.severity === 'info').length,
    };
  }, [analysis]);

  const handleGenerateAnalysis = async () => {
    if (!projectId) {
      setError('Project not found');
      setStatus('error');
      return;
    }

    if (!onGenerateAnalysis) {
      // Call API directly
      try {
        setStatus('generating');
        setError(null);

        const response = await fetch('/api/spec-workflow/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            featureId: feature.id,
            specContent: feature.specContent,
            planContent: feature.planContent,
            tasksContent: feature.tasksContent,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate analysis');
        }

        const data = await response.json();
        setLocalContent(data.content);
        setStatus('ready');
        toast.success('Analysis complete');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze');
        setStatus('error');
      }
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      await onGenerateAnalysis();
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
      setStatus('error');
    }
  };

  // Handle "Continue to Next Stage" button click
  const handleContinueToNextStage = () => {
    if (onStageChange && nextStageConfig && nextStage) {
      onStageChange(nextStage.stage as any);
    }
  };

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      onDelete={onDelete}
      headerActions={
        hasAnalysis ? (
          <div className="text-sm text-[var(--foreground)] font-medium">
            Analysis Complete
          </div>
        ) : status !== 'generating' ? (
          <button
            onClick={handleGenerateAnalysis}
            disabled={!hasAllDocs}
            className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Analysis
          </button>
        ) : null
      }
      showNavigation={hasAllDocs}
    >
      <div className="flex h-full">
        {/* Left: Overview & Scores */}
        <div className="w-[35%] border-r border-[var(--border)] p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Analysis Overview
          </h3>

          {!hasAllDocs && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-2">
                Missing Documents
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                You need spec, plan, and tasks to run analysis.
              </p>
            </div>
          )}

          {status === 'generating' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-[var(--foreground)] animate-spin" />
              <p className="text-[var(--foreground)] font-medium">
                Analyzing Documents...
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Checking consistency across spec, plan, and tasks
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-[var(--destructive)] mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-2">
                {error || 'Failed to analyze documents'}
              </p>
              <button
                onClick={handleGenerateAnalysis}
                className="text-sm text-[var(--foreground)] underline hover:opacity-70"
              >
                Try again →
              </button>
            </div>
          )}

          {status === 'idle' && hasAllDocs && !hasAnalysis && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-2">
                Document Analysis
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Run analysis to check consistency between spec, plan, and tasks.
              </p>
            </div>
          )}

          {(status === 'ready' || hasAnalysis) && analysis && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-[var(--muted)]"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${overallScore * 3.02} 302`}
                      strokeLinecap="round"
                      className={cn(
                        "transition-all duration-500",
                        overallScore >= 80 ? "text-[var(--foreground)]" : overallScore >= 50 ? "text-[var(--muted-foreground)]" : "text-[var(--destructive)]"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--foreground)]">
                      {overallScore}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Overall Consistency Score
                </p>
              </div>

              {/* Individual Scores */}
              <div className="space-y-3">
                <ScoreBar
                  label="Spec → Plan"
                  score={analysis.specPlanScore || 0}
                  icon={<FileText className="w-4 h-4" />}
                />
                <ScoreBar
                  label="Plan → Tasks"
                  score={analysis.planTasksScore || 0}
                  icon={<List className="w-4 h-4" />}
                />
                <ScoreBar
                  label="Constitution"
                  score={analysis.constitutionScore || 0}
                  icon={<ClipboardCheck className="w-4 h-4" />}
                />
              </div>

              {/* Issues Summary */}
              {analysis.issues && analysis.issues.length > 0 && (
                <div className="pt-4 border-t border-[var(--border)]">
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
                    Issues Found ({analysis.issues.length})
                  </h4>
                  <div className="flex gap-3">
                    {issueCounts.error > 0 && (
                      <div className="flex items-center gap-1 text-[var(--destructive)]">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{issueCounts.error}</span>
                      </div>
                    )}
                    {issueCounts.warning > 0 && (
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{issueCounts.warning}</span>
                      </div>
                    )}
                    {issueCounts.info > 0 && (
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{issueCounts.info}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Document Viewer & Analysis */}
        <div className="w-[65%] flex flex-col overflow-hidden">
          {/* Document Tabs */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <DocumentSelector
              options={documentOptions}
              selected={selectedDoc === 'analysis' ? 'spec' : selectedDoc}
              onChange={(doc) => setSelectedDoc(doc as DocType)}
            />
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {selectedDocContent ? (
                <MarkdownRenderer content={selectedDocContent} />
              ) : (
                <p className="text-[var(--muted-foreground)]">No content available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

// Score bar component
function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[var(--muted-foreground)]">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--foreground)]">{label}</span>
          <span className={cn(
            "font-medium",
            score >= 80 ? "text-[var(--foreground)]" : score >= 50 ? "text-[var(--muted-foreground)]" : "text-[var(--destructive)]"
          )}>
            {score}%
          </span>
        </div>
        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              score >= 80 ? "bg-[var(--foreground)]" : score >= 50 ? "bg-[var(--muted-foreground)]" : "bg-[var(--destructive)]"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
