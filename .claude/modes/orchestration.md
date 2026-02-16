# Orchestration Mode

## Description

Multi-agent coordination mode for managing complex tasks that benefit from parallel execution, task delegation, and result aggregation. **This mode handles all parallel execution internally** using the Task tool with background agents - no separate `/parallel` command needed.

## When to Use

- Large-scale refactoring across 5+ files
- Complex feature implementation with distinct, independent modules
- Coordinating multiple concerns that are truly isolated
- **Only when parallel execution provides clear benefit over sequential**

## When NOT to Use (Prefer Sequential)

- Tasks with fewer than 3 independent problem domains
- Changes that touch shared code or state
- Investigation/debugging requiring iterative discovery
- When coordination between changes is critical
- Simple tasks that can be done directly without delegation

---

## Behavior

### Communication
- Task delegation clarity
- Progress aggregation
- Coordination updates
- Final synthesis

### Problem Solving
- Identify parallelizable work
- **Spawn background agents via Task tool**
- **Track task IDs internally**
- Aggregate results
- Resolve conflicts

### Output Format
- Task breakdown
- Agent assignments with task IDs
- Progress tracking
- Consolidated results

---

## Task Tool Integration (Core Logic)

**Orchestration mode directly manages the Task tool** for all parallel execution. No `/parallel` command needed.

### Spawning Background Agents

Use Task tool with `run_in_background: true`:

```python
# Spawn parallel agents directly
Task(
    prompt="Research authentication patterns",
    subagent_type="general-purpose",
    run_in_background=True
)  # Returns task_id: "task-abc123"

Task(
    prompt="Analyze current security",
    subagent_type="general-purpose",
    run_in_background=True
)  # Returns task_id: "task-def456"
```

### Task ID Management

Track all spawned tasks in a registry:

```markdown
## Active Task Registry

| Task ID | Description | Agent Type | Status |
|---------|-------------|------------|--------|
| task-abc123 | Research auth patterns | general-purpose | 🔄 Running |
| task-def456 | Analyze security | general-purpose | 🔄 Running |
| task-ghi789 | Review competitors | Explore | ✅ Complete |
```

### Collecting Results

Use TaskOutput tool to collect results:

```python
# Non-blocking check
TaskOutput(task_id="task-abc123", block=False, timeout=5000)

# Blocking wait for completion
TaskOutput(task_id="task-abc123", block=True, timeout=30000)
```

---

## Orchestration Pattern

### Phase 1: Analysis & Decomposition
```markdown
## Task Decomposition

Total work: [description]

### Parallelizable Tasks (spawn in parallel)
1. [Task A] - Can run independently → spawn background agent
2. [Task B] - Can run independently → spawn background agent
3. [Task C] - Can run independently → spawn background agent

### Sequential Tasks (wait for dependencies)
4. [Task D] - Depends on A, B → wait, then execute
5. [Task E] - Final integration → execute last
```

### Phase 2: Spawn & Track
```markdown
## Agent Spawning

Launching parallel agents via Task tool:

| Task | Agent Type | Task ID | Status |
|------|------------|---------|--------|
| Research auth | general-purpose | task-abc123 | 🔄 Running |
| Analyze security | Explore | task-def456 | 🔄 Running |
| Review code | general-purpose | task-ghi789 | 🔄 Running |

All independent tasks spawned in parallel.
```

### Phase 3: Monitor & Collect
```markdown
## Progress Monitoring

Checking task status via TaskOutput(block=False):

| Task ID | Status | Progress |
|---------|--------|----------|
| task-abc123 | 🔄 Running | 60% |
| task-def456 | ✅ Complete | 100% |
| task-ghi789 | 🔄 Running | 40% |

Collecting completed results...
```

### Phase 4: Aggregation & Synthesis
```markdown
## Results

### Task A (task-abc123): Complete ✅
- Findings: [summary from TaskOutput]

### Task B (task-def456): Complete ✅
- Results: [summary from TaskOutput]

### Task C (task-ghi789): Complete ✅
- Findings: [summary from TaskOutput]

### Synthesis
[Combined conclusions and next steps]
```

---

## Activation

```
Use mode: orchestration
```

Or use command flag:
```
/do --mode=orchestration [desc]
/do --mode=orchestration [task]
```

---

## Task Parallelization Rules

