# Quickstart: Cloud Specification Sync

**Feature**: 011-cloud-spec-sync
**Date**: 2026-01-11

## Overview

This guide walks you through setting up cloud sync for your spec-kit project, enabling multi-user collaboration.

## Prerequisites

- Node.js 18+ installed
- A spec-kit project with specs in `specs/` directory
- Internet connection
- Claude Code or another MCP-compatible AI assistant (for MCP sync)

## Setup Steps

### 1. Create a SpecBoard Account

1. Visit your SpecBoard instance (e.g., http://localhost:3000)
2. Click "Cloud" in the navigation
3. Click "Go to Sign In"
4. Choose email/password or OAuth (Google/GitHub)

### 2. Create a Cloud Project

1. After signing in, you'll see the Cloud Projects dashboard
2. Click "New Project"
3. Enter a project name and optional description
4. Click "Create Project"

### 3. Generate an API Token

To sync specs via the MCP server, you need an API token:

1. Go to Settings → API Tokens
2. Click "Generate New Token"
3. Give it a descriptive name (e.g., "My Laptop - Claude Code")
4. Copy the token (you won't see it again!)

### 4. Configure the MCP Server

Add the specboard-mcp server to your Claude Code configuration:

**For Claude Code** (`.claude/mcp.json`):
```json
{
  "mcpServers": {
    "spec-board": {
      "command": "node",
      "args": ["/path/to/spec-board/packages/specboard-mcp/dist/index.js"],
      "env": {
        "SPECBOARD_API_URL": "http://localhost:3000",
        "SPECBOARD_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

**Environment Variables:**
- `SPECBOARD_API_URL`: Your SpecBoard instance URL
- `SPECBOARD_API_TOKEN`: The API token you generated

### 5. Push Your Specs to Cloud

With Claude Code (or another MCP client), use the `push_spec` tool:

```
Push my local specs to the cloud project "my-project-id"
```

The MCP server will:
1. Read all spec files from your `specs/` directory
2. Upload them to the cloud project
3. Report which files were synced

### 6. View in Dashboard

1. Visit your SpecBoard instance
2. Click on your project in the Cloud dashboard
3. See your specs in the Kanban board

## Inviting Team Members

### Generate a Link Code

1. Open your project in the Cloud dashboard
2. Click "Settings" → "Team"
3. Click "Generate Link Code"
4. Choose role (View or Edit)
5. Share the 6-character code with your teammate (expires in 24h)

### Team Member Joins

Your teammate:
1. Signs in to SpecBoard
2. Clicks "Connect to Project"
3. Enters the link code
4. Gets access with the assigned role

## Daily Workflow

### Push Your Changes

After editing specs locally, ask Claude Code:
```
Push my spec changes to cloud project "my-project-id"
```

### Pull Team Changes

To get changes from teammates:
```
Pull the latest specs from cloud project "my-project-id" to my local project
```

### View Sync Status

Check the Cloud dashboard to see:
- Last sync time
- Who modified each spec
- Any pending conflicts

### Resolve Conflicts

If two people edit the same file:
1. The dashboard shows a conflict indicator
2. Click on the conflicted spec
3. Use the side-by-side diff view
4. Choose: Keep Local, Keep Cloud, or Manual Merge

## MCP Tools Reference

### push_spec

Upload local specs to SpecBoard cloud.

**Parameters:**
- `projectPath` (required): Local path to the spec-kit project root
- `cloudProjectId` (required): Cloud project ID or slug
- `featureId` (optional): Specific feature to push (omit for all)

**Example:**
```json
{
  "projectPath": "/Users/me/my-project",
  "cloudProjectId": "abc123",
  "featureId": "001-auth"
}
```

### pull_spec

Download specs from SpecBoard cloud to local.

**Parameters:**
- `projectPath` (required): Local path to the spec-kit project root
- `cloudProjectId` (required): Cloud project ID or slug
- `featureId` (optional): Specific feature to pull (omit for all)

**Example:**
```json
{
  "projectPath": "/Users/me/my-project",
  "cloudProjectId": "abc123"
}
```

## Troubleshooting

### "Unauthorized" or "Invalid token"

Your API token may be expired or invalid. Generate a new one in Settings → API Tokens.

### "Project not found"

Check that:
- The `cloudProjectId` matches your project's ID or slug
- You have access to the project (are a member)

### "Permission denied"

Your role may be VIEW-only. Ask a project admin to upgrade your role to EDIT or ADMIN.

### "Conflict detected"

Two people edited the same file. Use the Cloud dashboard to resolve the conflict.

### MCP Server Not Connecting

1. Check that the MCP server path is correct in your config
2. Verify environment variables are set
3. Check the server logs for errors

## Project Structure

After syncing, your project structure remains unchanged:

```
my-project/
├── specs/
│   ├── 001-feature/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   └── 002-another/
│       └── spec.md
└── ... (other project files)
```

The MCP server is stateless - no local config files are created.

## Next Steps

- Read the [API documentation](./contracts/api.md) for integration
- Set up CI/CD with `SPECBOARD_API_TOKEN` environment variable
- Explore the Cloud dashboard for team activity and version history
