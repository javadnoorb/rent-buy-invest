#!/usr/bin/env node
/* Accessibility check with axe-core (WCAG 2.1 A and AA rules) on the built index.html (build.py --pwa): the Quick setup dialog, the first
   view, the open settings and every results tab, in light and dark mode and at phone width. Fails on any violation.
   Run: npm i --no-save axe-core playwright-core; PLAYWRIGHT_PATH=playwright-core CHROME_PATH=... node tests/a11y.js */
'use strict';
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const AXE = require.resolve(process.env.AXE_PATH || 'axe-core/axe.min.js');
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  let failed = 0;
  for (const [scheme, width] of [['light', 1280], ['dark', 1280], ['light', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
    await page.route(/^https?:\/\//, r => r.abort());
    await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await page.waitForTimeout(800);
    await page.addScriptTag({ path: AXE });
    const check = async (where) => { const t0 = Date.now(); try { return await check1(where) } finally { if (process.env.A11Y_TIMES) console.log(`  ${scheme} ${width} ${where}: ${Date.now() - t0} ms`) } };
    const check1 = async (where) => {
      const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] }));
      for (const v of res.violations) {
        failed++;
        console.log(`✗ [${scheme} ${width}px] ${where}: ${v.id} (${v.impact}) ${v.help}`);
        for (const n of v.nodes.slice(0, 4)) console.log('    ', n.target.join(' '), '—', (n.failureSummary || '').split('\n').slice(1, 2).join(' ').trim());
        if (v.nodes.length > 4) console.log(`     … ${v.nodes.length - 4} more`);
      }
    };
    await check('first view with the Quick setup dialog');
    await page.evaluate(() => { if (typeof closeWizard === 'function') closeWizard(false); });
    await check('first view');
    await page.evaluate(() => document.querySelectorAll('aside details').forEach(d => d.open = true));
    await check('all settings open');
    const tabs = await page.$$eval('[role="tab"]', t => t.map(e => e.dataset.tab));
    for (const k of tabs) { await page.click(`[role="tab"][data-tab="${k}"]`); await page.waitForTimeout(k === 'mc' ? 3000 : 600); await check('tab ' + k); }
    await page.close();
  }
  await browser.close();
  console.log(failed ? `${failed} accessibility violation(s)` : 'a11y: no violations');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
