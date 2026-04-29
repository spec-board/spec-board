import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const OUT = './public/screenshots';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Home
  console.log('Taking screenshots...');
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/home.png` });
  console.log('✓ home.png');

  // 2. Feature list
  await page.goto(`${BASE}/projects/demo`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/feature-list.png` });
  console.log('✓ feature-list.png');

  // 3. Feature detail — click first feature
  const featureBtn = page.locator('button.w-full').first();
  if (await featureBtn.count() > 0) {
    await featureBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/feature-detail.png` });
    console.log('✓ feature-detail.png');

    // 4. CodeMirror editor — click Edit button
    const editBtn = page.locator('button[title="Edit"]');
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/editor.png` });
      console.log('✓ editor.png');

      // Back to preview
      const previewBtn = page.locator('button[title="Preview"]');
      if (await previewBtn.count() > 0) await previewBtn.click();
      await page.waitForTimeout(500);
    }

    // 5. Impact tab — find and click Impact option
    // First close modal
    const closeBtn = page.locator('button[aria-label="Close"]');
    if (await closeBtn.count() > 0) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 6. Mind map
  await page.goto(`${BASE}/projects/demo/mind-map`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/mind-map.png` });
  console.log('✓ mind-map.png');

  // 7. Settings
  await page.goto(`${BASE}/projects/demo`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  const settingsBtn = page.locator('button[aria-label="Settings"]');
  if (await settingsBtn.count() > 0) {
    await settingsBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/settings.png` });
    console.log('✓ settings.png');
  }

  await browser.close();
  await prisma.$disconnect();
  console.log('Done — 6 screenshots');
}

main().catch((e) => { console.error(e); process.exit(1); });
