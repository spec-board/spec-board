import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addStageTransitionJob, isRedisAvailable } from '@/lib/queue';
import { getAISettings } from '@/lib/ai/settings';

// POST /api/stage-transition - Trigger background stage transition via BullMQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, fromStage, toStage } = body;

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    // Check if Redis is available for queue functionality
    if (!isRedisAvailable()) {
      return NextResponse.json(
        { error: 'Background processing is not available. REDIS_URL is not configured.' },
        { status: 503 }
      );
    }

    // Check if AI provider is configured before queuing a job
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

    // Update feature to queued status
    await prisma.feature.update({
      where: { id: featureId },
      data: {
        jobStatus: 'queued',
        jobProgress: 0,
        jobMessage: 'Queued for processing...',
      },
    });

    // Trigger BullMQ background job
    const job = await addStageTransitionJob({
      featureId: feature.id,
      projectId: feature.projectId,
      fromStage,
      toStage,
      featureName: feature.name,
      description: feature.description || undefined,
      specContent: feature.specContent || undefined,
      clarificationsContent: feature.clarificationsContent || undefined,
      planContent: feature.planContent || undefined,
      constitutionVersionId: feature.constitutionVersionId,
    });

    return NextResponse.json({
      success: true,
      featureId,
      status: 'queued',
      message: `Stage transition to ${toStage} queued`,
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error triggering stage transition:', error);
    return NextResponse.json(
      { error: 'Failed to trigger stage transition' },
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
