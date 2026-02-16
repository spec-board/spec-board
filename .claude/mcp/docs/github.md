# GitHub MCP Server

GitHub API operations for repositories, issues, and pull requests.

## Package

```bash
npx -y @modelcontextprotocol/server-github
```

Requires `GITHUB_TOKEN` environment variable.

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Overview

The GitHub MCP server provides access to GitHub API operations through standardized MCP primitives. It enables repository management, issue tracking, pull request operations, and version control directly from AI assistants.

## Tools

| Tool | Description |
|------|-------------|
| `create_repository` | Create a new repository |
| `get_repository` | Get repository details |
| `list_repositories` | List user/org repositories |
| `create_issue` | Create a new issue |
| `get_issue` | Get issue details |
| `list_issues` | List repository issues |
| `update_issue` | Update an existing issue |
| `create_pull_request` | Create a pull request |
| `get_pull_request` | Get PR details |
| `list_pull_requests` | List repository PRs |
| `merge_pull_request` | Merge a pull request |
| `create_branch` | Create a new branch |
| `list_branches` | List repository branches |
| `get_file_contents` | Get file contents from repo |
| `create_or_update_file` | Create or update a file |
| `search_repositories` | Search for repositories |
| `search_code` | Search code across repos |
| `search_issues` | Search issues and PRs |

## Tool Parameters

### create_repository

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Repository name |
| `description` | string | No | Repository description |
| `private` | boolean | No | Private repository |
| `auto_init` | boolean | No | Initialize with README |

### create_issue

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |
| `title` | string | Yes | Issue title |
| `body` | string | No | Issue body |
| `labels` | array | No | Issue labels |
| `assignees` | array | No | Assignees |

### create_pull_request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |
| `title` | string | Yes | PR title |
| `body` | string | No | PR description |
| `head` | string | Yes | Head branch |
| `base` | string | Yes | Base branch |
| `draft` | boolean | No | Create as draft |

### get_file_contents

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner` | string | Yes | Repository owner |
| `repo` | string | Yes | Repository name |
| `path` | string | Yes | File path |
| `ref` | string | No | Branch/tag/commit |

### search_code

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `sort` | string | No | Sort field |
| `order` | string | No | "asc" or "desc" |
| `per_page` | integer | No | Results per page |

## Usage Examples

```
"Create a new issue for the bug"
→ create_issue owner="user" repo="project" title="Bug: Login fails" body="..."

"List open pull requests"
→ list_pull_requests owner="user" repo="project" state="open"

"Search for authentication code"
→ search_code q="auth login repo:user/project"

"Get the README file"
→ get_file_contents owner="user" repo="project" path="README.md"

"Create a feature branch"
→ create_branch owner="user" repo="project" branch="feature/new-feature" from="main"
```

## When to Use

| Scenario | Use GitHub MCP? |
|----------|-----------------|
| Issue management | ✅ Yes |
| PR operations | ✅ Yes |
| Repository management | ✅ Yes |
| Code search | ✅ Yes |
| File operations | ✅ Yes |
| Local git operations | ❌ Use git CLI |
| Complex git workflows | ❌ Use git CLI |

## Security Notes

- Requires GitHub personal access token
- Token permissions determine available operations
- Use fine-grained tokens with minimal scopes
- Never commit tokens to repositories

## Integration with Skills

- Works with `git-manager` agent for version control
- Use in `/ship` command for PR automation
- Combine with `code-reviewer` agent for PR reviews

## Resources

- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub Token Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
