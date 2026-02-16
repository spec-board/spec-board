# SoupSpec Project Index

> **Version**: 1.2.0 | **Last Updated**: 2026-01-07

## Quick Navigation

| Category | Location | Count |
|----------|----------|-------|
| **Entry Point** | `.claude/CLAUDE.md` | Main configuration |
| **Agents** | `.claude/agents/` | 22 agents |
| **Commands** | `.claude/commands/` | 20 commands |
| **Skills** | `.claude/skills/` | 43 categories |
| **Modes** | `.claude/modes/` | 7 modes |
| **Workflows** | `.claude/workflows/` | 4 workflows |
| **Hooks** | `.claude/hooks/` | 4 hooks (2 pairs) |
| **MCP** | `.claude/mcp/` | 11 servers |

---

## Directory Structure

```
.claude/
├── CLAUDE.md                 # Main configuration and instructions
├── README.md                 # Setup and usage guide
├── PROJECT_INDEX.md          # This file
├── settings.json             # Permissions and hooks config
├── mcp.json                  # MCP server registry
│
├── agents/                   # 22 specialized agent definitions
│   ├── api-designer.md
│   ├── brainstormer.md
│   ├── cicd-manager.md
│   ├── code-reviewer.md
│   ├── codebase-explorer.md
│   ├── copywriter.md
│   ├── database-admin.md
│   ├── debugger.md
│   ├── devops-engineer.md
│   ├── docs-manager.md
│   ├── fullstack-developer.md
│   ├── git-manager.md
│   ├── journal-writer.md
│   ├── mcp-manager.md
│   ├── pipeline-architect.md
│   ├── planner.md
│   ├── project-manager.md
│   ├── researcher.md
│   ├── security-auditor.md
│   ├── tester.md
│   ├── ui-ux-designer.md
│   ├── vulnerability-scanner.md
│   └── CLAUDE.md
│
├── commands/                 # 20 slash command definitions
│   ├── README.md
│   ├── chat.md               # Interactive discussion
│   ├── codebase.md           # Codebase exploration
│   ├── deploy.md             # Multi-platform deployment
│   ├── do.md                 # Feature development (TDD)
│   ├── docs.md               # Documentation generation
│   ├── fix.md                # Bug fixing (Socratic)
│   ├── mode-*.md             # Mode switching commands (7)
│   ├── optimize.md           # Performance optimization
│   ├── parallel.md           # Parallel task execution
│   ├── qa.md                 # Quality assurance
│   ├── refactor.md           # Code refactoring
│   ├── ship.md               # Git commit and PR
│   ├── spike.md              # Technology research
│   ├── test.md               # Test generation & E2B execution
│   └── CLAUDE.md
│
├── modes/                    # 7 behavioral mode configs
│   ├── default.md            # Standard balanced mode
│   ├── brainstorm.md         # Creative exploration
│   ├── deep-research.md      # Thorough analysis
│   ├── implementation.md     # Code-focused
│   ├── orchestration.md      # Multi-task coordination
│   ├── review.md             # Critical analysis
│   ├── token-efficient.md    # Cost optimization
│   └── CLAUDE.md
│
├── workflows/                # Development workflow definitions
│   ├── primary-workflow.md   # Main development process
│   ├── development-rules.md  # Coding standards
│   ├── documentation-management.md
│   ├── orchestration-protocol.md
│   └── CLAUDE.md
│
├── hooks/                    # Event-driven automation
│   ├── README.md             # Hook documentation
│   ├── blind.cjs             # Block heavy directories (CommonJS)
│   ├── blind.sh              # Block heavy directories (Shell)
│   ├── secrets-aware.cjs     # Secrets detection (CommonJS)
│   ├── secrets-aware.sh      # Secrets detection (Shell)
│   ├── tests/                # Hook test suite
│   └── CLAUDE.md
│
├── mcp/                      # MCP server configurations
│   ├── README.md             # MCP setup guide
│   ├── configs/
│   │   ├── core.json         # Essential servers
│   │   ├── browser.json      # Browser automation
│   │   └── extended.json     # Additional servers
│   ├── docs/                 # MCP server documentation (12 files)
│   └── CLAUDE.md
│
└── skills/                   # 43 skill categories
    ├── README.md
    ├── INSTALLATION.md
    ├── THIRD_PARTY_NOTICES.md
    ├── agent_skills_spec.md
    ├── install.sh
    │
    ├── backend-development/  # API, auth, performance
    ├── better-auth/          # Better Auth integration
    ├── chrome-devtools/      # Browser debugging via CDP
    ├── claude-code/          # Claude Code best practices
    ├── code-review/          # Code review patterns
    ├── common/               # Shared utilities
    ├── databases/            # PostgreSQL, MongoDB
    ├── debugging/            # Systematic debugging
    ├── devops/               # Docker, CI/CD, PM2
    ├── django/               # Django framework
    ├── document-skills/      # Document processing
    ├── e2b-sandbox/          # E2B cloud sandbox execution
    ├── fastapi/              # FastAPI framework
    ├── frontend/             # shadcn/ui, Tailwind CSS
    ├── frontend-design/      # Design aesthetics
    ├── frontend-development/ # React/TypeScript patterns
    ├── languages/            # Python, TypeScript, JS
    ├── librarian/            # Documentation search
    ├── mcp-builder/          # MCP server creation
    ├── mcp-management/       # MCP server management
    ├── media-processing/     # Audio, video, image
    ├── memory/               # Memory and persistence
    ├── methodology/          # TDD, debugging, planning (14 sub-skills)
    ├── mobile-development/   # React Native, Flutter
    ├── netlify/              # Netlify deployment
    ├── nextjs/               # Next.js framework
    ├── optimization/         # Token efficiency
    ├── planning/             # Task planning
    ├── polar/                # Polar payment integration
    ├── problem-solving/      # Problem-solving patterns
    ├── react/                # React library
    ├── repomix/              # Repository packaging
    ├── research/             # Technology research
    ├── security/             # OWASP practices
    ├── sepay/                # SePay payment integration
    ├── sequential-thinking/  # Multi-step reasoning
    ├── shopify/              # Shopify development
    ├── skill-creator/        # Skill creation guide
    ├── stripe/               # Stripe payment integration
    ├── testing/              # pytest, vitest, Playwright
    ├── threejs/              # Three.js 3D graphics
    ├── uv-package-manager/   # Fast Python package management with uv
    ├── wordpress/            # WordPress development
    └── CLAUDE.md
```

