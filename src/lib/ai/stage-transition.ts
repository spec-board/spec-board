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

      const clarificationsMarkdown = formatClarificationsMarkdown(clarifications);

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

// Helper: split "As a …, I want …, so that …" into separate lines
function formatStoryDescription(desc: string): string {
  if (!desc) return '';
  // Try to split on the "As a / I want / so that" pattern
  return desc
    .replace(/,?\s*(I want|i want|Tôi muốn|tôi muốn)/gi, ',\n$1')
    .replace(/,?\s*(so that|So that|để|Để)/gi, ',\n$1');
}

// Helper: format spec result to markdown
function formatSpec(spec: any): string {
  const sections: string[] = [];

  if (spec.userStories?.length) {
    sections.push('## User Stories\n');
    for (const story of spec.userStories) {
      sections.push(`### ${story.id}: ${story.title}\n`);
      sections.push(formatStoryDescription(story.description) + '\n');
      if (story.acceptanceCriteria?.length) {
        sections.push('#### ACCEPTANCE CRITERIA\n');
        sections.push(story.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n'));
        sections.push('');
      }
      sections.push('\n---\n');
    }
  }

  if (spec.functionalRequirements?.length) {
    sections.push('## FUNCTIONAL REQUIREMENTS\n');
    sections.push(spec.functionalRequirements.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n'));
    sections.push('');
  }

  if (spec.edgeCases?.length) {
    sections.push('## EDGE CASES\n');
    sections.push(spec.edgeCases.map((e: string) => `- ${e}`).join('\n'));
    sections.push('');
  }

  if (spec.successCriteria?.length) {
    sections.push('## SUCCESS CRITERIA\n');
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
    const ps = plan.projectStructure;
    if (typeof ps === 'string') {
      sections.push(ps);
    } else {
      if (ps.decision) sections.push(ps.decision);
      if (ps.structure) {
        const structStr = typeof ps.structure === 'string' ? ps.structure : JSON.stringify(ps.structure, null, 2);
        sections.push(`\`\`\`\n${structStr}\n\`\`\``);
      }
    }
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

// Helper: format clarifications to canonical markdown (same as clarify/route.ts)
function formatClarificationsMarkdown(questions: { question: string; context?: string; answer?: string }[]): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Clarifications\n\n`;
  content += `**Date**: ${date}\n\n`;
  content += `## Questions & Answers\n\n`;

  for (const item of questions) {
    const contextSuffix = item.context ? `\n_${item.context}_` : '';
    content += `### Q: ${item.question}${contextSuffix}\n\n`;
    if (item.answer) {
      content += `**A**: ${item.answer}\n\n`;
    } else {
      content += `**A**: _Pending_\n\n`;
    }
  }

  return content;
}

// Helper: parse clarifications markdown back into structured format
function parseClarifications(content: string): { question: string; answer: string }[] {
  if (!content) return [];

  // Try canonical format first (### Q: ...)
  const sections = content.split(/^### Q:\s*/m).filter(s => s.trim());
  if (sections.length > 0 && content.includes('### Q:')) {
    const results: { question: string; answer: string }[] = [];
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const question = lines[0]?.trim() || '';
      if (!question || question.startsWith('#')) continue;
      let answer = '';
      for (const line of lines) {
        const m = line.match(/^\*\*A\*\*:\s*(.+)$/);
        if (m && m[1] !== '_Pending_') {
          answer = m[1].trim();
          break;
        }
      }
      results.push({ question, answer });
    }
    if (results.length > 0) return results;
  }

  // Fallback: old numbered format (1. **Question** _context_)
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
