# Primary Workflow

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT**: Ensure token efficiency while maintaining high quality.

#### 1. Code Implementation
- Before you start, delegate to `planner` agent to create a implementation plan with TODO tasks in `./agent-includes/plans` directory.
- When in planning phase, use multiple `researcher` agents in parallel to conduct research on different relevant technical topics and report back to `planner` agent to create implementation plan.
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios
- **DO NOT** create new enhanced files, update to the existing files directly.
- **[IMPORTANT]** After creating or modifying code file, run compile command/script to check for any compile errors.

#### 2. Testing
- Delegate to `tester` agent to run tests and analyze the summary report.
  - Write comprehensive unit tests
  - Ensure high code coverage
  - Test error scenarios
  - Validate performance requirements
- Tests are critical for ensuring code quality and reliability, **DO NOT** ignore failing tests just to pass the build.
- **IMPORTANT:** make sure you don't use fake data, mocks, cheats, tricks, temporary solutions, just to pass the build or github actions.
- **IMPORTANT:** Always fix failing tests follow the recommendations and delegate to `tester` agent to run tests again, only finish your session when all tests pass.

#### 3. Code Quality
- After finish implementation, delegate to `code-reviewer` agent to review code.
- Delegate to `code-simplifier` agent (from `pr-review-toolkit` plugin) to simplify and polish code.
- Follow coding standards and conventions
- Write self-documenting code
- Add meaningful comments for complex logic
- Optimize for performance and maintainability

#### 4. Optional Post-Completion Review (--review flag)

When using `/do --review`, `/fix --review`, or `/refactor --review`, after task completion:

```
✓ [Command] completed
  Changed: [list of changed files]

Review options:
  1) Full codebase review
  2) Changed files only
  3) Skip review
```

This provides an opportunity for comprehensive code review after any development task.

#### 5. Integration
- Always follow the plan given by `planner` agent
- Ensure seamless integration with existing code
- Follow API contracts precisely
- Maintain backward compatibility
- Document breaking changes
- Delegate to `docs-manager` agent to update docs in `./agent-includes/specs` directory if any.

#### 6. Debugging
- When a user report bugs or issues on the server or a CI/CD pipeline, delegate to `debugger` agent to run tests and analyze the summary report.
- Read the summary report from `debugger` agent and implement the fix.
- Delegate to `tester` agent to run tests and analyze the summary report.
- If the `tester` agent reports failed tests, fix them follow the recommendations and repeat from the **Step 2**.

#### 7. Deployment (Optional)
- When ready to deploy, delegate to `devops-engineer` agent.
- Activate `devops` skill for Docker, CI/CD, cloud platforms, and VPS deployment.
- **For Netlify**: Activate `netlify` skill, use `netlify deploy --prod` or `/ship --netlify`.
- Verify health checks and SSL after deployment.
- For CI/CD setup, create GitHub Actions workflow in `.github/workflows/`.

**Deployment Platform Quick Reference:**
| Platform | Skill | Command |
|----------|-------|---------|
| Netlify | `netlify` | `netlify deploy --prod` or `/ship --netlify` |
| Docker/VPS | `devops` | `docker-compose up -d` |
| Vercel | `devops` | `vercel --prod` |

---

## Sprint Workflow

For structured task management, use the sprint workflow commands:

#### Sprint Commands
| Command | Purpose |
|---------|---------|
| `/do` | Full feature development with planning |
| `/ship` | Commit + PR workflow |

#### Sprint Cycle
1. **Plan & Execute**: Use `/do` to create plan and implement tasks
2. **Complete**: Use `/ship` to commit and create PR

#### Best Practices
- Use plan mode (Shift+Tab twice) for complex features before implementation
- Keep tasks atomic and independently completable
- Run validation before marking tasks complete
- Use TodoWrite tool for task management when available
- Make atomic commits with descriptive messages
