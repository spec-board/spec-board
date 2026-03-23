import { generateSpec, generateClarify, generatePlan, generateTasks } from './index';

export interface StageTransitionInput {
  featureId: string;
  fromStage: string;
  toStage: string;
  featureName: string;
  description: string;
  specContent: string;
  clarificationsContent: string;
  planContent: string;
}

export interface StageTransitionResult {
  content: string;
  clarifications?: string;
}

/**
 * Generate content for a stage transition using the existing AI service methods.
 * Maps each transition to the appropriate AI generation function.
 */
export async function generateStageTransitionContent(
  input: StageTransitionInput
): Promise<StageTransitionResult> {
  const { toStage, featureName, description, specContent, clarificationsContent, planContent } = input;

  switch (toStage) {
    case 'specs': {
      // Generate spec + clarifications
      const spec = await generateSpec({
        featureName,
        description,
      });

      const specMarkdown = formatSpec(spec);

      const clarifications = await generateClarify({
        specContent: specMarkdown,
      });

      const clarificationsMarkdown = clarifications
        .map((c, i) => `${i + 1}. **${c.question}**\n   _${c.context || ''}_`)
        .join('\n\n');

      return {
        content: specMarkdown,
        clarifications: clarificationsMarkdown,
      };
    }

    case 'plan': {
      const plan = await generatePlan({
        specContent,
        clarifications: parseClarifications(clarificationsContent),
      });

      return {
        content: formatPlan(plan),
      };
    }

    case 'tasks': {
      const tasks = await generateTasks({
        specContent,
        planContent,
      });

      return {
        content: formatTasks(tasks),
      };
    }

    default:
      throw new Error(`Unsupported stage transition to: ${toStage}`);
  }
}

// Helper: format spec result to markdown
function formatSpec(spec: any): string {
  const sections: string[] = [];

  if (spec.userStories?.length) {
    sections.push('## User Stories\n');
    for (const story of spec.userStories) {
      sections.push(`### ${story.id}: ${story.title}`);
      sections.push(story.description);
      if (story.acceptanceCriteria?.length) {
        sections.push('**Acceptance Criteria:**');
        sections.push(story.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n'));
      }
      sections.push('');
    }
  }

  if (spec.functionalRequirements?.length) {
    sections.push('## Functional Requirements\n');
    sections.push(spec.functionalRequirements.map((r: string) => `- ${r}`).join('\n'));
    sections.push('');
  }

  if (spec.edgeCases?.length) {
    sections.push('## Edge Cases\n');
    sections.push(spec.edgeCases.map((e: string) => `- ${e}`).join('\n'));
    sections.push('');
  }

  if (spec.successCriteria?.length) {
    sections.push('## Success Criteria\n');
    sections.push(spec.successCriteria.map((s: string) => `- ${s}`).join('\n'));
    sections.push('');
  }

  return sections.join('\n');
}

// Helper: format plan result to markdown
function formatPlan(plan: any): string {
  const sections: string[] = [];

  if (plan.summary) {
    sections.push('## Summary\n');
    sections.push(plan.summary);
    sections.push('');
  }

  if (plan.technicalContext) {
    sections.push('## Technical Context\n');
    const ctx = plan.technicalContext;
    if (ctx.language) sections.push(`- **Language:** ${ctx.language}`);
    if (ctx.platform) sections.push(`- **Platform:** ${ctx.platform}`);
    if (ctx.storage) sections.push(`- **Storage:** ${ctx.storage}`);
    if (ctx.testing) sections.push(`- **Testing:** ${ctx.testing}`);
    if (ctx.dependencies?.length) {
      sections.push(`- **Dependencies:** ${ctx.dependencies.join(', ')}`);
    }
    sections.push('');
  }

  if (plan.projectStructure) {
    sections.push('## Project Structure\n');
    if (plan.projectStructure.decision) sections.push(plan.projectStructure.decision);
    if (plan.projectStructure.structure) sections.push(`\`\`\`\n${plan.projectStructure.structure}\n\`\`\``);
    sections.push('');
  }

  return sections.join('\n');
}

// Helper: format tasks result to markdown
function formatTasks(tasks: any): string {
  const sections: string[] = [];

  if (tasks.phases?.length) {
    for (const phase of tasks.phases) {
      sections.push(`## ${phase.name}\n`);
      if (phase.purpose) sections.push(`_${phase.purpose}_\n`);
      if (phase.tasks?.length) {
        for (const task of phase.tasks) {
          sections.push(`- [${task.id}] ${task.description}${task.userStory ? ` (${task.userStory})` : ''}`);
        }
      }
      if (phase.checkpoint) sections.push(`\n**Checkpoint:** ${phase.checkpoint}`);
      sections.push('');
    }
  }

  return sections.join('\n');
}

// Helper: parse clarifications markdown back into structured format
function parseClarifications(content: string): { question: string; answer: string }[] {
  if (!content) return [];

  const lines = content.split('\n').filter(l => l.trim());
  const results: { question: string; answer: string }[] = [];

  for (const line of lines) {
    const match = line.match(/\*\*(.+?)\*\*/);
    if (match) {
      results.push({ question: match[1], answer: '' });
    }
  }

  return results;
}
