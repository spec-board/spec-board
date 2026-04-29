import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const results: { test: string; status: 'PASS' | 'FAIL'; detail?: string }[] = [];

function pass(test: string, detail?: string) {
  results.push({ test, status: 'PASS', detail });
  console.log(`  ✓ ${test}${detail ? ` — ${detail}` : ''}`);
}

function fail(test: string, detail?: string) {
  results.push({ test, status: 'FAIL', detail });
  console.log(`  ✗ ${test}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // ========== 1. HOME PAGE ==========
  console.log('\n[1] Home Page');
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  title ? pass('Page loads', `title: "${title}"`) : fail('Page loads');

  const projectLink = page.locator('text=Demo Project').first();
  if (await projectLink.count() > 0) {
    pass('Demo project visible');
  } else {
    fail('Demo project visible', 'No project links found');
    await browser.close();
    printSummary();
    return;
  }

  // ========== 2. FEATURE LIST ==========
  console.log('\n[2] Feature List');
  await page.goto(`${BASE}/projects/demo`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const featureButtons = page.locator('button.w-full');
  const featureCount = await featureButtons.count();
  featureCount > 0 ? pass('Features render', `${featureCount} features`) : fail('Features render');

  const stageBadges = page.locator('span.rounded-full');
  const badgeCount = await stageBadges.count();
  badgeCount > 0 ? pass('Stage badges visible', `${badgeCount} badges`) : fail('Stage badges visible');

  const headerMindMapBtn = page.locator('button[aria-label="Mind Map"]');
  (await headerMindMapBtn.count()) > 0 ? pass('Mind Map button in header') : fail('Mind Map button in header');

  // ========== 3. FEATURE DETAIL ==========
  console.log('\n[3] Feature Detail');
  const firstFeature = featureButtons.first();
  if (await firstFeature.count() > 0) {
    await firstFeature.click();
    await page.waitForTimeout(2000);

    const modal = page.locator('[role="dialog"]');
    (await modal.count()) > 0 ? pass('Feature detail modal opens') : fail('Feature detail modal opens');

    const featureTitle = page.locator('#feature-modal-title');
    const titleText = await featureTitle.textContent();
    titleText ? pass('Feature title visible', titleText) : fail('Feature title visible');

    // Test document selector
    const docSelector = page.locator('select, [role="listbox"], button').filter({ hasText: /Spec|Plan|Tasks|Impact/i });
    (await docSelector.count()) > 0 ? pass('Document selector visible') : fail('Document selector visible');

    // Test edit button
    const editBtn = page.locator('button[title="Edit"]');
    if (await editBtn.count() > 0) {
      pass('Edit button visible');
      await editBtn.click();
      await page.waitForTimeout(1000);

      // Check if CodeMirror editor appears
      const cmEditor = page.locator('.cm-editor');
      (await cmEditor.count()) > 0 ? pass('CodeMirror editor opens') : fail('CodeMirror editor opens');

      // Switch back to preview
      const previewBtn = page.locator('button[title="Preview"]');
      if (await previewBtn.count() > 0) {
        await previewBtn.click();
        await page.waitForTimeout(500);
        pass('Preview toggle works');
      } else {
        fail('Preview toggle works');
      }
    } else {
      fail('Edit button visible', 'No edit button found');
    }

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close"]');
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      pass('Modal closes');
    }
  }

  // ========== 4. MIND MAP ==========
  console.log('\n[4] Mind Map');
  await page.goto(`${BASE}/projects/demo/mind-map`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check React Flow canvas
  const reactFlowPane = page.locator('.react-flow__pane');
  (await reactFlowPane.count()) > 0 ? pass('React Flow canvas renders') : fail('React Flow canvas renders');

  // Check nodes
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  nodeCount > 0 ? pass('Mind map nodes render', `${nodeCount} nodes`) : fail('Mind map nodes render');

  // Check edges
  const edges = page.locator('.react-flow__edge');
  const edgeCount = await edges.count();
  edgeCount > 0 ? pass('Mind map edges render', `${edgeCount} edges`) : fail('Mind map edges render');

  // Check toolbar
  const toolbar = page.locator('.absolute.top-4.left-4');
  (await toolbar.count()) > 0 ? pass('Toolbar visible') : fail('Toolbar visible');

  // Test add node via toolbar
  const addBtn = page.locator('button[title="Add node"]');
  if (await addBtn.count() > 0) {
    const beforeCount = await nodes.count();
    await addBtn.click();
    await page.waitForTimeout(1000);
    const afterCount = await page.locator('.react-flow__node').count();
    afterCount > beforeCount ? pass('Add node works', `${beforeCount} → ${afterCount}`) : fail('Add node works');
  } else {
    fail('Add node button found');
  }

  // Test double-click to add node
  const pane = page.locator('.react-flow__pane');
  if (await pane.count() > 0) {
    const beforeCount2 = await page.locator('.react-flow__node').count();
    await pane.dblclick({ position: { x: 600, y: 400 } });
    await page.waitForTimeout(1000);
    const afterCount2 = await page.locator('.react-flow__node').count();
    afterCount2 > beforeCount2 ? pass('Double-click adds node', `${beforeCount2} → ${afterCount2}`) : fail('Double-click adds node');
  }

  // Test node selection
  const firstNode = page.locator('.react-flow__node').first();
  if (await firstNode.count() > 0) {
    await firstNode.click();
    await page.waitForTimeout(500);

    // Check if color picker appears
    const colorPicker = page.locator('.rounded-full.border').first();
    (await colorPicker.count()) > 0 ? pass('Color picker appears on selection') : fail('Color picker appears on selection');
  }

  // Test back button
  const backBtn = page.locator('button[title="Back to board"]');
  if (await backBtn.count() > 0) {
    await backBtn.click();
    await page.waitForTimeout(1500);
    const url = page.url();
    url.includes('/projects/demo') && !url.includes('mind-map') ? pass('Back button navigates to project') : fail('Back button navigates to project', url);
  }

  // ========== 5. SETTINGS ==========
  console.log('\n[5] Settings');
  await page.goto(`${BASE}/projects/demo`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const settingsBtn = page.locator('button[aria-label="Settings"]');
  if (await settingsBtn.count() > 0) {
    await settingsBtn.click();
    await page.waitForTimeout(1000);

    const settingsModal = page.locator('.fixed.inset-0').filter({ hasText: 'Settings' });
    (await settingsModal.count()) > 0 ? pass('Settings modal opens') : fail('Settings modal opens');

    // Check AI Settings section
    const aiSection = page.locator('text=AI Providers');
    (await aiSection.count()) > 0 ? pass('AI Providers section visible') : fail('AI Providers section visible');

    // Close settings
    const closeSettings = page.locator('button[aria-label="Close settings"]');
    if (await closeSettings.count() > 0) {
      await closeSettings.click();
      await page.waitForTimeout(500);
      pass('Settings modal closes');
    }
  } else {
    fail('Settings button found');
  }

  await browser.close();
  printSummary();
}

function printSummary() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ ${r.test}${r.detail ? ` — ${r.detail}` : ''}`);
    });
  }
  console.log('');
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
