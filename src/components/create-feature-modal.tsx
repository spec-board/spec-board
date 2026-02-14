'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, FileText, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  onFeatureCreated?: (featureId: string) => void;
}

type GenerationMode = 'user-stories' | 'full-spec-kit';

export function CreateFeatureModal({
  isOpen,
  onClose,
  projectPath,
  onFeatureCreated
}: CreateFeatureModalProps) {
  const [featureName, setFeatureName] = useState('');
  const [prdContent, setPRDContent] = useState('');
  const [mode, setMode] = useState<GenerationMode>('full-spec-kit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    spec?: string;
    plan?: string;
    tasks?: string;
    userStories?: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setFeatureName('');
      setPRDContent('');
      setGeneratedContent(null);
      setError(null);
      setShowPreview(false);

      // Focus name input
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prdContent.trim()) {
      setError('Please enter PRD content');
      return;
    }

    if (!featureName.trim()) {
      setError('Please enter a feature name');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/prd-to-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prdContent,
          projectPath,
          featureName,
          generateFullSpecKit: mode === 'full-spec-kit'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setGeneratedContent(data.files || { userStories: data.userStories });
      setShowPreview(true);

      // Show success toast
      if (mode === 'full-specKit') {
        toast.success('Spec-Kit generated successfully!', {
          description: `Created ${data.featureId} with spec.md, plan.md, and tasks.md`
        });
      } else {
        toast.success('User stories generated!', {
          description: `Created ${data.userStories?.length || 0} user stories`
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error('Generation failed', {
        description: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    // If full spec-kit, the files are already saved by the API
    // If user-stories only, we need to save them
    if (generatedContent.spec) {
      // Already saved by API
      onFeatureCreated?.(featureName);
      handleClose();
    } else {
      // TODO: Implement save for user-stories only mode
      handleClose();
    }
  };

  const handleClose = () => {
    setFeatureName('');
    setPRDContent('');
    setGeneratedContent(null);
    setError(null);
    setShowPreview(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-[var(--card)] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh]',
          'overflow-hidden flex flex-col border border-[var(--border)]'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-feature-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2
                  id="create-feature-title"
                  className="text-xl font-semibold text-[var(--foreground)]"
                >
                  Create Feature from PRD
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Enter a product requirement to generate spec-kit files
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-md hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {!showPreview ? (
            <>
              {/* Feature Name */}
              <div>
                <label htmlFor="feature-name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Feature Name
                </label>
                <input
                  ref={nameInputRef}
                  id="feature-name"
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="e.g., User Authentication, Payment Integration"
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Generation Mode */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Generation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('full-spec-kit')}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      mode === 'full-spec-kit'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={cn('w-4 h-4', mode === 'full-spec-kit' ? 'text-blue-500' : 'text-[var(--muted-foreground)]')} />
                      <span className="font-medium text-[var(--foreground)]">Full Spec-Kit</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Generate spec.md, plan.md, tasks.md
                    </p>
                  </button>

                  <button
                    onClick={() => setMode('user-stories')}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      mode === 'user-stories'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className={cn('w-4 h-4', mode === 'user-stories' ? 'text-blue-500' : 'text-[var(--muted-foreground)]')} />
                      <span className="font-medium text-[var(--foreground)]">User Stories Only</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Generate only user stories
                    </p>
                  </button>
                </div>
              </div>

              {/* PRD Input */}
              <div>
                <label htmlFor="prd-content" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Product Requirement Document (PRD)
                </label>
                <textarea
                  ref={textareaRef}
                  id="prd-content"
                  value={prdContent}
                  onChange={(e) => setPRDContent(e.target.value)}
                  placeholder="Paste your PRD content here. Include:&#10;- Feature description&#10;- User requirements&#10;- Acceptance criteria&#10;- Technical considerations"
                  className="w-full h-64 px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  disabled={isGenerating}
                />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  The more detailed your PRD, the better the generated spec-kit
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prdContent.trim() || !featureName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate {mode === 'full-spec-kit' ? 'Spec-Kit' : 'User Stories'}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-[var(--foreground)]">Generated Content</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Regenerate
                  </button>
                </div>

                {/* Generated files preview */}
                {generatedContent?.spec && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">spec.md created</span>
                    </div>
                    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="bg-[var(--secondary)] px-4 py-2 font-medium text-sm text-[var(--foreground)] border-b border-[var(--border)]">
                        spec.md - User Stories
                      </div>
                      <div className="p-4 max-h-48 overflow-auto text-sm text-[var(--foreground)] whitespace-pre-wrap">
                        {generatedContent.spec.substring(0, 500)}...
                      </div>
                    </div>
                  </div>
                )}

                {generatedContent?.plan && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">plan.md created</span>
                    </div>
                  </div>
                )}

                {generatedContent?.tasks && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">tasks.md created</span>
                    </div>
                  </div>
                )}

                {generatedContent?.userStories && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-[var(--foreground)]">Generated User Stories</h4>
                    <div className="space-y-2">
                      {generatedContent.userStories.map((story: any, idx: number) => (
                        <div key={idx} className="p-3 bg-[var(--secondary)] rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-[var(--foreground)]">
                              {story.id}: {story.title}
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              story.priority === 'P1' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              story.priority === 'P2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            )}>
                              {story.priority}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {story.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 rounded-lg transition-colors"
                >
                  Edit & Regenerate
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save to Project
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
