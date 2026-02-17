import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Create App Settings
  const settings = await prisma.appSettings.upsert({
    where: { key: 'app-settings' },
    update: {},
    create: {
      key: 'app-settings',
      theme: 'dark',
      shortcutsEnabled: true,
      aiProvider: 'openai',
      openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
  })
  console.log('✅ Created app settings')

  // 2. Create sample Project
  const project = await prisma.project.upsert({
    where: { name: 'spec-board' },
    update: {},
    create: {
      name: 'spec-board',
      displayName: 'SpecBoard',
      description: 'Visual dashboard for spec-kit project management',
      isCloud: false,
    },
  })
  console.log('✅ Created project:', project.displayName)

  // 3. Create sample Features
  const features = [
    {
      featureId: '001-kanban-board',
      name: 'Kanban Board',
      description: 'Visual Kanban board for tracking features',
      stage: 'specify',
      status: 'planning',
      specContent: `# Kanban Board Feature

## Overview
Create a visual Kanban board interface for tracking feature development across different stages.

## Requirements
- Drag and drop cards between columns
- Real-time updates
- Keyboard navigation support
`,
    },
    {
      featureId: '002-user-stories',
      name: 'User Stories',
      description: 'Manage user stories within features',
      stage: 'plan',
      status: 'in_progress',
      planContent: `# User Stories Plan

## Approach
- Use nested tree structure for US → Tasks hierarchy
- Store in separate tables with foreign keys
- Support drag-drop reordering
`,
    },
    {
      featureId: '003-ai-integration',
      name: 'AI Integration',
      description: 'AI-powered spec generation',
      stage: 'tasks',
      status: 'in_progress',
      tasksContent: `# Tasks

- [ ] Setup AI client
- [ ] Create spec generation prompt
- [ ] Implement API endpoint
- [ ] Add streaming support
`,
    },
    {
      featureId: '004-cloud-sync',
      name: 'Cloud Sync',
      description: 'Sync projects to cloud',
      stage: 'implement',
      status: 'backlog',
      analysisContent: `# Analysis

## Trade-offs
- Local-first vs Cloud-native
- Conflict resolution strategy
- Offline support needed
`,
    },
  ]

  for (const feature of features) {
    await prisma.feature.upsert({
      where: {
        projectId_featureId: {
          projectId: project.id,
          featureId: feature.featureId,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        ...feature,
      },
    })
  }
  console.log('✅ Created', features.length, 'features')

  // 4. Create sample User Stories for feature 002
  const feature002 = await prisma.feature.findFirst({
    where: { projectId: project.id, featureId: '002-user-stories' },
  })

  if (feature002) {
    const userStories = [
      {
        storyId: 'US1',
        title: 'As a user, I can create user stories',
        description: 'Ability to add new user stories to a feature',
        status: 'completed',
      },
      {
        storyId: 'US2',
        title: 'As a user, I can edit user stories',
        description: 'Modify existing user story details',
        status: 'in_progress',
      },
      {
        storyId: 'US3',
        title: 'As a user, I can delete user stories',
        description: 'Remove user stories from a feature',
        status: 'pending',
      },
    ]

    for (const us of userStories) {
      await prisma.userStory.create({
        data: {
          featureId: feature002.id,
          ...us,
        },
      })
    }
    console.log('✅ Created', userStories.length, 'user stories')
  }

  // 5. Create sample Constitution
  await prisma.constitution.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      title: 'SpecBoard Constitution',
      content: `# SpecBoard Constitution

## Principles

### 1. Database-First
All content stored in PostgreSQL. No filesystem dependencies for core data.

### 2. Progressive Enhancement
UI works offline, syncs when connected.

### 3. AI-Assisted
AI helps generate specs but humans make final decisions.
`,
      principles: [
        { name: 'Database-First', description: 'Store all content in PostgreSQL' },
        { name: 'Progressive Enhancement', description: 'Works offline, syncs when connected' },
        { name: 'AI-Assisted', description: 'AI helps but humans decide' },
      ],
      version: '1.0.0',
    },
  })
  console.log('✅ Created constitution')

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
