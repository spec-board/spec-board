# Perplexity MCP Server

AI-powered web search with synthesized answers.

## Package

```bash
npx -y perplexity-mcp
```

Requires `PERPLEXITY_API_KEY` environment variable.

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Overview

Perplexity MCP provides AI-powered web search capabilities, returning synthesized answers with citations from real-time web queries. Ideal for research, fact-checking, and gathering current information.

## Tools

| Tool | Description |
|------|-------------|
| `perplexity_ask` | Ask a question and get AI-synthesized answer |

## Tool Parameters

### perplexity_ask

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | array | Yes | Conversation messages |

Each message in the array:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | "system", "user", or "assistant" |
| `content` | string | Yes | Message content |

## Usage Examples

```
"What's the latest version of Next.js?"
→ perplexity_ask messages=[{"role": "user", "content": "What is the latest version of Next.js?"}]

"Research React Server Components"
→ perplexity_ask messages=[{"role": "user", "content": "Explain React Server Components and their benefits"}]

"Find best practices for API design"
→ perplexity_ask messages=[{"role": "user", "content": "What are the current best practices for REST API design in 2025?"}]
```

## Response Format

Responses include:
- Synthesized answer from multiple sources
- Citations with source URLs
- Confidence indicators
- Related topics

## When to Use

| Scenario | Use Perplexity? |
|----------|-----------------|
| Current information | ✅ Yes |
| Technology research | ✅ Yes |
| Fact-checking | ✅ Yes |
| Best practices | ✅ Yes |
| News and updates | ✅ Yes |
| Library documentation | ❌ Use Context7 |
| Code examples | ❌ Use Context7 |
| Historical data | ⚠️ Limited |

## Comparison with Context7

| Feature | Perplexity | Context7 |
|---------|------------|----------|
| Real-time web search | ✅ | ❌ |
| Library documentation | ❌ | ✅ |
| Code examples | Limited | ✅ |
| Version-specific docs | ❌ | ✅ |
| General knowledge | ✅ | ❌ |
| Current events | ✅ | ❌ |

## Integration with Skills

- Works with `researcher` agent for technology research
- Use in `deep-research` mode for thorough investigation
- Combine with `sequential-thinking` for complex research

## Best Practices

1. **Be specific**: Include dates, versions, or context
2. **Verify critical info**: Cross-reference important findings
3. **Use for current info**: Best for recent/changing information
4. **Combine sources**: Use with Context7 for complete picture

## Resources

- [Perplexity API](https://docs.perplexity.ai/)
- [Perplexity MCP](https://github.com/perplexity-ai/perplexity-mcp)
