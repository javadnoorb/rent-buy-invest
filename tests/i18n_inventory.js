#!/usr/bin/env node
/* Collects the English text the page shows (text fragments, placeholders, accessible names), with numbers turned into
   {0}, {1}… placeholders the same way src/app/003-i18n.js does, so the Spanish dictionary can be checked for gaps.
   It walks every tab, the settings, the Quick setup dialog, every help entry and a few result states.
   Run (with a local server on the repo root, after build.py --pwa):
     python3 -m http.server 8765 &  PLAYWRIGHT_PATH=... CHROME_PATH=... node tests/i18n_inventory.js [out.json]
   Writes a sorted list of keys; with --missing src/i18n/es.json it prints only the keys the dictionary lacks. */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const args = process.argv.slice(2), mi = args.indexOf('--missing');
const dictPath = mi >= 0 ? args[mi + 1] : null, out = args.find((a, i) => !a.startsWith('--') && (mi < 0 || i !== mi + 1));
const BASE = process.env.BASE || 'http://127.0.0.1:8765/index.html';
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('rbi-lang', 'en'); } catch (e) {} });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(BASE); await page.waitForTimeout(1500);
  const keys = new Map();
  const collect = async () => {
    const got = await page.evaluate(() => {
      const out = [], add = s => { if (s && /[A-Za-z]{2}/.test(s)) out.push(i18nKey(s)[0] + '\u0001' + i18nKey2(s)[0]); };
      const skip = I18N_SKIP;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        { acceptNode: c => c.nodeType === 1 && c.matches(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      let c; while ((c = w.nextNode())) {
        if (c.nodeType === 1) { for (const a of ['placeholder', 'aria-label', 'title']) add(c.getAttribute(a)); }
        else add(c.nodeValue);
      }
      add(document.title);
      return out;
    });
    got.forEach(k => keys.set(k, (keys.get(k) || 0) + 1));
  };
  // the Quick setup dialog, step by step
  await page.evaluate(() => openWizard()); await page.waitForTimeout(300);
  for (let i = 0; i < 8; i++) { await collect(); const nx = await page.$('#wizard:not([hidden]) [data-wz="next"], #wizard:not([hidden]) .wz-next'); if (!nx) break; try { await nx.click({ timeout: 1000 }); } catch (e) { break; } await page.waitForTimeout(200); }
  await page.evaluate(() => { if (typeof closeWizard === 'function') closeWizard(false); });
  await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
  await collect();
  const tabs = await page.$$eval('[role="tab"]', t => t.map(e => e.dataset.tab));
  for (const k of tabs) { await page.evaluate(k => document.querySelector(`[role="tab"][data-tab="${k}"]`).click(), k); await page.waitForTimeout(k === 'mc' ? 4000 : 800);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await collect(); }
  // every help entry, rendered the way the popup shows it
  await page.evaluate(() => {
    const box = document.createElement('div'); box.id = 'i18n-help-dump'; document.body.appendChild(box);
    const all = [];
    for (const [k, v] of Object.entries(HELP)) all.push(`<h3>${v[0]}</h3><p>${v[1]}</p>`);
    for (const o of [typeof CHART_HELP !== 'undefined' ? CHART_HELP : {}, typeof CARD_HELP !== 'undefined' ? CARD_HELP : {}])
      for (const v of Object.values(o)) all.push(`<p>${v}</p>`);
    box.innerHTML = all.join('');
  });
  await collect();
  await page.evaluate(() => document.getElementById('i18n-help-dump').remove());
  // a few result states that use other wording
  const states = [{ metro: 'boston' }, { metro: 'miami' }, { metro: 'seattle' }, { metro: 'los-angeles', stMode: 'manual' }, { P: '1500000' }, { P: '120000' }, { loanType: 'fha', dp: '3.5' }, { loanType: 'arm' }, { taxOn: '0' }, { rentalOn: '1' }, { moveMode: 'rent', moveYear: '5' }, { N: '3' }, { dp: '5' }];
  for (const st of states) {
    await page.evaluate(st => { for (const [k, v] of Object.entries(st)) { const el = document.getElementById(k); if (el) { el.value = v; if (k === 'metro') el.dispatchEvent(new Event('change', { bubbles: true })); } } update(); }, st);
    await page.waitForTimeout(500);
    for (const k of ['proj', 'loc', 'hist']) { await page.evaluate(k => document.querySelector(`[role="tab"][data-tab="${k}"]`).click(), k); await page.waitForTimeout(600); await collect(); }
    await page.evaluate(() => document.getElementById('reset').click()); await page.waitForTimeout(300);
  }
  await browser.close();
  // each entry is "numbers-only key \u0001 key with place names as placeholders"; either form may be in the dictionary
  const pairs = [...keys.keys()].map(k => k.split('\u0001')).filter(([a]) => /[A-Za-z]{2}/.test(a));
  const list = [...new Set(pairs.map(([a, b]) => a === b ? a : b))].sort();
  if (dictPath) {
    const d = JSON.parse(fs.readFileSync(dictPath, 'utf8')), miss = [...new Set(pairs.filter(([a, b]) => d[a] == null && d[b] == null).map(([, b]) => b))].sort();
    console.log(`${list.length} keys, ${miss.length} missing from ${path.basename(dictPath)}`);
    if (out) fs.writeFileSync(out, JSON.stringify(miss, null, 0).replace(/","/g, '",\n"'));
    else miss.slice(0, 80).forEach(k => console.log('  ' + k));
  } else {
    fs.writeFileSync(out || 'i18n_keys.json', JSON.stringify(list, null, 0).replace(/","/g, '",\n"'));
    console.log(`${list.length} keys`);
  }
})().catch(e => { console.error(e); process.exit(1); });
