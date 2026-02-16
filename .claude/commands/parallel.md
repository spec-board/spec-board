# /parallel - Run Parallel Tasks (Deprecated)

> **DEPRECATED**: This command's functionality is now fully integrated into **orchestration mode**. Use `/mode-orchestration` or `--mode=orchestration` instead.

## Migration

The `/parallel` command has been replaced by orchestration mode's built-in Task tool management:

| Old `/parallel` Usage | New Orchestration Equivalent |
|-----------------------|------------------------------|
| `/parallel "task"` | `Task(prompt="task", run_in_background=True)` |
| `/parallel --list` | Check Active Task Registry in orchestration output |
| `/parallel --collect` | `TaskOutput(task_id=..., block=True)` |
| `/parallel --cancel [id]` | Use KillShell for background tasks |

## How to Use Orchestration Mode Instead

```bash
# Activate orchestration mode globally
/mode-orchestration

# Or use with specific commands
/do --mode=orchestration "implement feature with parallel research"
/fix --mode=orchestration "debug issue with parallel analysis"
```

Orchestration mode automatically:
- Identifies parallelizable tasks
- Spawns background agents via Task tool
- Tracks task IDs internally
- Collects and synthesizes results
- Manages dependencies between tasks

See `.claude/modes/orchestration.md` for full documentation.

---

## Legacy Usage (Still Supported)

For backwards compatibility, this command still works but internally uses orchestration mode logic.

## Purpose

Launch background tasks for parallel execution. Enables concurrent work on independent tasks with result aggregation capability.

## Usage

```
/parallel [task description | --list | --collect | --cancel [id]]
```

## Arguments

- `$ARGUMENTS`: Task description to run in parallel, or management flags (--list, --collect, --cancel)

---

Launch background task or manage running tasks.

## Parallel Operations

### Launch Task

Start a new background task:

```bash
/parallel "[task description]"
```

**Process:**
1. Analyze task for parallelizability
2. Launch subagent with task via Task tool (`run_in_background: true`)
3. Return task ID for tracking
4. Continue main conversation

### List Tasks

Show running and completed tasks:

```bash
/parallel --list
```

### Collect Results

Collect results from completed tasks:

```bash
/parallel --collect
```

### Cancel Task

Stop a running task:

```bash
/parallel --cancel [id]
```

## Task Types

| Type | Best For | Agent Used |
|------|----------|------------|
| Research | Information gathering | general-purpose |
| Analysis | Code analysis | Explore |
| Review | Code review | general-purpose |
| Test | Test generation | general-purpose |
| Scan | Security scanning | general-purpose |

## Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--list` | Show all tasks | `--list` |
| `--collect` | Gather completed results | `--collect` |
| `--cancel [id]` | Cancel running task | `--cancel task-123` |
| `--wait` | Wait for all tasks to complete | `--wait` |
| `--agent=[type]` | Specify agent type | `--agent=Explore` |
| `--priority=[high\|normal]` | Task priority | `--priority=high` |

## Usage Examples

```bash
/parallel "Research OAuth2 best practices"
/parallel "Analyze user service for performance issues"
/parallel "Security review of auth module" --agent=general-purpose
/parallel --list
/parallel --collect
/parallel --wait                    # Wait for all to complete
```
