# specboard-mcp Package

## Purpose
Model Context Protocol (MCP) server for syncing spec-kit projects between local filesystem and SpecBoard cloud. Enables AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) to push/pull specifications programmatically.

## Overview
This package implements an MCP server that provides two tools: `pull_spec` (download specs from cloud) and `push_spec` (upload specs to cloud). It communicates with the SpecBoard API using API tokens for authentication.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `src/` | TypeScript source code |
| `src/api/` | API client for SpecBoard cloud |
| `src/tools/` | MCP tool implementations |
| `dist/` | Compiled JavaScript output |
| `test/` | Test files (mcp-test.ts, e2b-mcp-test.ts) |

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/index.ts` | MCP server entry point, tool registration | ~140 |
| `src/api/client.ts` | HTTP client for SpecBoard API | ~70 |
| `src/tools/pull-spec.ts` | Download specs from cloud to local | ~60 |
| `src/tools/push-spec.ts` | Upload specs from local to cloud | ~90 |
| `test/mcp-test.ts` | Unit tests with mock API | ~456 |
| `test/e2b-mcp-test.ts` | E2B sandbox integration tests | ~591 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ AI Coding Assistant (Claude Code, Cursor, etc.)        │
└─────────────────────┬───────────────────────────────────┘
                      │ MCP Protocol (stdio)
┌─────────────────────▼───────────────────────────────────┐
│ specboard-mcp Server (index.ts)                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tool Registry                                       │ │
│ │ - pull_spec: Download specs from cloud             │ │
│ │ - push_spec: Upload specs to cloud                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│ Local Filesystem│         │ SpecBoard API   │
│ specs/          │         │ (HTTPS)         │
│ ├─ 001-auth/    │         │ /api/sync/      │
│ ├─ 002-dash/    │         │ /api/tokens/    │
└─────────────────┘         └─────────────────┘
```

## MCP Tools

### pull_spec
Downloads specs from SpecBoard cloud to local project.

**Parameters:**
- `projectPath` (string, required): Local path to spec-kit project root
- `cloudProjectId` (string, required): Cloud project ID or slug
- `featureId` (string, optional): Specific feature to pull (omit for all)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  pulledFeatures: string[];  // Feature IDs pulled
  filesWritten: number;      // Total files written
}
```

**Example Usage:**
```typescript
// Pull all features
await pullSpec('/path/to/project', 'my-cloud-project');

// Pull specific feature
await pullSpec('/path/to/project', 'my-cloud-project', '001-auth');
```

### push_spec
Uploads specs from local project to SpecBoard cloud.

**Parameters:**
- `projectPath` (string, required): Local path to spec-kit project root
- `cloudProjectId` (string, required): Cloud project ID or slug
- `featureId` (string, optional): Specific feature to push (omit for all)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  pushedFeatures: string[];  // Feature IDs pushed
  filesUploaded: number;     // Total files uploaded
}
```

**Example Usage:**
```typescript
// Push all features
await pushSpec('/path/to/project', 'my-cloud-project');

// Push specific feature
await pushSpec('/path/to/project', 'my-cloud-project', '001-auth');
```

## API Client

The `api/client.ts` module provides HTTP communication with SpecBoard cloud:

| Function | Purpose |
|----------|---------|
| `getApiConfig()` | Read API token and URL from environment |
| `fetchCloudSpecs()` | GET specs from cloud project |
| `uploadSpecs()` | POST specs to cloud project |

**Environment Variables:**
- `SPEC_BOARD_API_TOKEN` (required): API token from SpecBoard dashboard
- `SPEC_BOARD_API_URL` (optional): Custom API URL (default: https://spec-board.app/api)

## File Format

Specs are synced as markdown files following spec-kit structure:

```
specs/
└── {feature-id}/
    ├── spec.md      # Feature specification
    ├── plan.md      # Implementation plan
    └── tasks.md     # Task list
```

Each file is synced with:
- Content (markdown text)
- File type (spec, plan, tasks)
- Last modified timestamp
- Checksum (for conflict detection)

## Authentication

Uses API token authentication:

1. User logs into SpecBoard dashboard
2. Generates API token from Settings → API Tokens
3. Configures MCP server with token in environment variable
4. MCP server includes token in `Authorization: Bearer {token}` header

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "Project path does not exist" | Invalid local path | Verify path exists |
| "Specs directory does not exist" | No specs/ folder | Create specs/ directory |
| "Unauthorized" | Invalid/expired token | Generate new token |
| "Network error" | API unreachable | Check internet connection |

## Testing

### Unit Tests (test/mcp-test.ts)
- Mock API server with in-memory storage
- Tests push/pull operations
- Tests error handling
- Tests round-trip sync

**Run tests:**
```bash
pnpm test
```

### E2B Sandbox Tests (test/e2b-mcp-test.ts)
- Tests MCP protocol in isolated E2B sandbox
- Validates tool listing and execution
- Tests error handling in real environment

**Run E2B tests:**
```bash
E2B_API_KEY=xxx pnpm test:e2b
```

## Development

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Watch mode
pnpm dev

# Run locally
SPEC_BOARD_API_TOKEN=xxx node dist/index.js
```

## Configuration Examples

### Claude Code (~/.claude/settings.json)
```json
{
  "mcpServers": {
    "spec-board": {
      "command": "npx",
      "args": ["specboard-mcp"],
      "env": {
        "SPEC_BOARD_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Cursor / Other AI Assistants
```json
{
  "spec-board": {
    "command": "npx",
    "args": ["specboard-mcp"],
    "env": {
      "SPEC_BOARD_API_TOKEN": "your-token-here"
    }
  }
}
```

## Patterns & Conventions

- **Stdio Transport**: MCP server uses stdio for communication (stdin/stdout)
- **Error Responses**: Return `{ isError: true }` for tool errors
- **JSON Responses**: All tool results are JSON-stringified
- **Async Operations**: All tools are async functions
- **Path Validation**: Validate paths exist before operations

## Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **Node.js fs/promises**: Filesystem operations
- **Node.js crypto**: Checksum generation (SHA-256)

## Important Notes

- Server runs locally with filesystem access
- Communicates with SpecBoard cloud via HTTPS
- API token must be kept secure (never commit to git)
- Supports all AI assistants with MCP protocol support
- Follows spec-kit folder structure conventions
