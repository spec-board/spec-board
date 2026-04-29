import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const OUT = './public/screenshots';

async function ensureDemoProject() {
  let project = await prisma.project.findUnique({ where: { name: 'demo' } });
  if (!project) {
    project = await prisma.project.create({
      data: { name: 'demo', displayName: 'Demo Project', description: 'A demo project for SpecBoard screenshots' },
    });
  }

  const featureCount = await prisma.feature.count({ where: { projectId: project.id } });
  if (featureCount === 0) {
    await prisma.feature.createMany({
      data: [
        { projectId: project.id, featureId: '001-user-auth', name: 'User Authentication', description: 'Login, registration, and session management', stage: 'tasks', order: 0, specContent: '# User Authentication\n\n## User Stories\n\n### US1: User Login\nAs a user, I want to log in with email and password.\n\n**Acceptance Criteria:**\n- Given valid credentials, user is authenticated\n- Given invalid credentials, error message is shown\n\n### US2: User Registration\nAs a new user, I want to create an account.\n\n**Acceptance Criteria:**\n- Email must be unique\n- Password must be 8+ characters', planContent: '# Implementation Plan\n\n## Technical Context\n- Framework: Next.js\n- Auth: JWT tokens\n- Database: PostgreSQL\n\n## Steps\n1. Create auth API routes\n2. Build login/register forms\n3. Add session middleware', tasksContent: '# Tasks\n\n## Phase 1: Backend\n- [x] T001 Create user model\n- [x] T002 Implement JWT auth\n- [ ] T003 Add password hashing\n\n## Phase 2: Frontend\n- [ ] T004 Build login form\n- [ ] T005 Build register form' },
        { projectId: project.id, featureId: '002-dashboard', name: 'Dashboard', description: 'Main dashboard with analytics and overview', stage: 'plan', order: 1, specContent: '# Dashboard\n\n## User Stories\n\n### US1: View Overview\nAs a user, I want to see project metrics at a glance.' },
        { projectId: project.id, featureId: '003-notifications', name: 'Notifications', description: 'Real-time notification system', stage: 'specs', order: 2 },
        { projectId: project.id, featureId: '004-search', name: 'Search', description: 'Full-text search across all content', stage: 'backlog', order: 3 },
        { projectId: project.id, featureId: '005-export', name: 'Export to PDF', description: 'Export specs and plans as PDF documents', stage: 'backlog', order: 4 },
      ],
    });
  }

  // Add mind map nodes
  const nodeCount = await prisma.mindMapNode.count({ where: { projectId: project.id } });
  if (nodeCount === 0) {
    const nodes = [
      { id: 'n1', projectId: project.id, label: 'SpecBoard', color: '#63b3ed', positionX: 300, positionY: 50, type: 'default' },
      { id: 'n2', projectId: project.id, label: 'Authentication', color: '#68d391', positionX: 100, positionY: 200, type: 'feature' },
      { id: 'n3', projectId: project.id, label: 'Dashboard', color: '#68d391', positionX: 300, positionY: 200, type: 'feature' },
      { id: 'n4', projectId: project.id, label: 'Notifications', color: '#f6ad55', positionX: 500, positionY: 200, type: 'default' },
      { id: 'n5', projectId: project.id, label: 'OAuth Login', color: '#fc8181', positionX: 0, positionY: 350, type: 'default' },
      { id: 'n6', projectId: project.id, label: 'JWT Tokens', color: '#fc8181', positionX: 200, positionY: 350, type: 'default' },
      { id: 'n7', projectId: project.id, label: 'Analytics', color: '#b794f4', positionX: 350, positionY: 350, type: 'default' },
      { id: 'n8', projectId: project.id, label: 'Search', color: '#f6ad55', positionX: 550, positionY: 350, type: 'default' },
    ];
    await prisma.mindMapNode.createMany({ data: nodes });
    await prisma.mindMapEdge.createMany({
      data: [
        { id: 'e1', projectId: project.id, sourceId: 'n1', targetId: 'n2' },
        { id: 'e2', projectId: project.id, sourceId: 'n1', targetId: 'n3' },
        { id: 'e3', projectId: project.id, sourceId: 'n1', targetId: 'n4' },
        { id: 'e4', projectId: project.id, sourceId: 'n2', targetId: 'n5' },
        { id: 'e5', projectId: project.id, sourceId: 'n2', targetId: 'n6' },
        { id: 'e6', projectId: project.id, sourceId: 'n3', targetId: 'n7' },
        { id: 'e7', projectId: project.id, sourceId: 'n4', targetId: 'n8' },
      ],
    });
  }

  return project;
}

async function main() {
  await ensureDemoProject();
  console.log('Demo data ready');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Home
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/home.png` });
  console.log('✓ home.png');

  // 2. Feature list
  await page.goto(`${BASE}/projects/demo`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/feature-list.png` });
  console.log('✓ feature-list.png');

  // 3. Mind map
  await page.goto(`${BASE}/projects/demo/mind-map`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/mind-map.png` });
  console.log('✓ mind-map.png');

  // 4. Feature detail (click first feature)
  await page.goto(`${BASE}/projects/demo`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const featureBtn = page.locator('button.w-full').first();
  if (await featureBtn.count() > 0) {
    await featureBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/feature-detail.png` });
    console.log('✓ feature-detail.png');
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('Done');
}

main().catch((e) => { console.error(e); process.exit(1); });
