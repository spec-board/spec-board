#!/usr/bin/env node

/**
 * Team Formation Script for PRD to User Stories Feature
 *
 * This script creates an agent team to work on the feature that allows users
 * to generate user stories from PRDs using the spec-board mechanism.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Define team members with their specializations
const teamMembers = [
  {
    name: 'researcher',
    role: 'Technology Research & Analysis',
    skills: ['research', 'planning', 'sequential-thinking'],
    description: 'Responsible for researching best practices for PRD parsing and user story generation'
  },
  {
    name: 'ux-designer',
    role: 'UI/UX Designer',
    skills: ['frontend-design', 'ui-ux-rebrand', 'shadcn'],
    description: 'Designs the UI components for PRD input and user story generation'
  },
  {
    name: 'developer',
    role: 'Implementation Specialist',
    skills: ['frontend-development', 'nextjs', 'react'],
    description: 'Implements the core functionality and integrates with existing system'
  },
  {
    name: 'tester',
    role: 'Quality Assurance',
    skills: ['testing', 'vitest', 'e2b-sandbox'],
    description: 'Creates and runs tests for the new functionality'
  },
  {
    name: 'reviewer',
    role: 'Code Reviewer',
    skills: ['code-review', 'debugging', 'security'],
    description: 'Reviews code for quality, security, and best practices'
  }
];

// Create team configuration
const teamConfig = {
  name: 'prd-to-user-stories-team',
  description: 'Team for implementing PRD to User Stories generation feature',
  members: teamMembers,
  workflow: {
    phase1: 'Research and Planning',
    phase2: 'UI/UX Design',
    phase3: 'Implementation',
    phase4: 'Testing',
    phase5: 'Review and Deployment'
  },
  tools: {
    mcp: ['sequential-thinking', 'knowledge-graph', 'context7', 'morph-mcp'],
    skills: ['speckit', 'frontend', 'backend-development']
  }
};

console.log('🚀 Creating agent team for PRD to User Stories feature...');
console.log('\n📋 Team Configuration:');
console.log(JSON.stringify(teamConfig, null, 2));

// Create team directory structure
const teamDir = path.join(process.cwd(), '.claude', 'teams', 'prd-to-user-stories');
if (!fs.existsSync(teamDir)) {
  fs.mkdirSync(teamDir, { recursive: true });
}

// Create team config file
fs.writeFileSync(
  path.join(teamDir, 'config.json'),
  JSON.stringify(teamConfig, null, 2)
);

// Create team README
const teamReadme = `
# PRD to User Stories Team

This team is responsible for implementing the feature that allows users to generate user stories from Product Requirement Documents (PRDs) using the spec-board mechanism.

## Team Members

${teamMembers.map(member => `- **${member.name}** (${member.role}): ${member.description}`).join('\n')}

## Workflow

1. **Research Phase**: Investigate PRD parsing techniques and user story generation patterns
2. **Design Phase**: Create UI/UX for PRD input and user story generation
3. **Implementation Phase**: Build the core functionality and integrate with existing system
4. **Testing Phase**: Ensure functionality works as expected and is robust
5. **Review Phase**: Conduct code review and finalize implementation

## Tools & Skills

- MCP Servers: ${teamConfig.tools.mcp.join(', ')}
- Key Skills: ${teamConfig.tools.skills.join(', ')}

## Usage

This team uses the SoupSpec framework agents and commands located at \`./claude/\` to work effectively.
`;

fs.writeFileSync(
  path.join(teamDir, 'README.md'),
  teamReadme
);

// Create initial task list
const tasks = [
  {
    id: 1,
    title: 'Research PRD parsing techniques',
    description: 'Investigate different approaches to parse PRDs and extract user stories',
    assignee: 'researcher',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Design PRD input UI',
    description: 'Create UI components for PRD input and user story generation preview',
    assignee: 'ux-designer',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 3,
    title: 'Implement PRD to US API endpoint',
    description: 'Create backend endpoint to process PRDs and generate user stories',
    assignee: 'developer',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 4,
    title: 'Build UI components',
    description: 'Implement the frontend components for the PRD to US feature',
    assignee: 'developer',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 5,
    title: 'Create tests',
    description: 'Develop comprehensive tests for the new functionality',
    assignee: 'tester',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 6,
    title: 'Code review',
    description: 'Review all code for quality, security, and best practices',
    assignee: 'reviewer',
    status: 'pending',
    priority: 'medium'
  }
];

fs.writeFileSync(
  path.join(teamDir, 'tasks.json'),
  JSON.stringify(tasks, null, 2)
);

console.log(`\n✅ Team configuration created in ${teamDir}`);
console.log('\n📁 Files created:');
console.log('- config.json: Team configuration');
console.log('- README.md: Team documentation');
console.log('- tasks.json: Initial task list');

// Create a team script to run the agents
const teamScript = `#!/bin/bash

# Team Execution Script for PRD to User Stories Feature

echo "🚀 Starting PRD to User Stories Team Workflow..."

# Phase 1: Research
echo "\\n🔍 Phase 1: Research and Planning"
echo "Researcher is investigating PRD parsing techniques..."
# In a real scenario, this would run the researcher agent

# Phase 2: Design
echo "\\n🎨 Phase 2: UI/UX Design"
echo "UX Designer is creating the UI components..."
# In a real scenario, this would run the UX designer agent

# Phase 3: Implementation
echo "\\n⚙️  Phase 3: Implementation"
echo "Developer is implementing the core functionality..."
# In a real scenario, this would run the developer agent

# Phase 4: Testing
echo "\\n🧪 Phase 4: Testing"
echo "Tester is creating and running tests..."
# In a real scenario, this would run the tester agent

# Phase 5: Review
echo "\\n👀 Phase 5: Review"
echo "Reviewer is conducting code review..."
# In a real scenario, this would run the reviewer agent

echo "\\n✅ Team workflow completed!"
`;

fs.writeFileSync(
  path.join(teamDir, 'run-team.sh'),
  teamScript
);

// Make the script executable
try {
  execSync(`chmod +x ${path.join(teamDir, 'run-team.sh')}`);
  console.log('- run-team.sh: Execution script');
} catch (error) {
  console.log('- run-team.sh: Execution script (manual chmod required)');
}

console.log('\n🎉 Agent team setup complete!');
console.log('\nTo use this team, agents will leverage the skills and commands available in ./claude/');
console.log('The team members are skilled in using SoupSpec framework agents and commands for efficient work.');