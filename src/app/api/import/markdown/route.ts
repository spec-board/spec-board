import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseProject } from '@/lib/parser';

/**
 * POST /api/import/markdown
 * Import a spec-kit project from filesystem to database
 *
 * Request body:
 * {
 *   projectId: string,  // Existing project ID in database
 *   projectPath: string  // Filesystem path to spec-kit project
 * }
 *
 * Response:
 * {
 *   success: true,
 *   projectId: string,
 *   featuresImported: number,
 *   tasksImported: number,
 *   userStoriesImported: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, projectPath } = body;

    if (!projectId || !projectPath) {
      return NextResponse.json(
        { error: 'projectId and projectPath are required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Parse the spec-kit project from filesystem
    const parsedProject = await parseProject(projectPath);

    if (!parsedProject) {
      return NextResponse.json(
        { error: 'Failed to parse project from filesystem' },
        { status: 500 }
      );
    }

    // Track import statistics
    let featuresImported = 0;
    let tasksImported = 0;
    let userStoriesImported = 0;

    // Import each feature
    for (const feature of parsedProject.features) {
      // Create feature
      const createdFeature = await prisma.feature.create({
        data: {
          projectId: project.id,
          featureId: feature.id,
          name: feature.name,
          description: feature.description || null,
          stage: feature.stage || 'specify',
          order: featuresImported,
        },
      });

      featuresImported++;

      // Import user stories
      for (const userStory of feature.userStories || []) {
        await prisma.userStory.create({
          data: {
            featureId: createdFeature.id,
            storyId: userStory.id,
            title: userStory.title,
            description: userStory.description || null,
            status: userStory.status === 'completed' ? 'completed' :
                    userStory.status === 'in_progress' ? 'in_progress' : 'pending',
            order: userStoriesImported,
          },
        });
        userStoriesImported++;
      }

      // Import tasks
      for (const task of feature.tasks || []) {
        // Find the user story ID if present
        let userStoryId: string | null = null;
        if (task.userStory) {
          const us = await prisma.userStory.findFirst({
            where: {
              featureId: createdFeature.id,
              storyId: task.userStory,
            },
          });
          userStoryId = us?.id || null;
        }

        await prisma.task.create({
          data: {
            featureId: createdFeature.id,
            userStoryId,
            taskId: task.id,
            title: task.description || '',
            description: null,
            status: task.completed ? 'completed' : 'pending',
            priority: 'P', // Default priority
            order: tasksImported,
          },
        });
        tasksImported++;
      }
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      featuresImported,
      tasksImported,
      userStoriesImported,
    });
  } catch (error) {
    console.error('Error importing project:', error);
    return NextResponse.json(
      { error: 'Failed to import project' },
      { status: 500 }
    );
  }
}
