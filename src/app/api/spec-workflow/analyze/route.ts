import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeDocuments, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/analyze - Analyze consistency and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, specContent, planContent, tasksContent, constitution } = body;

    if (!specContent || !planContent || !tasksContent) {
      return NextResponse.json(
        { error: 'Spec, plan, and tasks content required' },
        { status: 400 }
      );
    }

    const provider = await getProvider();
    const analysis = await analyzeDocuments({
      specContent,
      planContent,
      tasksContent,
      constitution
    });

    // Generate analysis markdown content
    const analysisContent = generateAnalysisMarkdown(analysis);

    // Save to database if featureId provided
    if (featureId) {
      await prisma.feature.update({
        where: { id: featureId },
        data: {
          analysisContent,
          stage: 'analyze'
        }
      });
    }

    return NextResponse.json({
      step: 'analyze',
      analysis,
      content: analysisContent,
      provider
    });
  } catch (error) {
    console.error('Error in analyze:', error);
    return NextResponse.json({ error: 'Failed to analyze documents' }, { status: 500 });
  }
}

function generateAnalysisMarkdown(analysis: any): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Analysis Report\n\n`;
  content += `**Date**: ${date}\n`;
  content += `**Status**: ${analysis.isValid ? '✅ Valid' : '❌ Issues Found'}\n\n`;

  // Summary
  content += `## Summary\n\n`;
  const avgScore = Math.round(
    (analysis.specPlanConsistency?.score || 0 +
     analysis.planTasksConsistency?.score || 0 +
     analysis.constitutionAlignment?.score || 0) / 3
  );
  content += `**Overall Score**: ${avgScore}%\n\n`;

  // Spec-Plan Consistency
  content += `## Spec-Plan Consistency\n\n`;
  content += `**Score**: ${analysis.specPlanConsistency?.score || 0}%\n`;
  content += `**Status**: ${analysis.specPlanConsistency?.isConsistent ? '✅ Consistent' : '⚠️ Inconsistent'}\n\n`;
  if (analysis.specPlanConsistency?.details) {
    content += `${analysis.specPlanConsistency.details}\n\n`;
  }

  // Plan-Tasks Consistency
  content += `## Plan-Tasks Consistency\n\n`;
  content += `**Score**: ${analysis.planTasksConsistency?.score || 0}%\n`;
  content += `**Status**: ${analysis.planTasksConsistency?.isConsistent ? '✅ Consistent' : '⚠️ Inconsistent'}\n\n`;
  if (analysis.planTasksConsistency?.details) {
    content += `${analysis.planTasksConsistency.details}\n\n`;
  }

  // Constitution Alignment
  content += `## Constitution Alignment\n\n`;
  content += `**Score**: ${analysis.constitutionAlignment?.score || 0}%\n`;
  content += `**Status**: ${analysis.constitutionAlignment?.isConsistent ? '✅ Aligned' : '⚠️ Misaligned'}\n\n`;
  if (analysis.constitutionAlignment?.details) {
    content += `${analysis.constitutionAlignment.details}\n\n`;
  }

  // Issues
  if (analysis.issues?.length > 0) {
    content += `## Issues\n\n`;
    for (const issue of analysis.issues) {
      const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      content += `${icon} **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
      if (issue.location) {
        content += `   *Location*: ${issue.location}\n`;
      }
      if (issue.suggestion) {
        content += `   *Suggestion*: ${issue.suggestion}\n`;
      }
      content += '\n';
    }
  }

  return content;
}
