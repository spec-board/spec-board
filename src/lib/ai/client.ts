import type {
  AIConfig,
  AIProvider,
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GenerateSpecOptions,
  GenerateClarifyOptions,
  GeneratePlanOptions,
  GenerateTasksOptions,
  AnalyzeOptions,
  GenerateConstitutionOptions,
  GeneratedUserStory,
  GeneratedSpecKit,
  GeneratedSpec,
  ClarificationQuestion,
  GeneratedPlan,
  GeneratedTasks,
  AnalysisResult,
  GeneratedConstitution
} from './types';
import { getAISettingsSync } from './settings';

/**
 * AI Client - OpenAI-Compatible API only
 * Supports Ollama, LM Studio, LocalAI, and any OpenAI-compatible endpoint
 */

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o'
};

// Environment variables as fallback
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class AIService {
  private config: AIConfig;

  constructor(config: AIConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Update configuration
  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  // Get current provider
  getProvider(): AIProvider {
    const settings = getAISettingsSync();
    return settings.provider as AIProvider;
  }

  // Check if using real AI
  isRealAI(): boolean {
    const settings = getAISettingsSync();
    return !!settings.apiKey;
  }

  // Base URL getter
  private getBaseUrl(): string {
    const settings = getAISettingsSync();
    return settings.baseUrl || 'https://api.openai.com/v1';
  }

  // API key getter
  private getApiKey(): string {
    const settings = getAISettingsSync();
    return settings.apiKey || OPENAI_API_KEY || '';
  }

  // Model getter
  private getModel(): string {
    const settings = getAISettingsSync();
    return settings.model || this.config.model || 'gpt-4o';
  }

  // Internal API call helper
  private async callAPI(prompt: string, systemPrompt?: string, maxTokens: number = 4096): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('No API key configured. Please configure an API key in settings.');
    }

    const baseUrl = this.getBaseUrl();
    const model = this.getModel();

    const messages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Generate user stories
  async generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
    const content = await this.callAPI(
      this.buildUserStoriesPrompt(options.prdContent, options.projectContext),
      'You are a product analyst that creates user stories from PRD documents.',
      4096
    );
    return this.parseUserStoriesResponse(content);
  }

  // Generate full spec-kit
  async generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
    const content = await this.callAPI(
      this.buildSpecKitPrompt(options.prdContent, options.featureName, options.projectContext),
      'You are a product analyst and technical writer that creates full spec-kit from PRD documents.',
      8192
    );
    return this.parseSpecKitResponse(content);
  }

  // Step 1: Generate spec
  async generateSpec(options: GenerateSpecOptions): Promise<GeneratedSpec> {
    const content = await this.callAPI(
      this.buildSpecPrompt(options.featureName, options.description, options.projectContext),
      'You are a product analyst that generates feature specifications.',
      8192
    );
    return this.parseSpecResponse(content);
  }

  // Step 2: Generate clarifications
  async generateClarify(options: GenerateClarifyOptions): Promise<ClarificationQuestion[]> {
    const content = await this.callAPI(
      this.buildClarifyPrompt(options.specContent),
      'You are a product analyst that identifies ambiguities and generates clarification questions.',
      4096
    );
    return this.parseClarifyResponse(content);
  }

  // Step 3: Generate plan
  async generatePlan(options: GeneratePlanOptions): Promise<GeneratedPlan> {
    const content = await this.callAPI(
      this.buildPlanPrompt(options.specContent, options.clarifications, options.constitution, options.projectContext),
      'You are a technical architect that generates implementation plans.',
      8192
    );
    return this.parsePlanResponse(content);
  }

  // Step 4: Generate tasks
  async generateTasks(options: GenerateTasksOptions): Promise<GeneratedTasks> {
    const content = await this.callAPI(
      this.buildTasksPrompt(options.specContent, options.planContent),
      'You are a project manager that creates task breakdowns.',
      8192
    );
    return this.parseTasksResponse(content);
  }

  // Step 5: Analyze documents
  async analyzeDocuments(options: AnalyzeOptions): Promise<AnalysisResult> {
    const content = await this.callAPI(
      this.buildAnalyzePrompt(options.specContent, options.planContent, options.tasksContent, options.constitution),
      'You are a QA analyst that validates consistency across documents.',
      8192
    );
    return this.parseAnalyzeResponse(content);
  }

  // Generate Constitution
  async generateConstitution(options: GenerateConstitutionOptions): Promise<GeneratedConstitution> {
    const { projectName, projectDescription, existingPrinciples } = options;

    const systemPrompt = `You are an expert software architect specializing in development methodologies and best practices. Generate a project constitution with core principles and suggested sections for AI-assisted development.

Respond with valid JSON in this exact format:
{
  "principles": [
    { "name": "I. Principle Name", "description": "Detailed description of the principle" }
  ],
  "suggestedSections": [
    { "name": "Section Name", "content": "Section content" }
  ]
}`;

    const userPrompt = `Generate a constitution for project "${projectName}".

${projectDescription ? `Project description: ${projectDescription}` : ''}
${existingPrinciples ? `Current principles to improve on:\n${existingPrinciples}` : ''}

Consider:
- Development methodology (TDD, Agile, etc.)
- Code quality standards
- Accessibility requirements
- Testing requirements
- Security practices
- Performance guidelines
- Documentation standards

Generate 5-7 core principles and 2-3 suggested sections.`;

    const content = await this.callAPI(userPrompt, systemPrompt, 4096);
    return this.parseConstitutionResponse(content);
  }

  // ========================================================================
  // Prompt builders
  // ========================================================================

  private buildUserStoriesPrompt(prdContent: string, projectContext?: string): string {
    return `You are a product analyst. Generate user stories from the following PRD.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
PRD Content:
${prdContent}

Generate user stories in the following JSON format:
{
  "userStories": [
    {
      "id": "US01",
      "title": "Story title",
      "description": "As a [user], I want [action], so that [benefit]",
      "priority": "P1|P2|P3",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildSpecKitPrompt(prdContent: string, featureName: string, projectContext?: string): string {
    return `You are a product analyst and technical writer. Generate a complete spec-kit from the following PRD.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Feature Name: ${featureName}
PRD Content:
${prdContent}

Generate a complete spec-kit in the following JSON format:
{
  "spec": {
    "userStories": [...],
    "clarifications": [{"question": "...", "answer": "..."}]
  },
  "plan": {
    "summary": "...",
    "technicalContext": {
      "language": "...",
      "dependencies": [...],
      "storage": "...",
      "testing": "...",
      "platform": "..."
    }
  },
  "tasks": {
    "phases": [
      {
        "name": "Phase Name",
        "tasks": [{"id": "T001", "description": "...", "userStory": "US01"}]
      }
    ]
  }
}

Return ONLY valid JSON, no other text.`;
  }

  private buildSpecPrompt(featureName: string, description: string, projectContext?: string): string {
    return `You are a product analyst. Generate a feature specification from the following description.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Feature Name: ${featureName}
Description: ${description}

Generate a detailed spec in JSON format:
{
  "userStories": [{"id": "US01", "title": "...", "description": "As a [user], I want [action], so that [benefit]", "priority": "P1|P2|P3", "acceptanceCriteria": ["..."]}],
  "edgeCases": ["Edge case 1", "Edge case 2"],
  "functionalRequirements": ["Requirement 1", "Requirement 2"],
  "successCriteria": ["Success criterion 1", "Success criterion 2"],
  "keyEntities": ["Entity 1", "Entity 2"]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildClarifyPrompt(specContent: string): string {
    return `You are a product analyst. Identify ambiguities in the following spec and generate targeted clarification questions.

Spec Content:
${specContent}

Generate clarification questions in JSON format:
{
  "clarifications": [
    {"question": "Question text", "context": "Why this matters"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildPlanPrompt(
    specContent: string,
    clarifications?: { question: string; answer: string }[],
    constitution?: string,
    projectContext?: string
  ): string {
    return `You are a technical architect. Generate a technical plan based on the spec and clarifications.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Spec Content:
${specContent}
${clarifications?.length ? `\nClarifications:\n${clarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n')}` : ''}
${constitution ? `\nProject Constitution:\n${constitution}` : ''}

Generate a technical plan in JSON format:
{
  "summary": "Brief summary of the implementation approach",
  "technicalContext": {
    "language": "e.g., TypeScript, Python",
    "version": "e.g., 5.0",
    "dependencies": ["dep1", "dep2"],
    "storage": "e.g., PostgreSQL",
    "testing": "e.g., Vitest, Playwright",
    "platform": "e.g., Web, Mobile"
  },
  "projectStructure": {
    "decision": "Why this structure",
    "structure": "Directory structure description"
  }
}

Return ONLY valid JSON, no other text.`;
  }

  private buildTasksPrompt(specContent: string, planContent: string): string {
    return `You are a project manager. Create a task breakdown based on the spec and plan.

Spec Content:
${specContent}

Plan Content:
${planContent}

Generate task breakdown in JSON format:
{
  "phases": [
    {
      "name": "Phase 1: Setup",
      "purpose": "Why this phase",
      "checkpoint": "Exit criteria",
      "tasks": [
        {"id": "T001", "description": "Task description", "userStory": "US01", "parallel": false}
      ]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildAnalyzePrompt(
    specContent: string,
    planContent: string,
    tasksContent: string,
    constitution?: string
  ): string {
    return `You are a QA analyst. Validate consistency across the spec, plan, and tasks documents.

Spec Content:
${specContent}

Plan Content:
${planContent}

Tasks Content:
${tasksContent}
${constitution ? `\nConstitution:\n${constitution}` : ''}

Generate analysis in JSON format:
{
  "isValid": true,
  "specPlanConsistency": {
    "isConsistent": true,
    "score": 85,
    "details": "Explanation of consistency"
  },
  "planTasksConsistency": {
    "isConsistent": true,
    "score": 90,
    "details": "Explanation of consistency"
  },
  "constitutionAlignment": {
    "isConsistent": true,
    "score": 100,
    "details": "Explanation of alignment"
  },
  "issues": [
    {"severity": "warning", "category": "consistency", "message": "Issue description", "location": "spec.md:10"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  // ========================================================================
  // Response parsers
  // ========================================================================

  private parseUserStoriesResponse(content: string): GeneratedUserStory[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.userStories || parsed.stories || [];
      }
      return [];
    } catch {
      console.error('Failed to parse user stories response');
      return [];
    }
  }

  private parseSpecKitResponse(content: string): GeneratedSpecKit {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed as GeneratedSpecKit;
      }
    } catch {
      console.error('Failed to parse spec-kit response');
    }
    return {
      spec: { userStories: [], clarifications: [] },
      plan: { summary: '', technicalContext: { language: '', dependencies: [], storage: '', testing: '', platform: '' } },
      tasks: { phases: [] }
    };
  }

  private parseSpecResponse(content: string): GeneratedSpec {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          userStories: parsed.userStories || [],
          edgeCases: parsed.edgeCases || [],
          functionalRequirements: parsed.functionalRequirements || [],
          successCriteria: parsed.successCriteria || [],
          keyEntities: parsed.keyEntities || []
        };
      }
    } catch {
      console.error('Failed to parse spec response');
    }
    return {
      userStories: [],
      edgeCases: [],
      functionalRequirements: [],
      successCriteria: [],
      keyEntities: []
    };
  }

  private parseClarifyResponse(content: string): ClarificationQuestion[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.clarifications || parsed.questions || [];
      }
    } catch {
      console.error('Failed to parse clarify response');
    }
    return [];
  }

  private parsePlanResponse(content: string): GeneratedPlan {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '',
          technicalContext: parsed.technicalContext || { language: '', dependencies: [], storage: '', testing: '', platform: '' },
          projectStructure: parsed.projectStructure || { decision: '', structure: '' },
          complexityViolations: parsed.complexityViolations || []
        };
      }
    } catch {
      console.error('Failed to parse plan response');
    }
    return {
      summary: '',
      technicalContext: { language: '', dependencies: [], storage: '', testing: '', platform: '' },
      projectStructure: { decision: '', structure: '' }
    };
  }

  private parseTasksResponse(content: string): GeneratedTasks {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { phases: parsed.phases || [] };
      }
    } catch {
      console.error('Failed to parse tasks response');
    }
    return { phases: [] };
  }

  private parseAnalyzeResponse(content: string): AnalysisResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValid: parsed.isValid ?? true,
          specPlanConsistency: parsed.specPlanConsistency || { isConsistent: true, score: 100, details: '' },
          planTasksConsistency: parsed.planTasksConsistency || { isConsistent: true, score: 100, details: '' },
          constitutionAlignment: parsed.constitutionAlignment || { isConsistent: true, score: 100, details: '' },
          issues: parsed.issues || []
        };
      }
    } catch {
      console.error('Failed to parse analyze response');
    }
    return {
      isValid: true,
      specPlanConsistency: { isConsistent: true, score: 100, details: '' },
      planTasksConsistency: { isConsistent: true, score: 100, details: '' },
      constitutionAlignment: { isConsistent: true, score: 100, details: '' },
      issues: []
    };
  }

  private parseConstitutionResponse(content: string): GeneratedConstitution {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          principles: parsed.principles || [],
          suggestedSections: parsed.suggestedSections || []
        };
      }
    } catch {
      console.error('Failed to parse constitution response');
    }
    return {
      principles: [],
      suggestedSections: []
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for custom configurations
export { AIService };
