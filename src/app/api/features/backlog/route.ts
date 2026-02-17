import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/features/backlog - Create feature in backlog (no AI generation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, description } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate feature ID
    const featureCount = await prisma.feature.count({ where: { projectId } });
    const featureId = `${String(featureCount + 1).padStart(3, '0')}-${name.toLowerCase().replace(/\s+/g, '-')}`;

    // Get latest constitution version for this project
    const latestConstitution = await prisma.constitution.findUnique({
      where: { projectId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    const constitutionVersionId = latestConstitution?.versions[0]?.id || null;

    // Create feature in database with stage = 'backlog' (no AI generation)
    const feature = await prisma.feature.create({
      data: {
        projectId,
        featureId,
        name,
        description: description || null,
        stage: 'backlog',
        order: featureCount,
        constitutionVersionId
      }
    });

    return NextResponse.json({
      step: 'backlog',
      featureId: feature.id,
      featureIdDb: feature.featureId,
      name: feature.name,
      description: feature.description
    });
  } catch (error) {
    console.error('Error creating backlog feature:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create feature' },
      { status: 500 }
    );
  }
}
