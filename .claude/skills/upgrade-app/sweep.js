#!/usr/bin/env node
/* Screenshots every chart on every tab, at desktop (1280) and phone (390) width, for a visual check.
   Needs the built page served on :8765 (python3 build.py --pwa; python3 -m http.server 8765) and Playwright.
   Usage: node .claude/skills/upgrade-app/sweep.js <outdir> [--dark] [--url http://127.0.0.1:8765/index.html?lang=..]
   Writes <outdir>/<width>-<tab>-<chart>.png and prints page errors. */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const args = process.argv.slice(2), out = args.find(a => !a.startsWith('--')) || 'sweep';
const dark = args.includes('--dark'), ui = args.indexOf('--url'), url = ui >= 0 ? args[ui + 1] : 'http://127.0.0.1:8765/index.html';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  for (const [W, H, mob] of [[1280, 900, false], [390, 844, true]]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: mob, hasTouch: mob, colorScheme: dark ? 'dark' : 'light' });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.route(/^https?:\/\/(?!127\.0\.0\.1)(?!cdnjs)/, r => r.abort());
    await pg.goto(url); await pg.waitForTimeout(3000);
    await pg.evaluate(() => { try { closeWizard(false) } catch (e) {} });
    const tabs = await pg.$$eval('[role="tab"]', t => t.map(e => e.dataset.tab));
    for (const k of tabs) {
      await pg.evaluate(k => document.querySelector(`[role="tab"][data-tab="${k}"]`).click(), k);
      await pg.waitForTimeout(k === 'mc' ? 6000 : 2000);
      const ids = await pg.$$eval(`#tab-${k} .plot`, e => e.filter(x => x.offsetParent).map(x => x.id));
      for (const id of ids) {
        const el = await pg.$('#' + id); await el.scrollIntoViewIfNeeded(); await pg.mouse.move(1, 1); await pg.waitForTimeout(250);
        await el.screenshot({ path: path.join(out, `${W}${dark ? 'd' : ''}-${k}-${id}.png`) });
      }
      console.log(W, k, ids.join(' '));
    }
    console.log(W, 'page errors:', errs.length ? errs : 'none');
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
