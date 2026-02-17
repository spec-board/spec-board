import type {
  AIConfig,
  AIProvider,
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GenerateSpecOptions,
  GenerateClarifyOptions,
  GeneratePlanOptions,
  GenerateTasksOptions,
  GenerateChecklistOptions,
  AnalyzeOptions,
  GenerateConstitutionOptions,
  GeneratedUserStory,
  GeneratedSpecKit,
  GeneratedSpec,
  ClarificationQuestion,
  GeneratedPlan,
  GeneratedTasks,
  GeneratedChecklist,
  AnalysisResult,
  GeneratedConstitution,
  // Phase 1 artifacts
  GenerateResearchOptions,
  GenerateDataModelOptions,
  GenerateQuickstartOptions,
  GenerateContractsOptions,
  GeneratedResearch,
  GeneratedDataModel,
  GeneratedQuickstart,
  GeneratedContracts
} from './types';
import { getAISettings } from './settings';

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
  async getProvider(): Promise<AIProvider> {
    const settings = await getAISettings();
    return settings.provider as AIProvider;
  }

  // Check if using real AI
  async isRealAI(): Promise<boolean> {
    const settings = await getAISettings();
    return !!settings.apiKey;
  }

  // Base URL getter
  private async getBaseUrl(): Promise<string> {
    const settings = await getAISettings();
    return settings.baseUrl || 'https://api.openai.com/v1';
  }

  // API key getter
  private async getApiKey(): Promise<string> {
    const settings = await getAISettings();
    return settings.apiKey || OPENAI_API_KEY || '';
  }

  // Model getter
  private async getModel(): Promise<string> {
    const settings = await getAISettings();
    return settings.model || this.config.model || 'gpt-4o';
  }

  // Internal API call helper
  private async callAPI(prompt: string, systemPrompt?: string, maxTokens: number = 4096): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('No API key configured. Please configure an API key in settings.');
    }

    const baseUrl = await this.getBaseUrl();
    const model = await this.getModel();

    // Debug logging
    console.log('[AI Client] baseUrl:', baseUrl);
    console.log('[AI Client] model:', model);
    console.log('[AI Client] apiKey length:', apiKey?.length);
    console.log('[AI Client] apiKey prefix:', apiKey?.substring(0, 5));

    const messages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
      : [{ role: 'user', content: prompt }];

    // Handle baseUrl - support both OpenAI-compatible formats:
    // - /v1/chat/completions (new format)
    // - /v1/completions (legacy OpenAI format)
    let fetchUrl = baseUrl;
    if (fetchUrl.includes('/chat/completions')) {
      // Already has full endpoint, use as-is
    } else if (fetchUrl.endsWith('/completions')) {
      // Legacy format: /v1/completions → add /chat
      fetchUrl = `${fetchUrl}/chat`;
    } else {
      // Standard format: /v1 → add /chat/completions
      fetchUrl = `${fetchUrl}/chat/completions`;
    }
    console.log('[AI Client] fetchUrl:', fetchUrl);

    const response = await fetch(fetchUrl, {
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
      const errorText = await response.text();
      console.log('[AI Client] Error response:', errorText);
      throw new Error(`API error: ${response.statusText} - ${errorText}`);
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

  // Step 4.5: Generate checklist - "Unit Tests for Requirements"
  async generateChecklist(options: GenerateChecklistOptions): Promise<GeneratedChecklist> {
    const content = await this.callAPI(
      this.buildChecklistPrompt(options.specContent, options.planContent, options.tasksContent, options.theme),
      'You are a QA analyst that validates requirement quality. Create checklists that test the REQUIREMENTS themselves, not the implementation.',
      8192
    );
    return this.parseChecklistResponse(content);
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

  // ============================================
  // Phase 1 Artifacts: Research, Data Model, Quickstart, Contracts
  // ============================================

  // Phase 0: Generate research
  async generateResearch(options: GenerateResearchOptions): Promise<GeneratedResearch> {
    const content = await this.callAPI(
      this.buildResearchPrompt(options.specContent, options.planContent, options.clarifications),
      'You are a technical researcher that investigates technical decisions and best practices.',
      8192
    );
    return this.parseResearchResponse(content);
  }

  // Phase 1: Generate data model
  async generateDataModel(options: GenerateDataModelOptions): Promise<GeneratedDataModel> {
    const content = await this.callAPI(
      this.buildDataModelPrompt(options.specContent, options.planContent, options.researchContent),
      'You are a data architect that designs data models and schemas.',
      8192
    );
    return this.parseDataModelResponse(content);
  }

  // Phase 1: Generate quickstart
  async generateQuickstart(options: GenerateQuickstartOptions): Promise<GeneratedQuickstart> {
    const content = await this.callAPI(
      this.buildQuickstartPrompt(options.specContent, options.planContent, options.dataModelContent),
      'You are a technical writer that creates quickstart guides.',
      8192
    );
    return this.parseQuickstartResponse(content);
  }

  // Phase 1: Generate contracts
  async generateContracts(options: GenerateContractsOptions): Promise<GeneratedContracts> {
    const content = await this.callAPI(
      this.buildContractsPrompt(options.specContent, options.planContent, options.dataModelContent),
      'You are an API designer that creates API contracts and documentation.',
      8192
    );
    return this.parseContractsResponse(content);
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

  private buildChecklistPrompt(
    specContent: string,
    planContent: string,
    tasksContent?: string,
    theme?: string
  ): string {
    const themeSection = theme ? `\nFocus on ${theme} requirements quality.` : '';
    const tasksSection = tasksContent ? `\n\nTasks Content:\n${tasksContent}` : '';

    return `You are a QA analyst that validates requirement quality. Create a checklist as "Unit Tests for Requirements" - validate the QUALITY of requirements, NOT the implementation.

CRITICAL: Each item must test whether the REQUIREMENTS are well-written, NOT whether the code works.

${themeSection}

## Spec Content:
${specContent}

## Plan Content:
${planContent}${tasksSection}

## Checklist Guidelines - "Unit Tests for Requirements":

**Quality Dimensions to Test:**
- Completeness: Are all necessary requirements present?
- Clarity: Are requirements unambiguous and specific?
- Consistency: Do requirements align with each other?
- Measurability: Can requirements be objectively verified?
- Coverage: Are all scenarios/edge cases addressed?

**PROHIBITED Patterns (testing implementation, NOT requirements):**
- ❌ "Verify landing page displays 3 cards"
- ❌ "Test hover states work"
- ❌ "Confirm logo click navigates home"
- ❌ Any item starting with "Verify", "Test", "Confirm", "Check"

**REQUIRED Patterns (testing requirements quality):**
- ✅ "Are the exact number and layout specified?" [Completeness]
- ✅ "Is 'prominent display' quantified with specific sizing?" [Clarity]
- ✅ "Are hover state requirements consistent across elements?" [Consistency]
- ✅ "Is fallback behavior defined when image fails to load?" [Edge Case]

Generate checklist in JSON format:
{
  "theme": "${theme || 'general'}",
  "items": [
    {"id": "CHK001", "question": "Are error handling requirements defined for all API failure modes? [Completeness]", "category": "Completeness", "reference": "[Gap]"},
    {"id": "CHK002", "question": "Is 'fast loading' quantified with specific timing thresholds? [Clarity, Spec §NFR-1]", "category": "Clarity", "reference": "Spec §NFR-1"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private parseChecklistResponse(content: string): GeneratedChecklist {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        theme: parsed.theme || 'general',
        items: parsed.items || []
      };
    } catch (error) {
      console.error('[AI] Failed to parse checklist response:', error);
      // Return empty checklist on parse error
      return { theme: 'general', items: [] };
    }
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

  // ============================================
  // Phase 1 Build Prompts & Parse Methods
  // ============================================

  private buildResearchPrompt(
    specContent: string,
    planContent: string,
    clarifications?: { question: string; answer: string }[]
  ): string {
    return `You are a technical researcher. Investigate technical decisions and provide research findings.

Spec Content:
${specContent}

Plan Content:
${planContent}
${clarifications?.length ? `\nClarifications:\n${clarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n')}` : ''}

Generate research findings in JSON format:
{
  "overview": "Brief overview of research scope",
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed research content",
      "bullets": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildDataModelPrompt(
    specContent: string,
    planContent: string,
    researchContent?: string
  ): string {
    const researchSection = researchContent ? `\nResearch Content:\n${researchContent}` : '';
    return `You are a data architect. Design a data model based on the spec and plan.

Spec Content:
${specContent}

Plan Content:
${planContent}${researchSection}

Generate data model in JSON format:
{
  "overview": "Brief overview of the data model",
  "entities": [
    {
      "name": "EntityName",
      "description": "What this entity represents",
      "fields": [
        {"name": "fieldName", "type": "string", "required": true, "description": "Field description"}
      ]
    }
  ],
  "relationships": [
    {"from": "EntityA", "to": "EntityB", "type": "one-to-many", "description": "How entities relate"}
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildQuickstartPrompt(
    specContent: string,
    planContent: string,
    dataModelContent?: string
  ): string {
    const dataModelSection = dataModelContent ? `\nData Model:\n${dataModelContent}` : '';
    return `You are a technical writer. Create a quickstart guide.

Spec Content:
${specContent}

Plan Content:
${planContent}${dataModelSection}

Generate quickstart guide in JSON format:
{
  "overview": "Brief overview of what the user will build",
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "steps": [
    {
      "title": "Step 1: Do Something",
      "content": "Detailed instructions",
      "code": "optional code example",
      "language": "javascript"
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildContractsPrompt(
    specContent: string,
    planContent: string,
    dataModelContent?: string
  ): string {
    const dataModelSection = dataModelContent ? `\nData Model:\n${dataModelContent}` : '';
    return `You are an API designer. Create API contracts.

Spec Content:
${specContent}

Plan Content:
${planContent}${dataModelSection}

Generate API contracts in JSON format:
{
  "contracts": [
    {
      "name": "GetUsers",
      "description": "Get all users",
      "endpoint": "/api/users",
      "method": "GET",
      "request": {
        "headers": {"Authorization": "Bearer token"},
        "queryParams": {"page": "page number"}
      },
      "response": {
        "status": 200,
        "body": {"users": []}
      },
      "errors": [
        {"status": 401, "message": "Unauthorized"}
      ]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private parseResearchResponse(content: string): GeneratedResearch {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          sections: parsed.sections || []
        };
      }
    } catch {
      console.error('Failed to parse research response');
    }
    return { overview: '', sections: [] };
  }

  private parseDataModelResponse(content: string): GeneratedDataModel {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          entities: parsed.entities || [],
          relationships: parsed.relationships || []
        };
      }
    } catch {
      console.error('Failed to parse data model response');
    }
    return { overview: '', entities: [], relationships: [] };
  }

  private parseQuickstartResponse(content: string): GeneratedQuickstart {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overview: parsed.overview || '',
          prerequisites: parsed.prerequisites || [],
          steps: parsed.steps || []
        };
      }
    } catch {
      console.error('Failed to parse quickstart response');
    }
    return { overview: '', prerequisites: [], steps: [] };
  }

  private parseContractsResponse(content: string): GeneratedContracts {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          contracts: parsed.contracts || []
        };
      }
    } catch {
      console.error('Failed to parse contracts response');
    }
    return { contracts: [] };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for custom configurations
export { AIService };
