import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseProject } from '@/lib/parser';

/**
 * GET /api/project/[name]/data
 * Unified endpoint that returns project data from database if available,
 * otherwise falls back to filesystem parser.
 *
 * This supports both:
 * - Database-first projects (migrated from markdown)
 * - Filesystem-based projects (legacy markdown parsing)
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

    // If project has features in database, use database-first
    if (project.features && project.features.length > 0) {
      // Transform database features to frontend format
      const features = project.features.map((feature) => ({
        id: feature.featureId,
        name: feature.name,
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
        specContent: null,
        planContent: null,
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
        constitution: null,
        hasConstitution: false,
        source: 'database', // Indicate data came from database
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
        constitution: null,
        hasConstitution: false,
        source: 'empty',
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

    return NextResponse.json({
      ...parsedProject,
      projectId: project.id,  // Include projectId even for filesystem-based projects
      source: 'filesystem',
    });

  } catch (error) {
    console.error('Error loading project data:', error);
    return NextResponse.json(
      { error: 'Failed to load project data' },
      { status: 500 }
    );
  }
}