---

## Key Files

### Configuration Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main instructions, conventions, and quick reference |
| `settings.json` | Tool permissions and hook configurations |
| `mcp.json` | MCP server registry with 11 servers |

### Core Workflows

| File | Purpose |
|------|---------|
| `workflows/primary-workflow.md` | Main development process |
| `workflows/development-rules.md` | Coding standards and rules |
| `workflows/orchestration-protocol.md` | Agent coordination |
| `workflows/documentation-management.md` | Documentation structure |

---

## Dependencies

### MCP Servers (11 total)

| Server | Package | Purpose |
|--------|---------|---------|
| context7 | `context7-mcp` | Library documentation lookup |
| sequential-thinking | `@modelcontextprotocol/server-sequential-thinking` | Multi-step reasoning |
| playwright | `@playwright/mcp@latest` | E2E browser testing |
| chrome-devtools | `chrome-devtools-mcp@latest` | Browser debugging |
| magic-mcp | `@21st-dev/magic-mcp` | UI component generation |
| postman | `@postman/postman-mcp-server` | API testing |
| figma | `figma-developer-mcp` | Design-to-code |
| perplexity | `perplexity-mcp` | Web search with AI |
| github | `@modelcontextprotocol/server-github` | GitHub API |
| postgres | `@modelcontextprotocol/server-postgres` | Database access |
| mem0 | `mem0-mcp` | Long-term memory |

### Hooks

| Hook | Format | Trigger | Purpose |
|------|--------|---------|---------|
| `blind.cjs` | CommonJS | PreToolUse (Bash, Read, Grep, Glob) | Block access to heavy directories |
| `blind.sh` | Shell | PreToolUse (Bash, Read, Grep, Glob) | Block access to heavy directories |
| `secrets-aware.cjs` | CommonJS | PreToolUse (Bash, Read, Grep, Glob) | Detect and warn about secrets |
| `secrets-aware.sh` | Shell | PreToolUse (Bash, Read, Grep, Glob) | Detect and warn about secrets |

