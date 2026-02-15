import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocuments, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/analyze - Analyze consistency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specContent, planContent, tasksContent, constitution } = body;

    if (!specContent || !planContent || !tasksContent) {
      return NextResponse.json(
        { error: 'Spec, plan, and tasks content required' },
        { status: 400 }
      );
    }

    const provider = getProvider();
    const analysis = await analyzeDocuments({
      specContent,
      planContent,
      tasksContent,
      constitution
    });

    return NextResponse.json({
      step: 'analyze',
      analysis,
      provider
    });
  } catch (error) {
    console.error('Error in analyze:', error);
    return NextResponse.json({ error: 'Failed to analyze documents' }, { status: 500 });
  }
}
