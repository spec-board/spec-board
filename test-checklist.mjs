import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3002/projects/spec-board');
await page.waitForTimeout(3000);

// Take a snapshot of the page
const snapshot = await page.accessibility.snapshot();
console.log(JSON.stringify(snapshot, null, 2).slice(0, 5000));
await browser.close();
