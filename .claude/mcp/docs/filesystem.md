# Filesystem MCP Server

Secure file operations with directory restrictions.

## Package

```bash
npx -y @modelcontextprotocol/server-filesystem .
```

The last argument specifies the allowed directory (`.` for current directory).

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Overview

The Filesystem MCP server provides secure file system access limited to user-specified directories. It supports read/write operations with human-in-the-loop confirmation for destructive actions.

## Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read complete file contents |
| `read_file_lines` | Read specific lines from a file |
| `write_file` | Write content to a file |
| `edit_file` | Edit file with search/replace |
| `create_directory` | Create a new directory |
| `list_directory` | List directory contents |
| `directory_tree` | Generate directory structure overview |
| `move_file` | Move or rename a file |
| `search_files` | Search for files matching criteria |
| `get_file_info` | Get file metadata |
| `list_allowed_directories` | List accessible directories |

## Tool Parameters

### read_file

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to file to read |

### read_file_lines

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to file |
| `start_line` | integer | No | Starting line number |
| `end_line` | integer | No | Ending line number |

### write_file

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to file |
| `content` | string | Yes | Content to write |

### edit_file

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to file |
| `old_text` | string | Yes | Text to find |
| `new_text` | string | Yes | Replacement text |

### create_directory

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Directory path to create |

### list_directory

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Directory path to list |

### directory_tree

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Root directory path |
| `depth` | integer | No | Maximum depth to traverse |

### move_file

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | Yes | Source path |
| `destination` | string | Yes | Destination path |

### search_files

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Directory to search |
| `pattern` | string | Yes | Search pattern (glob or regex) |

### get_file_info

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to file |

Returns: size, creation time, modified time, access time, type, permissions.

## Usage Examples

```
"Read the contents of package.json"
→ read_file with path="package.json"

"List all files in the src directory"
→ list_directory with path="src"

"Show the directory structure of the project"
→ directory_tree with path="." depth=3

"Find all TypeScript files"
→ search_files with path="." pattern="**/*.ts"

"Get info about the config file"
→ get_file_info with path="config.json"
```

## When to Use

| Scenario | Use Filesystem? |
|----------|-----------------|
| Read/write files | ✅ Yes |
| Directory operations | ✅ Yes |
| File search | ✅ Yes |
| File metadata | ✅ Yes |
| Complex text editing | ❌ Use IDE tools |
| Binary file operations | ❌ Limited support |

## Security Notes

- Access restricted to specified directories only
- Destructive operations require confirmation
- Cannot access files outside allowed paths
- Review operations before confirming

## Integration with Skills

- Works with all development skills for file operations
- Use in `implementation` mode for code changes
- Combine with `codebase-explorer` agent for navigation

## Resources

- [MCP Filesystem Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
