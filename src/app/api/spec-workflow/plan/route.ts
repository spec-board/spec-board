import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePlan, generateResearch, generateDataModel, generateQuickstart, generateContracts, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/plan - Generate technical plan and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, name, specContent, clarifications, constitution } = body;

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

    // Get clarifications from database if not provided in request
    let clarificationsToUse = clarifications;
    if (!clarificationsToUse) {
      const feature = await prisma.feature.findUnique({
        where: { id: featureId },
        select: { clarificationsContent: true }
      });
      if (feature?.clarificationsContent) {
        // Parse clarificationsContent to extract Q&A pairs
        clarificationsToUse = parseClarificationsContent(feature.clarificationsContent);
      }
    }

    const provider = await getProvider();
    const plan = await generatePlan({
      specContent,
      clarifications: clarificationsToUse,
      constitution,
      projectContext: ''
    });

    const planContent = generatePlanMarkdown(plan, name || 'Feature', featureId);

    // Generate clarifications markdown and save standalone clarificationsContent
    const clarificationsContent = generateClarificationsMarkdown(clarificationsToUse);
    const updatedSpecContent = specContent + '\n\n' + clarificationsContent;

    // Generate design artifacts (Phase 0 & Phase 1 - like /speckit.plan)
    // Phase 0: Research
    const research = await generateResearch({
      specContent,
      planContent: planContent,
      clarifications: clarificationsToUse
    });
    const researchContent = generateResearchMarkdown(research);

    // Phase 1: Data Model
    const dataModel = await generateDataModel({
      specContent,
      planContent: planContent,
      researchContent: researchContent
    });
    const dataModelContent = generateDataModelMarkdown(dataModel);

    // Phase 1: Quickstart
    const quickstart = await generateQuickstart({
      specContent,
      planContent: planContent,
      dataModelContent
    });
    const quickstartContent = generateQuickstartMarkdown(quickstart);

    // Phase 1: Contracts
    const contracts = await generateContracts({
      specContent,
      planContent: planContent,
      dataModelContent
    });
    const contractsContent = generateContractsMarkdown(contracts);

    // Update feature in database - save plan + all design artifacts, and update stage
    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        clarificationsContent, // Save standalone clarifications
        specContent: updatedSpecContent, // Append clarifications to spec
        planContent: planContent,
        researchContent,
        dataModelContent,
        quickstartContent,
        contractsContent,
        stage: 'plan',
      }
    });

    return NextResponse.json({
      step: 'plan',
      plan,
      content: planContent,
      designArtifacts: {
        research: research,
        dataModel: dataModel,
        quickstart: quickstart,
        contracts: contracts
      },
      featureId: feature.id,
      provider
    });
  } catch (error) {
    console.error('Error in plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}

function generatePlanMarkdown(plan: any, featureName: string, featureId?: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Implementation Plan: ${featureName}\n\n`;
  content += `**Branch**: \`${featureId || 'feature/placeholder'}\` | **Date**: ${date} | **Spec**: [spec.md](spec.md)\n`;
  content += `**Input**: Feature specification from spec.md\n\n`;

  content += `## Summary\n\n${plan.summary || 'TBD'}\n\n`;

  // Technical Context
  content += `## Technical Context\n\n`;
  content += `| Aspect | Value |\n|--------|-------|\n`;
  content += `| Language/Version | ${plan.technicalContext?.language || 'TBD'} |\n`;
  content += `| Primary Dependencies | ${plan.technicalContext?.dependencies?.join(', ') || 'None'} |\n`;
  content += `| Storage | ${plan.technicalContext?.storage || 'N/A'} |\n`;
  content += `| Testing | ${plan.technicalContext?.testing || 'TBD'} |\n`;
  content += `| Target Platform | ${plan.technicalContext?.platform || 'TBD'} |\n`;
  content += `| Project Type | ${plan.technicalContext?.projectType || 'single'} |\n`;
  content += `| Performance Goals | ${plan.technicalContext?.performanceGoals || 'TBD'} |\n`;
  content += `| Constraints | ${plan.technicalContext?.constraints || 'TBD'} |\n`;
  content += `| Scale/Scope | ${plan.technicalContext?.scaleScope || 'TBD'} |\n`;
  content += `\n`;

  // Constitution Check
  content += `## Constitution Check\n\n`;
  content += `*GATE: Must pass before implementation*\n\n`;
  if (plan.constitutionCheck?.length) {
    for (const item of plan.constitutionCheck) {
      content += `- **${item.principle}**: ${item.requirement} [${item.status || 'PENDING'}]\n`;
    }
  } else {
    content += `_No constitution checks defined_\n`;
  }
  content += `\n`;

  // Project Structure
  content += `## Project Structure\n\n`;
  content += `### Source Code\n\n`;
  content += '```text\n';
  content += (plan.projectStructure?.structure || 'src/\ntests/\n') + '\n';
  content += '```\n\n';
  content += `**Structure Decision**: ${plan.projectStructure?.decision || 'TBD'}\n\n`;

  // Quality Gates
  content += `## Quality Gates\n\n`;
  if (plan.qualityGates?.length) {
    for (const gate of plan.qualityGates) {
      content += `- [ ] ${gate}\n`;
    }
  } else {
    content += `- [ ] All tests pass\n`;
    content += `- [ ] Code follows project style\n`;
    content += `- [ ] No security vulnerabilities\n`;
  }
  content += `\n`;

  // Complexity Tracking
  content += `## Complexity Tracking\n\n`;
  if (plan.complexityTracking?.length) {
    content += `| Violation | Why Needed | Simpler Alternative Rejected Because |\n`;
    content += `|-----------|------------|-------------------------------------|\n`;
    for (const item of plan.complexityTracking) {
      content += `| ${item.aspect} | ${item.rationale} | ${item.alternative || 'N/A'} |\n`;
    }
  } else {
    content += `_No complexity violations_\n`;
  }
  content += `\n`;

  return content;
}

// Generate clarifications section in spec-kit format
function generateClarificationsMarkdown(clarifications: { question: string; answer: string }[]): string {
  if (!clarifications || clarifications.length === 0) {
    return '';
  }

  const date = new Date().toISOString().split('T')[0];
  let content = `## Clarifications\n\n`;
  content += `### Session ${date}\n\n`;

  for (const item of clarifications) {
    if (item.answer) {
      // Only include answered questions in spec-kit format
      content += `- Q: ${item.question} → A: ${item.answer}\n`;
    }
  }

  return content;
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

  if (quickstart.prerequisites?.length) {
    content += `## Prerequisites\n\n`;
    for (const prereq of quickstart.prerequisites) {
      content += `- ${prereq}\n`;
    }
    content += '\n';
  }

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
  return JSON.stringify(contracts.contracts || [], null, 2);
}
