# spec-board-mcp

MCP server for syncing spec-kit projects with SpecBoard cloud.

## Installation

```bash
npm install -g spec-board-mcp
```

Or add to your AI assistant's MCP configuration directly.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPEC_BOARD_API_TOKEN` | Yes | API token from SpecBoard dashboard |
| `SPEC_BOARD_API_URL` | No | Custom API URL (default: `https://spec-board.app/api`) |

### Getting an API Token

1. Login to [SpecBoard](https://spec-board.app)
2. Go to Settings → API Tokens
3. Click "Generate New Token"
4. Copy the token and set it as `SPEC_BOARD_API_TOKEN`

## MCP Configuration

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "spec-board": {
      "command": "npx",
      "args": ["spec-board-mcp"],
      "env": {
        "SPEC_BOARD_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Cursor / Other AI Assistants

Add to your MCP configuration file:

```json
{
  "spec-board": {
    "command": "npx",
    "args": ["spec-board-mcp"],
    "env": {
      "SPEC_BOARD_API_TOKEN": "your-token-here"
    }
  }
}
```

## Tools

### pull_spec

Download specs from SpecBoard cloud to your local project.

**Parameters:**
- `projectPath` (required): Local path to spec-kit project root
- `cloudProjectId` (required): Cloud project ID or slug
- `featureId` (optional): Specific feature to pull

**Example:**
```
Pull all specs from cloud project "my-app" to local project
```

### push_spec

Upload local specs to SpecBoard cloud.

**Parameters:**
- `projectPath` (required): Local path to spec-kit project root
- `cloudProjectId` (required): Cloud project ID or slug
- `featureId` (optional): Specific feature to push

**Example:**
```
Push local specs to cloud project "my-app"
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run locally
SPEC_BOARD_API_TOKEN=xxx node dist/index.js
```

## License

MIT
