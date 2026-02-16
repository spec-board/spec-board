# Mem0 MCP Server

Long-term memory for AI agents using semantic storage and retrieval.

## Overview

Mem0 MCP provides persistent memory capabilities for AI agents, enabling:
- Store and retrieve memories across sessions
- Semantic search over past interactions
- User preference persistence
- Project knowledge accumulation

## Configuration

```json
{
  "mcpServers": {
    "mem0": {
      "command": "npx",
      "args": ["-y", "mem0-mcp"]
    }
  }
}
```

Requires `MEM0_API_KEY` environment variable.

## Tools

### add_memory
Store information in long-term memory.

```javascript
{
  name: 'add_memory',
  arguments: {
    content: 'User prefers TypeScript over JavaScript',
    metadata: { category: 'preferences' }
  }
}
```

### search_memories
Semantic search over stored memories.

```javascript
{
  name: 'search_memories',
  arguments: {
    query: 'What are the user preferences for programming languages?',
    limit: 5
  }
}
```

### get_all_memories
Retrieve all memories for a user/context.

```javascript
{
  name: 'get_all_memories',
  arguments: {
    user_id: 'default'
  }
}
```

### delete_memory
Remove a specific memory.

```javascript
{
  name: 'delete_memory',
  arguments: {
    memory_id: 'mem_123'
  }
}
```

## Use Cases

### Design Decisions
```
Store: "Project uses App Router pattern for Next.js"
Store: "Authentication implemented with Better Auth"
Store: "Database schema follows soft-delete pattern"
```

### User Preferences
```
Store: "User prefers concise responses"
Store: "User works primarily with Python and TypeScript"
Store: "User's timezone is UTC+7"
```

### Project Context
```
Store: "API endpoints follow RESTful conventions"
Store: "Frontend uses shadcn/ui component library"
Store: "Tests use vitest with React Testing Library"
```

## Best Practices

1. **Be specific**: Store concrete, actionable information
2. **Add context**: Include relevant metadata for better retrieval
3. **Update regularly**: Keep memories current as project evolves
4. **Search before storing**: Avoid duplicate memories
5. **Clean up**: Remove outdated or incorrect memories

## Integration with Modes

### Brainstorm Mode
- Store design decisions and rationale
- Remember explored alternatives
- Track user preferences for future sessions

### Deep Research Mode
- Store research findings
- Remember technology evaluations
- Persist comparison results

## Resources

- [Mem0 Documentation](https://docs.mem0.ai/)
- [Mem0 MCP Guide](https://docs.mem0.ai/platform/mem0-mcp)
- [OpenMemory](https://docs.mem0.ai/openmemory/overview)
