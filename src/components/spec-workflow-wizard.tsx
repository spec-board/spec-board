'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Loader2,
  FileText,
  HelpCircle,
  Map,
  ListTodo,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type WorkflowStep = 'specify' | 'clarify' | 'plan' | 'tasks' | 'analyze' | 'complete';

interface SpecWorkflowWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectPath?: string | null;
  onFeatureCreated?: (feature: { id: string; featureId: string; name: string }) => void;
}

const STEPS: { id: WorkflowStep; label: string; icon: typeof FileText }[] = [
  { id: 'specify', label: 'Specify', icon: FileText },
  { id: 'clarify', label: 'Clarify', icon: HelpCircle },
  { id: 'plan', label: 'Plan', icon: Map },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'analyze', label: 'Analyze', icon: CheckCircle2 },
];

export function SpecWorkflowWizard({
  isOpen,
  onClose,
  projectId,
  projectPath,
  onFeatureCreated
}: SpecWorkflowWizardProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('specify');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [featureName, setFeatureName] = useState('');
  const [description, setDescription] = useState('');

  // Generated content
  const [specContent, setSpecContent] = useState('');
  const [clarificationQuestions, setClarificationQuestions] = useState<{ question: string; answer: string }[]>([]);
  const [planContent, setPlanContent] = useState('');
  const [tasksContent, setTasksContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Feature created
  const [createdFeature, setCreatedFeature] = useState<{ id: string; featureId: string; name: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      resetState();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const resetState = () => {
    setCurrentStep('specify');
    setFeatureName('');
    setDescription('');
    setSpecContent('');
    setClarificationQuestions([]);
    setPlanContent('');
    setTasksContent('');
    setAnalysisResult(null);
    setCreatedFeature(null);
    setError(null);
  };

  const getStepIndex = (step: WorkflowStep) => STEPS.findIndex(s => s.id === step);

  const canProceed = () => {
    switch (currentStep) {
      case 'specify':
        return featureName.trim() && description.trim();
      case 'clarify':
        return true; // Can skip clarifications
      case 'plan':
        return !!specContent;
      case 'tasks':
        return !!planContent;
      case 'analyze':
        return !!tasksContent;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setError(null);

    try {
      switch (currentStep) {
        case 'specify':
          await handleSpecify();
          break;
        case 'clarify':
          await handleClarify();
          break;
        case 'plan':
          await handlePlan();
          break;
        case 'tasks':
          await handleTasks();
          break;
        case 'analyze':
          await handleAnalyze();
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSpecify = async () => {
    setIsLoading(true);

    const response = await fetch('/api/spec-workflow/specify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: featureName.trim(),
        description: description.trim()
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate spec');
    }

    const data = await response.json();
    setSpecContent(data.content);

    // Also generate clarification questions
    const clarifyResponse = await fetch('/api/spec-workflow/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specContent: data.content })
    });

    if (clarifyResponse.ok) {
      const clarifyData = await clarifyResponse.json();
      setClarificationQuestions(clarifyData.questions.map((q: any) => ({ question: q.question, answer: '' })));
    }

    setCurrentStep('clarify');
    setIsLoading(false);
  };

  const handleClarify = async () => {
    setIsLoading(true);
    setCurrentStep('plan');
    setIsLoading(false);
  };

  const handlePlan = async () => {
    setIsLoading(true);

    const response = await fetch('/api/spec-workflow/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: featureName.trim(),
        specContent,
        clarifications: clarificationQuestions.filter(q => q.answer)
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate plan');
    }

    const data = await response.json();
    setPlanContent(data.content);
    setCurrentStep('tasks');
    setIsLoading(false);
  };

  const handleTasks = async () => {
    setIsLoading(true);

    const response = await fetch('/api/spec-workflow/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: featureName.trim(),
        specContent,
        planContent
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate tasks');
    }

    const data = await response.json();
    setTasksContent(data.content);
    setCurrentStep('analyze');
    setIsLoading(false);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);

    const response = await fetch('/api/spec-workflow/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specContent,
        planContent,
        tasksContent
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to analyze');
    }

    const data = await response.json();
    setAnalysisResult(data.analysis);
    setCurrentStep('complete');
    setIsLoading(false);
  };

  const handleFinish = () => {
    toast.success('Feature workflow completed', {
      description: `Created "${featureName}" with spec, plan, and tasks`
    });

    onFeatureCreated?.(createdFeature || {
      id: '',
      featureId: '',
      name: featureName
    });
    onClose();
  };

  const handleBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-[var(--card)] rounded-lg shadow-xl',
          'border border-[var(--border)] overflow-hidden',
          'w-full max-w-4xl max-h-[90vh] flex flex-col'
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Spec Workflow
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              specify → clarify → plan → tasks → analyze
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mt-4 px-2">
            {STEPS.map((step, index) => {
              const currentIndex = getStepIndex(currentStep);
              const isActive = step.id === currentStep;
              const isCompleted = index < currentIndex || currentStep === 'complete';

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        isCompleted && 'bg-green-500/20 text-green-500',
                        isActive && 'bg-[var(--primary)] text-[var(--primary-foreground)]',
                        !isActive && !isCompleted && 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <span className={cn(
                      'text-xs mt-1',
                      isActive ? 'text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)]'
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'w-8 h-0.5 mx-1',
                      index < currentIndex ? 'bg-green-500' : 'bg-[var(--border)]'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {currentStep === 'specify' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                  Feature Name *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="e.g., User Authentication"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)]',
                    'outline-none focus:border-[var(--ring)] transition-colors'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                  Description / PRD *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this feature should do..."
                  rows={6}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)]',
                    'outline-none focus:border-[var(--ring)] transition-colors resize-none'
                  )}
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  AI will generate spec, plan, and tasks based on this description
                </p>
              </div>
            </div>
          )}

          {currentStep === 'clarify' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                <h3 className="font-medium text-[var(--foreground)] flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generated Spec
                </h3>
                <pre className="mt-2 text-xs text-[var(--muted-foreground)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {specContent.slice(0, 1000)}...
                </pre>
              </div>

              {clarificationQuestions.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-[var(--foreground)] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Clarification Questions
                  </h3>
                  {clarificationQuestions.map((q, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm text-[var(--foreground)]">{q.question}</p>
                      <input
                        type="text"
                        value={q.answer}
                        onChange={(e) => {
                          const updated = [...clarificationQuestions];
                          updated[index].answer = e.target.value;
                          setClarificationQuestions(updated);
                        }}
                        placeholder="Your answer..."
                        className={cn(
                          'w-full px-3 py-2 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)] text-sm',
                          'outline-none focus:border-[var(--ring)]'
                        )}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-[var(--muted-foreground)]">
                    You can skip clarifications by clicking "Continue to Plan"
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No clarification questions generated. Click continue to proceed.
                </p>
              )}
            </div>
          )}

          {currentStep === 'plan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h3 className="font-medium text-[var(--foreground)] flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Generated Technical Plan
                </h3>
                <pre className="mt-2 text-xs text-[var(--muted-foreground)] whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {planContent}
                </pre>
              </div>
            </div>
          )}

          {currentStep === 'tasks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <h3 className="font-medium text-[var(--foreground)] flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Generated Tasks
                </h3>
                <pre className="mt-2 text-xs text-[var(--muted-foreground)] whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {tasksContent}
                </pre>
              </div>
            </div>
          )}

          {currentStep === 'analyze' && (
            <div className="space-y-4">
              {analysisResult && (
                <>
                  <div className={cn(
                    'p-4 rounded-lg border',
                    analysisResult.isValid
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  )}>
                    <h3 className="font-medium text-[var(--foreground)] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Analysis Result: {analysisResult.isValid ? 'Valid' : 'Has Issues'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-[var(--secondary)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Spec → Plan</p>
                      <p className="text-lg font-medium text-[var(--foreground)]">
                        {analysisResult.specPlanConsistency?.score || 0}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--secondary)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Plan → Tasks</p>
                      <p className="text-lg font-medium text-[var(--foreground)]">
                        {analysisResult.planTasksConsistency?.score || 0}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--secondary)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Constitution</p>
                      <p className="text-lg font-medium text-[var(--foreground)]">
                        {analysisResult.constitutionAlignment?.score || 100}%
                      </p>
                    </div>
                  </div>

                  {analysisResult.issues?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-[var(--foreground)]">Issues Found</h4>
                      {analysisResult.issues.map((issue: any, index: number) => (
                        <div
                          key={index}
                          className={cn(
                            'p-3 rounded-lg text-sm',
                            issue.severity === 'error' && 'bg-red-500/10 text-red-400',
                            issue.severity === 'warning' && 'bg-yellow-500/10 text-yellow-400',
                            issue.severity === 'info' && 'bg-blue-500/10 text-blue-400'
                          )}
                        >
                          <span className="uppercase text-xs font-medium">{issue.severity}: </span>
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Workflow Complete!
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                Successfully generated spec, plan, and tasks for "{featureName}"
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  Spec
                </div>
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  Plan
                </div>
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  Tasks
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-4 border-t border-[var(--border)]">
          {currentStep !== 'specify' && currentStep !== 'complete' && (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)]"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {currentStep !== 'complete' && (
            <button
              onClick={handleNext}
              disabled={isLoading || !canProceed()}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium',
                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentStep === 'analyze' ? 'Finish' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {currentStep === 'complete' && (
            <button
              onClick={handleFinish}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium',
                'bg-green-500 hover:bg-green-500/90 text-white'
              )}
            >
              Done
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
