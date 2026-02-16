# AI Directory

## Purpose
AI client for generating spec-kit content using OpenAI-compatible APIs.

## Overview
This module provides AI-powered features for spec-workflow: generating specs, plans, tasks, and analyzing document consistency. Supports Ollama, LM Studio, and any OpenAI-compatible endpoint.

## Key Files

| File | Purpose |
|------|---------|
| `client.ts` | AIService class with real AI implementations |
| `types.ts` | TypeScript interfaces for AI operations |
| `settings.ts` | AI configuration retrieval from database |
| `mock.ts` | Mock implementations (NOT for production) |
| `index.ts` | Module exports |

## AIService Methods

| Method | Purpose |
|--------|---------|
| `generateUserStories()` | Generate user stories from description |
| `generateSpecKit()` | Generate full spec-kit structure |
| `generateSpec()` | Generate spec.md content |
| `generateClarify()` | Generate clarification questions |
| `generatePlan()` | Generate plan.md content |
| `generateTasks()` | Generate tasks.md content |
| `analyzeDocuments()` | Analyze consistency across spec, plan, tasks |
| `generateConstitution()` | Generate project constitution |

## Configuration

AI settings retrieved from database via `getAISettings()`:
- `provider`: 'openai' (only supported)
- `apiKey`: API key for OpenAI-compatible endpoint
- `baseUrl`: Custom endpoint URL (e.g., Ollama, LM Studio)
- `model`: Model name (default: gpt-4o)

## Mandatory Policies

- **ALWAYS use real AI**: Never return mock data
- **Use AIService from client.ts**: All AI operations must use this class
- **No mock fallback**: Throw error if no API key configured
- **Settings from database**: Use `getAISettings()` not hardcoded values

## Dependencies

- **Internal**: `@/types`
- **External**: None (uses fetch API)

## Important Notes

- Parser is server-only, cannot run in browser
- Mock implementations exist in `mock.ts` for development testing ONLY
- All AI calls are async and return structured data
