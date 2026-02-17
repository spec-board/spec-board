import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateClarify, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/clarify - Generate clarification questions and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, specContent, questions: existingQuestions } = body;

    if (!specContent) {
      return NextResponse.json({ error: 'Spec content is required' }, { status: 400 });
    }

    // If featureId provided, verify it exists
    let feature = null;
    if (featureId) {
      feature = await prisma.feature.findUnique({ where: { id: featureId } });
      if (!feature) {
        return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
      }
    }

    const provider = await getProvider();

    // If existing questions provided (user answered them), use those
    // Otherwise, generate new questions from AI
    let questions = existingQuestions;
    if (!questions) {
      questions = await generateClarify({ specContent });
    }

    // Generate clarifications markdown content
    const clarificationsContent = generateClarificationsMarkdown(questions);

    // Save to database if featureId provided
    if (featureId) {
      await prisma.feature.update({
        where: { id: featureId },
        data: {
          clarificationsContent,
          stage: 'clarify'
        }
      });
    }

    return NextResponse.json({
      step: 'clarify',
      questions,
      content: clarificationsContent,
      featureId,
      provider
    });
  } catch (error) {
    console.error('Error in clarify:', error);
    return NextResponse.json({ error: 'Failed to generate clarifications' }, { status: 500 });
  }
}

function generateClarificationsMarkdown(questions: { question: string; answer?: string }[]): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Clarifications\n\n`;
  content += `**Date**: ${date}\n\n`;

  content += `## Questions & Answers\n\n`;
  for (const item of questions) {
    content += `### Q: ${item.question}\n\n`;
    if (item.answer) {
      content += `**A**: ${item.answer}\n\n`;
    } else {
      content += `**A**: _Pending_\n\n`;
    }
  }

  return content;
}
