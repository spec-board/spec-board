import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAISettings } from '@/lib/ai/settings';
import { generateStageTransitionContent } from '@/lib/ai/stage-transition';

// POST /api/stage-transition - Trigger stage transition (synchronous)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, fromStage, toStage } = body;

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    // Check if AI provider is configured
    const aiSettings = await getAISettings();
    if (!aiSettings.apiKey) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please add an API key in Settings before generating specs.' },
        { status: 400 }
      );
    }

    // Get the feature
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Validate transition is allowed
    const validTransitions: Record<string, string> = {
      'backlog': 'specs',
      'specs': 'plan',
      'plan': 'tasks',
    };

    const expectedNextStage = validTransitions[fromStage];
    if (toStage !== expectedNextStage) {
      return NextResponse.json(
        { error: `Invalid transition. Expected ${expectedNextStage}` },
        { status: 400 }
      );
    }

    // Update feature to processing status
    await prisma.feature.update({
      where: { id: featureId },
      data: {
        jobStatus: 'processing',
        jobProgress: 0,
        jobMessage: 'Processing...',
      },
    });

    try {
      // Generate content for the stage transition
      const result = await generateStageTransitionContent({
        featureId: feature.id,
        fromStage,
        toStage,
        featureName: feature.name,
        description: feature.description || '',
        specContent: feature.specContent || '',
        clarificationsContent: feature.clarificationsContent || '',
        planContent: feature.planContent || '',
      });

      // Update feature with new stage and content
      const updateData: any = {
        stage: toStage,
        jobStatus: 'completed',
        jobProgress: 100,
        jobMessage: `Successfully transitioned to ${toStage}`,
        jobCompletedAt: new Date(),
      };

      // Update appropriate content field based on target stage
      if (toStage === 'specs') {
        updateData.specContent = result.content;
        updateData.clarificationsContent = result.clarifications;
      } else if (toStage === 'plan') {
        updateData.planContent = result.content;
      } else if (toStage === 'tasks') {
        updateData.tasksContent = result.content;
      }

      const updatedFeature = await prisma.feature.update({
        where: { id: featureId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        featureId,
        stage: updatedFeature.stage,
        message: `Successfully transitioned to ${toStage}`,
      });
    } catch (error) {
      // Update feature with error status
      await prisma.feature.update({
        where: { id: featureId },
        data: {
          jobStatus: 'failed',
          jobMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Error triggering stage transition:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger stage transition' },
      { status: 500 }
    );
  }
}

// GET /api/stage-transition - Get job status for a feature
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      select: {
        id: true,
        stage: true,
        jobStatus: true,
        jobProgress: true,
        jobMessage: true,
        jobStartedAt: true,
        jobCompletedAt: true,
      },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({
      featureId: feature.id,
      stage: feature.stage,
      jobStatus: feature.jobStatus,
      jobProgress: feature.jobProgress,
      jobMessage: feature.jobMessage,
      jobStartedAt: feature.jobStartedAt,
      jobCompletedAt: feature.jobCompletedAt,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
