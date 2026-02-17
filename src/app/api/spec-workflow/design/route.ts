import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResearch, generateDataModel, generateQuickstart, generateContracts, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/design - Generate Phase 1 artifacts (research, data-model, quickstart, contracts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, specContent, planContent, clarifications } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get feature to verify it exists and get existing content
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      select: {
        id: true,
        clarificationsContent: true,
        planContent: true
      }
    });
    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Get clarifications if not provided
    let clarificationsToUse = clarifications;
    if (!clarificationsToUse && feature.clarificationsContent) {
      clarificationsToUse = parseClarificationsContent(feature.clarificationsContent);
    }

    // Use provided planContent or get from database
    const planToUse = planContent || feature.planContent || '';
    if (!planToUse) {
      return NextResponse.json({ error: 'Plan content is required. Please run /api/spec-workflow/plan first.' }, { status: 400 });
    }

    const provider = await getProvider();

    // Phase 0: Generate Research
    const research = await generateResearch({
      specContent,
      planContent: planToUse,
      clarifications: clarificationsToUse
    });
    const researchContent = generateResearchMarkdown(research);

    // Phase 1: Generate Data Model
    const dataModel = await generateDataModel({
      specContent,
      planContent: planToUse,
      researchContent: researchContent
    });
    const dataModelContent = generateDataModelMarkdown(dataModel);

    // Phase 1: Generate Quickstart
    const quickstart = await generateQuickstart({
      specContent,
      planContent: planToUse,
      dataModelContent
    });
    const quickstartContent = generateQuickstartMarkdown(quickstart);

    // Phase 1: Generate Contracts
    const contracts = await generateContracts({
      specContent,
      planContent: planToUse,
      dataModelContent
    });
    const contractsContent = generateContractsMarkdown(contracts);

    // Update feature in database - save all Phase 1 artifacts
    const updatedFeature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        researchContent,
        dataModelContent,
        quickstartContent,
        contractsContent,
        stage: 'plan', // Still in planning phase
      }
    });

    return NextResponse.json({
      step: 'design',
      artifacts: {
        research: research,
        dataModel: dataModel,
        quickstart: quickstart,
        contracts: contracts
      },
      contents: {
        researchContent,
        dataModelContent,
        quickstartContent,
        contractsContent
      },
      featureId: updatedFeature.id,
      provider
    });
  } catch (error) {
    console.error('Error in design:', error);
    return NextResponse.json({ error: 'Failed to generate design artifacts' }, { status: 500 });
  }
}

// Generate markdown for research
function generateResearchMarkdown(research: any): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Research: ${research.overview || 'Technical Research'}\n\n`;
  content += `**Date**: ${date}\n\n`;
  content += `## Overview\n\n${research.overview || ''}\n\n`;

  if (research.sections?.length) {
    for (const section of research.sections) {
      content += `## ${section.title}\n\n`;
      content += `${section.content}\n\n`;
      if (section.bullets?.length) {
        content += `### Key Points\n\n`;
        for (const bullet of section.bullets) {
          content += `- ${bullet}\n`;
        }
        content += '\n';
      }
    }
  }

  return content;
}

// Generate markdown for data model
function generateDataModelMarkdown(dataModel: any): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Data Model\n\n`;
  content += `**Date**: ${date}\n\n`;
  content += `## Overview\n\n${dataModel.overview || ''}\n\n`;

  // Entities
  if (dataModel.entities?.length) {
    content += `## Entities\n\n`;
    for (const entity of dataModel.entities) {
      content += `### ${entity.name}\n\n`;
      content += `${entity.description}\n\n`;
      content += `| Field | Type | Required | Description |\n`;
      content += `|-------|------|----------|-------------|\n`;
      for (const field of entity.fields) {
        content += `| ${field.name} | \`${field.type}\` | ${field.required ? 'Yes' : 'No'} | ${field.description || '-'} |\n`;
      }
      content += '\n';
    }
  }

  // Relationships
  if (dataModel.relationships?.length) {
    content += `## Relationships\n\n`;
    content += `| From | To | Type | Description |\n`;
    content += `|------|-----|------|-------------|\n`;
    for (const rel of dataModel.relationships) {
      content += `| ${rel.from} | ${rel.to} | ${rel.type} | ${rel.description || '-'} |\n`;
    }
    content += '\n';
  }

  return content;
}

// Generate markdown for quickstart
function generateQuickstartMarkdown(quickstart: any): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Quickstart Guide\n\n`;
  content += `**Date**: ${date}\n\n`;
  content += `## Overview\n\n${quickstart.overview || ''}\n\n`;

  // Prerequisites
  if (quickstart.prerequisites?.length) {
    content += `## Prerequisites\n\n`;
    for (const prereq of quickstart.prerequisites) {
      content += `- ${prereq}\n`;
    }
    content += '\n';
  }

  // Steps
  if (quickstart.steps?.length) {
    content += `## Steps\n\n`;
    for (let i = 0; i < quickstart.steps.length; i++) {
      const step = quickstart.steps[i];
      content += `### ${i + 1}. ${step.title}\n\n`;
      content += `${step.content}\n\n`;
      if (step.code) {
        content += `\`\`\`${step.language || ''}\n${step.code}\n\`\`\`\n\n`;
      }
    }
  }

  return content;
}

// Generate markdown for contracts
function generateContractsMarkdown(contracts: any): string {
  // Store as JSON array for flexibility
  return JSON.stringify(contracts.contracts || [], null, 2);
}

// Parse clarificationsContent from database to extract Q&A pairs
function parseClarificationsContent(content: string): { question: string; answer: string }[] {
  const result: { question: string; answer: string }[] = [];

  // Match pattern: ### Q: Question\n\n**A**: Answer
  const qaPattern = /### Q: (.+?)\n\n\*\*A\*\*: (.+)/g;
  let match;
  while ((match = qaPattern.exec(content)) !== null) {
    const question = match[1].trim();
    const answer = match[2].replace('_Pending_', '').trim();
    if (answer && answer !== '_Pending_') {
      result.push({ question, answer });
    }
  }

  // Also try simpler pattern: - Q: Question → A: Answer
  const simplePattern = /- Q: (.+?) → A: (.+)/g;
  while ((match = simplePattern.exec(content)) !== null) {
    result.push({
      question: match[1].trim(),
      answer: match[2].trim()
    });
  }

  return result;
}
