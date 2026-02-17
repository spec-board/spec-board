'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader2, Eye, Edit3, RefreshCw, History, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Principle {
  name: string;
  description: string;
}

interface Section {
  name: string;
  content: string;
}

interface ConstitutionVersion {
  id: string;
  version: string;
  content: string;
  principles: Principle[];
  changeType: string;
  changeNote: string | null;
  createdAt: string;
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
  versions?: ConstitutionVersion[] | null;
  onSave: (data: {
    description?: string;
    regenerateWithAI?: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}

export function ConstitutionEditor({
  constitution,
  projectDescription = '',
  versions,
  onSave,
  isSaving,
}: ConstitutionEditorProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'preview' | 'history'>('description');
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
  // Handler: Save description and generate principles
  const handleSaveAndGenerate = async () => {
    if (!description.trim()) return;
    await onSave({ description, regenerateWithAI: true });
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
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === 'history'
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="w-4 h-4 inline-block mr-2" />
          History
          {versions && versions.length > 0 && (
            <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded-full">
              {versions.length}
            </span>
          )}
          {activeTab === 'history' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Description Tab */}
      {activeTab === 'description' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Describe your project. AI will generate principles based on this description.
          </p>

          <div className="p-4 bg-card border border-border rounded-lg space-y-3">
            <h4 className="text-sm font-medium">Project Description</h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm min-h-[120px]"
              placeholder="Describe your project, its goals, and requirements..."
            />

            <button
              onClick={handleSaveAndGenerate}
              disabled={isSaving || !description.trim()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Save & Generate Principles
            </button>
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

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Read-only history of constitution changes. View past versions and their principles.
          </p>

          {versions && versions.length > 0 ? (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="p-4 bg-card border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">v{version.version}</span>
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                          latest
                        </span>
                      )}
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        version.changeType === 'create' && "bg-green-500/20 text-green-500",
                        version.changeType === 'update' && "bg-blue-500/20 text-blue-500",
                        version.changeType === 'minor' && "bg-yellow-500/20 text-yellow-500",
                        version.changeType === 'major' && "bg-red-500/20 text-red-500"
                      )}>
                        {version.changeType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(version.createdAt).toLocaleDateString()} {new Date(version.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {version.changeNote && (
                    <p className="text-sm text-muted-foreground">{version.changeNote}</p>
                  )}

                  {version.principles && version.principles.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Principles at this version:</p>
                      {version.principles.map((principle, pIndex) => (
                        <div key={pIndex} className="text-sm">
                          <span className="font-medium">{principle.name}</span>
                          <p className="text-muted-foreground text-xs mt-0.5">{principle.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No version history yet.</p>
              <p className="text-xs">Save and generate principles to create the first version.</p>
            </div>
          )}
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
