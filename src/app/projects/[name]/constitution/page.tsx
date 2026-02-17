'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ConstitutionEditor } from '@/components/constitution-editor';

interface Constitution {
  id?: string;
  title?: string;
  content?: string;
  principles?: Array<{ name: string; description: string }>;
  version?: string;
  ratifiedDate?: string;
  lastAmendedDate?: string;
}

export default function ConstitutionPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [constitution, setConstitution] = useState<Constitution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load project and constitution data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get project data
      const projectRes = await fetch(`/api/project/${projectSlug}/data`, { cache: 'no-store' });
      if (!projectRes.ok) {
        throw new Error('Project not found');
      }
      const projectData = await projectRes.json();
      setProjectId(projectData.projectId);
      setProjectName(projectData.name);
      setProjectDescription(projectData.description || '');

      // Get constitution if exists
      if (projectData.constitution?.rawContent) {
        setConstitution({
          title: projectData.constitution.title,
          content: projectData.constitution.rawContent,
          principles: projectData.constitution.principles,
          version: projectData.constitution.version,
          ratifiedDate: projectData.constitution.ratifiedDate,
          lastAmendedDate: projectData.constitution.lastAmendedDate,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [projectSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle save - also update description from principles
  const handleSave = async (data: {
    name?: string;
    principles?: Array<{ name: string; description: string }>;
    additionalSections?: Array<{ name: string; content: string }>;
  }) => {
    if (!projectId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/spec-workflow/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: projectName,
          principles: data.principles,
          additionalSections: data.additionalSections,
          updateDescriptionFromPrinciples: true,  // NEW: Auto-generate description from principles
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save constitution');
      }

      const result = await response.json();
      setConstitution(result.constitution);
      if (result.description) {
        setProjectDescription(result.description);  // NEW: Update description from AI-generated
      }
      setSuccess('Constitution saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle description change - save description without regenerating constitution
  const handleDescriptionChange = async (description: string) => {
    if (!projectId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Simply update project description (no AI regeneration)
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      setProjectDescription(description);
      setSuccess('Description saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update description');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="project" projectName={projectName} projectSlug={projectSlug} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !projectId) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="project" projectName={projectName} projectSlug={projectSlug} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
          <div className="text-destructive">{error}</div>
          <Link href="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="project" projectName={projectName} projectSlug={projectSlug} />
      <div className="container mx-auto py-6 px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href={`/projects/${projectSlug}`} className="hover:text-foreground">{projectName}</Link>
          <span>/</span>
          <span className="text-foreground">Constitution</span>
        </nav>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Constitution</h1>
            <p className="text-muted-foreground mt-1">
              Project principles and guidelines for AI-assisted development
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
            {success}
          </div>
        )}

        {/* Constitution Editor */}
        <ConstitutionEditor
          constitution={constitution}
          projectDescription={projectDescription}
          onDescriptionChange={handleDescriptionChange}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
