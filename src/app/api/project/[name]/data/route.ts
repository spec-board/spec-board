import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseProject } from '@/lib/parser';

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
          },
        },
        constitution: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // If project has features in database, use database-first
    if (project.features && project.features.length > 0) {
      // Transform database features to frontend format
      const features = project.features.map((feature) => ({
        id: feature.id,  // Use database UUID for API operations
        featureId: feature.featureId,  // Keep featureId for display purposes
        name: feature.name || feature.featureId,  // Use name or fallback to featureId
        path: '', // No filesystem path for database-first
        stage: feature.stage,
        hasSpec: true,
        hasPlan: true,
        hasTasks: true,
        description: feature.description,
        // Map tasks from database format
        tasks: feature.tasks.map((task) => ({
          id: task.taskId,
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
        tasksContent: null,
        clarificationsContent: null,
        researchContent: null,
        additionalFiles: [],
      }));

      return NextResponse.json({
        projectId: project.id,
        path: project.filePath || '',
        name: project.displayName || project.name,
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
        } : null,
        hasConstitution: !!project.constitution,
      });
    }

    // Otherwise, fall back to filesystem parser
    if (!project.filePath) {
      return NextResponse.json({
        projectId: project.id,  // Always include projectId for database-first projects
        path: '',
        name: project.displayName || project.name,
        features: [],
        lastUpdated: project.updatedAt,
        constitution: project.constitution ? {
          rawContent: project.constitution.content,
          title: project.constitution.title || undefined,
          principles: project.constitution.principles as any,
          sections: [],
          version: project.constitution.version || undefined,
          ratifiedDate: project.constitution.ratifiedDate?.toISOString(),
          lastAmendedDate: project.constitution.lastAmendedDate?.toISOString(),
        } : null,
        hasConstitution: !!project.constitution,
      });
    }

    // Parse from filesystem
    const parsedProject = await parseProject(project.filePath);

    if (!parsedProject) {
      return NextResponse.json(
        { error: 'Failed to parse project from filesystem' },
        { status: 500 }
      );
    }

    // Constitution always from DB
    const constitution = project.constitution ? {
      rawContent: project.constitution.content,
      title: project.constitution.title || undefined,
      principles: project.constitution.principles as any,
      sections: [],
      version: project.constitution.version || undefined,
      ratifiedDate: project.constitution.ratifiedDate?.toISOString(),
      lastAmendedDate: project.constitution.lastAmendedDate?.toISOString(),
    } : null;

    return NextResponse.json({
      ...parsedProject,
      projectId: project.id,
      constitution,
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
