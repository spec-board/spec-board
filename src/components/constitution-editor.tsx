'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader2, Eye, Edit3, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Principle {
  name: string;
  description: string;
}

interface Section {
  name: string;
  content: string;
}

interface ConstitutionEditorProps {
  constitution?: {
    title?: string;
    content?: string;
    principles?: Principle[];
    version?: string;
    ratifiedDate?: string;
    lastAmendedDate?: string;
  } | null;
  projectDescription?: string;
  onSave: (data: {
    description?: string;
    regenerateWithAI?: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}

export function ConstitutionEditor({
  constitution,
  projectDescription = '',
  onSave,
  isSaving,
}: ConstitutionEditorProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'preview'>('description');
  const [description, setDescription] = useState<string>(projectDescription);
  const [principles, setPrinciples] = useState<Principle[]>(constitution?.principles || []);

  // Sync description and principles when parent data changes
  useEffect(() => {
    setDescription(projectDescription);
  }, [projectDescription]);

  useEffect(() => {
    if (constitution?.principles) {
      setPrinciples(constitution.principles);
    }
  }, [constitution?.principles]);

  // Generate markdown preview from current constitution content
  const markdownContent = useMemo(() => {
    return constitution?.content || generateConstitutionMarkdown(
      constitution?.title || 'Project Constitution',
      principles,
      []
    );
  }, [constitution?.content, constitution?.title, principles]);

  // Handler: Save description and regenerate principles with AI
  const handleRegenerate = async () => {
    if (!description.trim()) return;
    await onSave({ description, regenerateWithAI: true });
  };

  // Handler: Just save description without regeneration
  const handleSaveDescription = async () => {
    if (description === projectDescription) return;
    await onSave({ description, regenerateWithAI: false });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('description')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === 'description'
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Edit3 className="w-4 h-4 inline-block mr-2" />
          Description
          {activeTab === 'description' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === 'preview'
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="w-4 h-4 inline-block mr-2" />
          Preview
          {activeTab === 'preview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Description Tab */}
      {activeTab === 'description' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Describe your project. When you save, AI will generate principles based on this description.
          </p>

          <div className="p-4 bg-card border border-border rounded-lg space-y-3">
            <h4 className="text-sm font-medium">Project Description</h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm min-h-[120px]"
              placeholder="Describe your project, its goals, and requirements..."
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isSaving || !description.trim()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerate Principles
              </button>
              <button
                onClick={handleSaveDescription}
                disabled={isSaving || description === projectDescription}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Only
              </button>
            </div>
          </div>

          {/* Current Principles Display (Read-only) */}
          {principles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Current Principles (Read-only)</h4>
              {principles.map((principle, index) => (
                <div
                  key={index}
                  className="p-4 bg-card border border-border rounded-lg"
                >
                  <h5 className="font-medium">{principle.name}</h5>
                  <p className="text-sm text-muted-foreground mt-1">{principle.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Live preview of the constitution markdown.
          </p>

          <div className="p-4 bg-card border border-border rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">{markdownContent}</pre>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(markdownContent)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}

function generateConstitutionMarkdown(
  projectName: string,
  principles: Principle[],
  sections: Section[]
): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${projectName}\n\n`;
  content += `**Version**: 1.0.0 | **Ratified**: ${date} | **Last Amended**: ${date}\n\n`;

  content += `## Core Principles\n\n`;
  for (const principle of principles) {
    content += `### ${principle.name}\n\n`;
    content += `${principle.description}\n\n`;
  }

  if (sections?.length) {
    for (const section of sections) {
      content += `## ${section.name}\n\n`;
      content += `${section.content}\n\n`;
    }
  }

  content += `## Governance\n\n`;
  content += `- This constitution supersedes all other practices\n`;
  content += `- Amendments require documentation and approval\n`;
  content += `- All PRs must verify compliance with principles\n`;
  content += `- Complexity must be justified\n\n`;

  content += `---\n\n`;
  content += `*This constitution was generated by SpecBoard*\n`;

  return content;
}
