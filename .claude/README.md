# SoupSpec

A standalone, spec-driven framework for Claude Code providing a unified specification kit for AI-assisted development.

## Quick Start

1. Copy the `.claude` folder to your project root
2. Customize `CLAUDE.md` for your project (Tech Stack, Architecture sections)
3. Create project directories referenced by specs (see Placeholder Paths below)
4. Start using commands like `/feature`, `/fix`, `/review`

## Placeholder Paths

SoupSpec references these directories that you should create in your project:

| Path | Purpose | Create When |
|------|---------|-------------|
| `./agent-includes/specs/` | Project specifications | Always recommended |
| `./agent-includes/specs/code-standards.md` | Coding conventions | Before development |
| `./agent-includes/specs/codebase-summary.md` | Project overview | After initial setup |
| `./agent-includes/specs/system-architecture.md` | Architecture docs | For complex projects |
| `./agent-includes/specs/development-roadmap.md` | Project roadmap | For team projects |
| `./agent-includes/specs/project-changelog.md` | Change history | For versioned projects |
| `./agent-includes/plans/` | Implementation plans | When using `/feature` |

### Directory Template

Create this structure in your project root:

```
agent-includes/
├── specs/
│   ├── code-standards.md          # Coding conventions and style guide
│   ├── codebase-summary.md        # Project overview and key files
│   ├── system-architecture.md     # Architecture documentation
│   ├── development-roadmap.md     # Project roadmap and milestones
│   └── project-changelog.md       # Change history
└── plans/
    └── YYYYMMDD-HHmm-plan-name/   # Implementation plans (auto-created by /feature)
        ├── plan.md                 # Plan overview
        ├── phase-01-*.md           # Phase files
        ├── research/               # Research reports
        └── reports/                # Agent reports
```

**Quick Setup:**
```bash
mkdir -p agent-includes/specs agent-includes/plans
touch agent-includes/specs/{code-standards,codebase-summary,system-architecture,development-roadmap,project-changelog}.md
```

These paths are templates - create them as needed for your project.

## Directory Structure

```
.claude/
├── CLAUDE.md              # Main project context (customize this!)
├── settings.json          # Permissions and hooks config
├── .agentignore           # Patterns to ignore (used by hooks)
├── agents/                # 22 specialized agents
├── commands/              # 17 workflow commands
├── modes/                 # 7 behavioral modes
├── skills/                # 40+ skills organized by category
├── workflows/             # 4 development workflows
├── hooks/                 # Event-driven automation (blind hook)
└── mcp/                   # MCP server configurations
```

## Hooks

Event-driven automation to improve Claude Code performance.

| Hook | Purpose |
|------|---------|
| `blind.cjs` | Block access to heavy directories (node_modules, __pycache__, dist, etc.) |

### Enable Hooks

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Grep|Glob",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/blind.cjs"
          }
        ]
      }
    ]
  }
}
```

See `hooks/README.md` for customization options.

## Core Features

### Agents (22)
Specialized personas for different tasks: planner, debugger, tester, code-reviewer, researcher, git-manager, docs-manager, devops-engineer, mcp-manager, and more.

### Commands (17)
Workflow automation: `/feature`, `/fix`, `/review`, `/testcases`, `/ship`, `/deploy`, `/brainstorm`, `/spawn`, etc.

### Modes (7)
Behavioral modes: default, brainstorm, token-efficient, deep-research, implementation, review, orchestration.

### Skills (40+)
Organized by category: backend, databases, devops, frontend, languages, methodology, optimization, security, testing.

## Command Flags

All commands support combinable flags:

```bash
/brainstorm --depth=5 "feature design"
/review --persona=security --format=detailed src/auth/
/fix --format=concise "error message"
```

| Flag | Description |
|------|-------------|
| `--mode=[mode]` | Behavioral mode override |
| `--depth=[1-5]` | Thoroughness (1=quick, 5=exhaustive) |
| `--format=[fmt]` | Output format (concise/detailed/json) |
| `--persona=[type]` | Expertise focus (security/performance/architecture) |
| `--save=[path]` | Save output to file |

## Customization

### CLAUDE.md

Edit the `CLAUDE.md` file to customize for your project:

1. **Tech Stack** - Update languages, frameworks, databases
2. **Architecture** - Describe your project structure
3. **Code Conventions** - Adjust naming and style rules

### Adding Custom Commands

Create a new file in `commands/`:

```markdown
# /my-command

## Description
What the command does.

---

Your prompt content here.
Use $ARGUMENTS for command arguments.
```

### Adding Custom Skills

Create a new skill in `skills/category/skillname/SKILL.md`:

```markdown
# Skill Name

## Description
Brief description for matching.

---

## Patterns
Your patterns and examples here.
```

## MCP Setup

Optional MCP servers for extended capabilities. See `mcp/README.md` for configuration.

| Server | Package | Purpose |
|--------|---------|---------|
| Context7 | `context7-mcp` | Library documentation lookup |
| Sequential Thinking | `@modelcontextprotocol/server-sequential-thinking` | Multi-step reasoning |
| Filesystem | `@modelcontextprotocol/server-filesystem` | Secure file operations |
| Playwright | `@playwright/mcp@latest` | E2E browser testing |
| Chrome DevTools | `chrome-devtools-mcp@latest` | Browser debugging via CDP |
| Magic MCP | `@21st-dev/magic-mcp` | UI component generation |
| Postman | `@postman/postman-mcp-server` | API testing |
| Figma | `figma-developer-mcp` | Design-to-code |
| Perplexity | `perplexity-mcp` | AI web search |
| GitHub | `@modelcontextprotocol/server-github` | GitHub API operations |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | Database access |
| Mem0 | `mem0-mcp` | Long-term memory |

## Workflow Examples

### Feature Development
```
/brainstorm → /feature → /testcases → /review → /ship
```

### Bug Fix
```
/fix → /testcases → /review → /ship
```

### Sprint Workflow
```
/feature → /ship
```

## License

MIT