---

## Agents Summary

### Development Agents
- **planner**: Task decomposition and planning
- **researcher**: Technology research and analysis
- **debugger**: Systematic debugging
- **tester**: Test generation and E2B sandbox execution
- **fullstack-developer**: Full-stack implementation

### Quality Agents
- **code-reviewer**: Code review and quality
- **security-auditor**: Security auditing
- **vulnerability-scanner**: Vulnerability scanning

### Infrastructure Agents
- **devops-engineer**: Deployment, CI/CD, Docker
- **cicd-manager**: CI/CD pipeline management
- **pipeline-architect**: Pipeline architecture
- **database-admin**: Database operations
- **mcp-manager**: MCP server management

### Documentation & Design Agents
- **docs-manager**: Documentation management
- **ui-ux-designer**: UI/UX design
- **api-designer**: API design
- **copywriter**: Content writing

### Utility Agents
- **codebase-explorer**: Codebase exploration
- **git-manager**: Git operations
- **project-manager**: Project coordination
- **brainstormer**: Creative ideation
- **journal-writer**: Development journaling

---

## Commands Summary

### Development Commands
| Command | Description |
|---------|-------------|
| `/do [desc]` | Feature development workflow (TDD) |
| `/fix [error]` | Bug fixing (Socratic method) |
| `/refactor [target]` | Code refactoring |
| `/optimize [target]` | Performance optimization |
| `/test [target]` | Test generation & E2B sandbox execution |

### Quality Commands
| Command | Description |
|---------|-------------|
| `/qa [target]` | Quality assurance (review + security + tests) |
| `/ship [msg]` | Commit and create PR |
| `/deploy [platform]` | Multi-platform deployment |

### Documentation Commands
| Command | Description |
|---------|-------------|
| `/docs [target]` | Generate documentation |

### Planning Commands
| Command | Description |
|---------|-------------|
| `/chat [topic]` | Interactive discussion |
| `/spike [topic]` | Technology research |
| `/codebase [scope]` | Codebase exploration |
| `/parallel [task]` | Parallel task execution |

### Mode Commands
| Command | Description |
|---------|-------------|
| `/mode-default` | Standard balanced mode |
| `/mode-brainstorm` | Creative exploration |
| `/mode-save-money` | Token-efficient mode |
| `/mode-deep-research` | Thorough analysis |
| `/mode-implementation` | Code-focused mode |
| `/mode-review` | Critical analysis mode |
| `/mode-orchestration` | Multi-task coordination |

---

## Test Execution (E2B Sandbox)

Tests are executed in **E2B cloud sandboxes** by default:

| Codebase Type | SDK Used |
|---------------|----------|
| Python | `e2b_code_interpreter` Python SDK |
| TypeScript/JS | `@e2b/code-interpreter` TypeScript SDK |
| Mixed | Both SDKs in parallel |

Use `--test-local` flag to run tests locally instead.

---

## Generated CLAUDE.md Files

The following CLAUDE.md files provide directory-specific context:

- `.claude/agents/CLAUDE.md`
- `.claude/commands/CLAUDE.md`
- `.claude/modes/CLAUDE.md`
- `.claude/skills/CLAUDE.md`
- `.claude/workflows/CLAUDE.md`
- `.claude/hooks/CLAUDE.md`
- `.claude/mcp/CLAUDE.md`

---

## Usage Patterns

### Delegation Pattern
```
User Request → Check for matching agent → Task tool delegation
                                       ↓
                              No match → Check for skill → Skill tool
                                       ↓
                              No match → Manual work (last resort)
```

### Command Execution Pattern
```
/command [args] → Expand to full prompt → Execute workflow
```

### Mode Activation Pattern
```
/mode-[name] → Load mode configuration → Adjust behavior
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-01-07 | Added /test command, E2B SDK integration |
| 1.1.0 | 2025-12-28 | Previous version |