### Coordination-First Principle

**Sequential execution is the default.** Parallel execution is an optimization, not a starting point.

Before considering parallel execution, ask:
1. Will parallel execution actually save time?
2. Can results be cleanly integrated?
3. Is the coordination overhead worth it?

### Prerequisites for Parallel Execution

All conditions must be met:
- [ ] 3+ truly independent problem domains
- [ ] No shared files between any tasks
- [ ] No shared state or dependencies
- [ ] Clear, non-overlapping scope boundaries
- [ ] Low conflict potential (assessed explicitly)
- [ ] Integration strategy defined upfront

### Good Candidates for Parallel
- Independent file modifications in separate directories
- Research tasks across completely different areas
- Test generation for isolated, unrelated modules
- Documentation for separate, standalone components

### Must Be Sequential
- Tasks with any dependencies
- Database migrations
- Changes to shared state or utilities
- Integration after parallel work
- Debugging/investigation (requires iterative discovery)
- Changes that might affect each other

### Decision Matrix

| Condition | Parallelize? |
|-----------|--------------|
| No shared files | ✅ Yes |
| Independent modules | ✅ Yes |
| Shared dependencies | ❌ No |
| Order matters | ❌ No |
| Can merge results | ✅ Yes |

---

## Quality Gates

Between parallel phases:
1. Verify all agents completed
2. Check for conflicts
3. Review combined results
4. Run integration tests
5. Proceed to next phase

```markdown
## Quality Gate: Phase 1 → Phase 2

### Completion Check
- [x] Agent A: Complete
- [x] Agent B: Complete
- [x] Agent C: Complete

### Conflict Check
- [x] No file conflicts
- [x] No logical conflicts
- [x] Results consistent

### Proceeding to Phase 2...
```

---

## MCP Integration

This mode leverages MCP servers for coordinated multi-agent work:

### Sequential Thinking (Primary)
```
ALWAYS use Sequential Thinking in orchestration mode:
- Plan task decomposition systematically
- Track parallel execution progress
- Coordinate agent handoffs
- Synthesize results from multiple agents
```

### Filesystem
```
For coordinated file operations:
- Track file ownership across agents
- Prevent conflicts in parallel execution
- Verify integration results
```

### Memory (Mem0)
```
For cross-agent context:
- Store task assignments and status
- Share findings between agents
- Persist orchestration state
```

---

## Combines Well With

- `/do` command (uses orchestration by default)
- `/fix` command with `--mode=orchestration`
- Complex feature development
- Multi-file refactoring

---

## Agent Types for Task Tool

When spawning background agents, use appropriate `subagent_type`:

| Agent Type | Best For |
|------------|----------|
| `general-purpose` | Multi-step tasks, research, implementation |
| `Explore` | Codebase exploration, finding files |
| `Bash` | Command execution, git operations |
| `Plan` | Architecture planning, design decisions |

### Example: Full Orchestration Flow

```python
# Phase 1: Spawn parallel research agents
task1 = Task(
    prompt="Research OAuth2 best practices for our stack",
    subagent_type="general-purpose",
    run_in_background=True
)

task2 = Task(
    prompt="Explore current auth implementation in src/auth/",
    subagent_type="Explore",
    run_in_background=True
)

task3 = Task(
    prompt="Find security vulnerabilities in auth module",
    subagent_type="general-purpose",
    run_in_background=True
)

# Phase 2: Collect results
result1 = TaskOutput(task_id=task1.id, block=True)
result2 = TaskOutput(task_id=task2.id, block=True)
result3 = TaskOutput(task_id=task3.id, block=True)

# Phase 3: Synthesize and implement (sequential)
# ... implementation based on collected results
```

---

## Migration from /parallel

The `/parallel` command functionality is now **fully integrated** into orchestration mode:

| Old `/parallel` Usage | New Orchestration Equivalent |
|-----------------------|------------------------------|
| `/parallel "task"` | `Task(prompt="task", run_in_background=True)` |
| `/parallel --list` | Check Active Task Registry |
| `/parallel --collect` | `TaskOutput(task_id=..., block=True)` |
| `/parallel --cancel [id]` | Use KillShell for background tasks |

**Benefits of integrated approach:**
- Single mode handles all parallel execution
- Automatic dependency management
- Built-in quality gates
- Unified task tracking
