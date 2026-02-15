import { NextRequest, NextResponse } from 'next/server';
import { generateClarify, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/clarify - Generate clarification questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specContent } = body;

    if (!specContent) {
      return NextResponse.json({ error: 'Spec content is required' }, { status: 400 });
    }

    const provider = getProvider();
    const questions = await generateClarify({ specContent });

    return NextResponse.json({
      step: 'clarify',
      questions,
      provider
    });
  } catch (error) {
    console.error('Error in clarify:', error);
    return NextResponse.json({ error: 'Failed to generate clarifications' }, { status: 500 });
  }
}
