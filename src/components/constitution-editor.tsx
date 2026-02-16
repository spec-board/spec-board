'use client';

import { useState, useMemo } from 'react';
import { Loader2, Sparkles, Plus, Trash2, GripVertical, Eye, Edit3, Save } from 'lucide-react';
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
  onSave: (data: {
    name?: string;
    principles?: Principle[];
    additionalSections?: Section[];
  }) => Promise<void>;
  onAIGenerate?: () => Promise<void>;
  isSaving: boolean;
}

export function ConstitutionEditor({
  constitution,
  onSave,
  onAIGenerate,
  isSaving,
}: ConstitutionEditorProps) {
  const [activeTab, setActiveTab] = useState<'principles' | 'sections' | 'preview'>('principles');
  const [principles, setPrinciples] = useState<Principle[]>(
    constitution?.principles || getDefaultPrinciples()
  );
  const [sections, setSections] = useState<Section[]>([]);
  const [newPrincipleName, setNewPrincipleName] = useState('');
  const [newPrincipleDesc, setNewPrincipleDesc] = useState('');
  const [editingPrinciple, setEditingPrinciple] = useState<number | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');

  // Generate markdown preview
  const markdownContent = useMemo(() => {
    return generateConstitutionMarkdown(
      constitution?.title || 'Project Constitution',
      principles,
      sections
    );
  }, [constitution?.title, principles, sections]);

  // Handlers
  const handleAddPrinciple = () => {
    if (newPrincipleName.trim() && newPrincipleDesc.trim()) {
      setPrinciples([...principles, { name: newPrincipleName, description: newPrincipleDesc }]);
      setNewPrincipleName('');
      setNewPrincipleDesc('');
    }
  };

  const handleDeletePrinciple = (index: number) => {
    setPrinciples(principles.filter((_, i) => i !== index));
  };

  const handleUpdatePrinciple = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...principles];
    updated[index] = { ...updated[index], [field]: value };
    setPrinciples(updated);
  };

  const handleAddSection = () => {
    if (newSectionName.trim() && newSectionContent.trim()) {
      setSections([...sections, { name: newSectionName, content: newSectionContent }]);
      setNewSectionName('');
      setNewSectionContent('');
    }
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await onSave({ principles, additionalSections: sections });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('principles')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === 'principles'
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Edit3 className="w-4 h-4 inline-block mr-2" />
          Principles
          {activeTab === 'principles' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === 'sections'
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Edit3 className="w-4 h-4 inline-block mr-2" />
          Sections
          {activeTab === 'sections' && (
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

        <div className="ml-auto flex items-center gap-2">
          {onAIGenerate && (
            <button
              onClick={onAIGenerate}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              AI Suggest
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Principles Tab */}
      {activeTab === 'principles' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Core principles that guide AI-assisted development for this project.
          </p>

          {/* Principles List */}
          <div className="space-y-3">
            {principles.map((principle, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab mt-1" />
                <div className="flex-1 space-y-2">
                  {editingPrinciple === index ? (
                    <>
                      <input
                        type="text"
                        value={principle.name}
                        onChange={(e) => handleUpdatePrinciple(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                        placeholder="Principle name"
                      />
                      <textarea
                        value={principle.description}
                        onChange={(e) => handleUpdatePrinciple(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm min-h-[80px]"
                        placeholder="Principle description"
                      />
                    </>
                  ) : (
                    <>
                      <h4 className="font-medium">{principle.name}</h4>
                      <p className="text-sm text-muted-foreground">{principle.description}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingPrinciple(editingPrinciple === index ? null : index)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePrinciple(index)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Principle */}
          <div className="p-4 bg-card border border-dashed border-border rounded-lg space-y-3">
            <h4 className="text-sm font-medium">Add New Principle</h4>
            <input
              type="text"
              value={newPrincipleName}
              onChange={(e) => setNewPrincipleName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              placeholder="Principle name (e.g., 'I. Test-First Development')"
            />
            <textarea
              value={newPrincipleDesc}
              onChange={(e) => setNewPrincipleDesc(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm min-h-[80px]"
              placeholder="Principle description"
            />
            <button
              onClick={handleAddPrinciple}
              disabled={!newPrincipleName.trim() || !newPrincipleDesc.trim()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Principle
            </button>
          </div>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Additional sections beyond the core principles.
          </p>

          {/* Sections List */}
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={index}
                className="p-4 bg-card border border-border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{section.name}</h4>
                  <button
                    onClick={() => handleDeleteSection(index)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Add New Section */}
          <div className="p-4 bg-card border border-dashed border-border rounded-lg space-y-3">
            <h4 className="text-sm font-medium">Add New Section</h4>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              placeholder="Section name (e.g., 'Governance')"
            />
            <textarea
              value={newSectionContent}
              onChange={(e) => setNewSectionContent(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm min-h-[100px]"
              placeholder="Section content"
            />
            <button
              onClick={handleAddSection}
              disabled={!newSectionName.trim() || !newSectionContent.trim()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
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

function getDefaultPrinciples(): Principle[] {
  return [
    {
      name: 'I. Test-First Development',
      description: 'All new features must have tests written before implementation. Use TDD for critical paths. Red-Green-Refactor cycle is mandatory.',
    },
    {
      name: 'II. Simplicity',
      description: 'Start with the simplest solution that works. Avoid premature optimization. YAGNI - You aren\'t gonna need it.',
    },
    {
      name: 'III. Accessibility',
      description: 'All UI components must meet WCAG 2.2 AA standards. Keyboard navigation is required for all interactive elements.',
    },
    {
      name: 'IV. Type Safety',
      description: 'Use TypeScript strict mode. No any types. All functions must have return types. Prefer interfaces over types.',
    },
    {
      name: 'V. Code Review',
      description: 'All changes require review before merge. Follow conventional commits. Keep PRs small and focused.',
    },
  ];
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
