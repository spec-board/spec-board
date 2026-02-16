# Postman MCP Server

API testing automation with workspaces, collections, and environments.

## Package

```bash
npx @postman/postman-mcp-server --full --region us
```

Requires `POSTMAN_API_KEY` environment variable.

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Overview

The Postman MCP server enables API testing workflows, collection management, and environment configuration through Postman's API. It supports both full mode (all features) and minimal mode (basic operations).

## Modes

| Mode | Flag | Description |
|------|------|-------------|
| Full | `--full` | All Postman API operations |
| Minimal | (default) | Basic resource management |

## Region Options

| Region | Flag | Endpoint |
|--------|------|----------|
| US | `--region us` | api.postman.com |
| EU | `--region eu` | api.eu.postman.com |

## Tools

### Workspace Management

| Tool | Description |
|------|-------------|
| `createWorkspace` | Create a new workspace |
| `getWorkspace` | Get workspace details |
| `listWorkspaces` | List all workspaces |
| `updateWorkspace` | Update workspace settings |
| `deleteWorkspace` | Delete a workspace |

### Collection Management

| Tool | Description |
|------|-------------|
| `createCollection` | Create a new collection |
| `getCollection` | Get collection details |
| `listCollections` | List collections in workspace |
| `updateCollection` | Update collection |
| `deleteCollection` | Delete a collection |
| `runCollection` | Execute collection tests |

### Environment Management

| Tool | Description |
|------|-------------|
| `createEnvironment` | Create a new environment |
| `getEnvironment` | Get environment details |
| `listEnvironments` | List environments |
| `updateEnvironment` | Update environment variables |
| `deleteEnvironment` | Delete an environment |

### API Operations

| Tool | Description |
|------|-------------|
| `createApi` | Create API definition |
| `getApi` | Get API details |
| `listApis` | List APIs |
| `generateCollection` | Generate collection from spec |

### User Operations

| Tool | Description |
|------|-------------|
| `getAuthenticatedUser` | Get current user info |

## Tool Parameters

### createWorkspace

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Workspace name |
| `type` | string | No | "personal", "team", "private" |
| `description` | string | No | Workspace description |

### createCollection

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace` | string | Yes | Workspace ID |
| `name` | string | Yes | Collection name |
| `schema` | object | No | Collection schema |

### runCollection

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | Yes | Collection ID |
| `environment` | string | No | Environment ID |
| `iterationCount` | integer | No | Number of iterations |

### createEnvironment

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace` | string | Yes | Workspace ID |
| `name` | string | Yes | Environment name |
| `values` | array | No | Environment variables |

## Usage Examples

```
"Create a new API testing workspace"
→ createWorkspace name="API Tests" type="team"

"List all collections"
→ listCollections workspace="workspace-id"

"Run the authentication tests"
→ runCollection collection="collection-id" environment="env-id"

"Create staging environment"
→ createEnvironment workspace="ws-id" name="Staging" values=[{"key": "base_url", "value": "https://staging.api.com"}]

"Generate collection from OpenAPI spec"
→ generateCollection api="api-id" name="Generated Collection"
```

## Remote Server (No Local Install)

```json
{
  "mcpServers": {
    "postman": {
      "type": "sse",
      "url": "https://mcp.postman.com/mcp",
      "headers": {
        "Authorization": "Bearer ${POSTMAN_API_KEY}"
      }
    }
  }
}
```

## When to Use

| Scenario | Use Postman MCP? |
|----------|------------------|
| API testing | ✅ Yes |
| Collection management | ✅ Yes |
| Environment setup | ✅ Yes |
| Spec-to-collection | ✅ Yes |
| Quick API calls | ❌ Use curl/httpie |
| Load testing | ❌ Use Newman/k6 |

## Integration with Skills

- Works with `tester` agent for API testing
- Use in `testing/postman` skill for test patterns
- Combine with `api-designer` agent for API development

## Best Practices

1. **Organize by workspace**: Group related collections
2. **Use environments**: Separate dev/staging/prod configs
3. **Version collections**: Track changes over time
4. **Automate tests**: Run collections in CI/CD

## Resources

- [Postman MCP Server](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/)
- [Postman API Documentation](https://www.postman.com/postman/workspace/postman-public-workspace/documentation/12959542-c8142d51-e97c-46b6-bd77-52bb66712c9a)
- [Postman Learning Center](https://learning.postman.com/)
