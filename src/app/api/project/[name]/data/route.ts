import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Parse checklist progress from markdown content
 * Returns { completed, total } counts
 */
function parseChecklistProgress(content: string | null): { completed: number; total: number } | null {
  if (!content) return null;

  const checkedMatches = content.match(/- \[x\]/gi);
  const uncheckedMatches = content.match(/- \[ \]/gi);

  const completed = checkedMatches?.length || 0;
  const total = completed + (uncheckedMatches?.length || 0);

  if (total === 0) return null;

  return { completed, total };
}

/**
 * GET /api/project/[name]/data
 * Returns project data - features from DB or filesystem,
 * constitution always from database.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    // Get project from database
    const project = await prisma.project.findUnique({
      where: { name },
      include: {
        features: {
          orderBy: { order: 'asc' },
          include: {
            userStories: {
              orderBy: { order: 'asc' },
            },
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                userStory: true,
              },
            },
            constitutionVersion: true,
          },
        },
        constitution: {
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Transform database features to frontend format
    const features = project.features.map((feature) => ({
      id: feature.id,  // Use database UUID for API operations
      featureId: feature.featureId,  // Keep featureId for display purposes
      name: feature.name || feature.featureId,  // Use name or fallback to featureId
      path: '', // No filesystem path for database-first
      stage: feature.stage,
      hasSpec: !!feature.specContent,
      hasClarifications: !!feature.clarificationsContent,
      hasPlan: !!feature.planContent,
      hasTasks: !!feature.tasksContent,
      description: feature.description,
      constitutionVersion: feature.constitutionVersion ? {
        id: feature.constitutionVersion.id,
        version: feature.constitutionVersion.version,
        content: feature.constitutionVersion.content,
        principles: feature.constitutionVersion.principles,
      } : null,
      // Map tasks from database format
      tasks: feature.tasks.map((task) => ({
        id: task.taskId,
        dbId: task.id, // Database UUID for API calls
        description: task.title,
        completed: task.status === 'completed',
        parallel: false,
        userStory: task.userStory?.storyId,
        filePath: null,
      })),
      phases: [],
      totalTasks: feature.tasks.length,
      completedTasks: feature.tasks.filter((t) => t.status === 'completed').length,
      inProgressTasks: feature.tasks.filter((t) => t.status === 'in_progress').length,
      checklistProgress: parseChecklistProgress(feature.checklistsContent),
      branch: null,
      clarificationSessions: [],
      totalClarifications: 0,
      userStories: feature.userStories.map((us) => ({
        id: us.storyId,
        title: us.title,
        description: us.description,
        status: us.status,
      })),
      technicalContext: null,
      taskGroups: [],
      specContent: feature.specContent,
      planContent: feature.planContent,
      tasksContent: feature.tasksContent,
      clarificationsContent: feature.clarificationsContent,
      researchContent: feature.researchContent,
      dataModelContent: feature.dataModelContent,
      quickstartContent: feature.quickstartContent,
      contractsContent: feature.contractsContent,
      checklistsContent: feature.checklistsContent,
      analysisContent: feature.analysisContent,
      additionalFiles: [],
      // Background job status
      jobStatus: feature.jobStatus as 'idle' | 'queued' | 'running' | 'completed' | 'failed' | undefined,
      jobProgress: feature.jobProgress || 0,
      jobMessage: feature.jobMessage || undefined,
    }));

    return NextResponse.json({
      projectId: project.id,
      path: '', // Database-first - no filesystem path
      name: project.displayName || project.name,
      description: project.description,  // NEW: Include project description
      features,
      lastUpdated: project.updatedAt,
      constitution: project.constitution ? {
        rawContent: project.constitution.content,
        title: project.constitution.title || undefined,
        principles: project.constitution.principles as any,
        sections: [],
        version: project.constitution.version || undefined,
        ratifiedDate: project.constitution.ratifiedDate?.toISOString(),
        lastAmendedDate: project.constitution.lastAmendedDate?.toISOString(),
        versions: project.constitution.versions.map(v => ({
          id: v.id,
          version: v.version,
          content: v.content,
          description: v.description,
          principles: v.principles,
          changeType: v.changeType,
          changeNote: v.changeNote,
          createdAt: v.createdAt.toISOString(),
        })),
      } : null,
      hasConstitution: !!project.constitution,
    });

  } catch (error) {
    console.error('Error loading project data:', error);
    return NextResponse.json(
      { error: 'Failed to load project data' },
      { status: 500 }
    );
  }
}
