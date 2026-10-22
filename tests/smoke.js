#!/usr/bin/env node
/* Browser smoke test: loads index.html in Chromium (with the real chart library from the CDN), opens every tab,
   switches a few inputs, and fails on any page error or a chart that did not draw.
   Run: node tests/smoke.js   (needs `npm i playwright` and `npx playwright install chromium`) */
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
  if (process.env.STUB_PLOTLY) await page.route('**/*plotly*', r => r.fulfill({ contentType: 'text/javascript', body: 'window.Plotly={react(el,d){el.innerHTML="<svg class=main-svg></svg>"},Fx:{unhover(){}}}' }));
  await page.addInitScript(() => { try { localStorage.setItem('rbi-wz', '1'); } catch (e) {} });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => window.Plotly && document.getElementById('vhead').textContent !== 'Computing…', null, { timeout: 30000 });
  const set = async (id, v) => { await page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); }, [id, v]); await page.waitForTimeout(400); };
  await set('metro', 'boston'); await set('loanType', 'arm'); await set('rentalOn', '1'); await set('moveMode', 'buy');
  const failed = [];
  for (const tab of ['proj', 'sens', 'opt', 'hist', 'mc', 'scen', 'data', 'method']) {
    await page.click(`[data-tab=${tab}]`);
    await page.waitForTimeout(tab === 'mc' ? 6000 : 1500);
    const bad = await page.evaluate(t => [...document.querySelectorAll(`#tab-${t} .plot`)].filter(el => !el.querySelector('svg.main-svg') || el.dataset.err).map(el => el.id), tab);
    if (bad.length) failed.push(`${tab}: ${bad.join(', ')}`);
  }
  // formulas: every \( \) and \[ \] block must render with MathJax, with no TeX errors
  if (!process.env.STUB_PLOTLY) {
    await page.click('[data-tab=method]'); await page.click('#mopen');
    await page.waitForFunction(() => window.MathJax && MathJax.startup && MathJax.startup.promise, null, { timeout: 30000 });
    await page.evaluate(() => MathJax.typesetPromise([document.getElementById('tab-method'), document.getElementById('tab-mc')]));
    const tex = await page.evaluate(() => {
      const scope = [document.getElementById('tab-method'), document.getElementById('tab-mc')];
      const errs = scope.flatMap(el => [...el.querySelectorAll('mjx-merror, [data-mjx-error]')].map(e => e.getAttribute('data-mjx-error') || e.textContent));
      const raw = scope.map(el => el.innerText).join(' ').match(/\\[\(\[]/g) || [];
      return { errs, unrendered: raw.length, rendered: scope.reduce((n, el) => n + el.querySelectorAll('mjx-container').length, 0) };
    });
    if (tex.errs.length) failed.push('TeX errors: ' + tex.errs.slice(0, 5).join(' | '));
    if (tex.unrendered) failed.push(`${tex.unrendered} formulas left unrendered`);
    console.log(`formulas rendered: ${tex.rendered}`);
    // phone width: the page itself must never scroll sideways; long equations scroll inside their own box
    const ov = await page.evaluate(() => ({ page: document.documentElement.scrollWidth - innerWidth,
      note: (w => w ? w.scrollWidth - w.clientWidth : 0)(document.querySelector('.notewrap')), eq: [...document.querySelectorAll('#tab-method mjx-container[display="true"]')].filter(e => e.scrollWidth > e.clientWidth + 2).length }));
    if (ov.note > 1) failed.push(`notation table is ${ov.note}px wider than a 390px phone screen`);
    if (ov.page > 1) failed.push(`page is ${ov.page}px wider than a 390px phone screen`);
    console.log(`equations needing horizontal scroll at 390px: ${ov.eq}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice::page overflow ${ov.page}px; equations scrolling at 390px: ${ov.eq}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice::formulas rendered: ${tex.rendered}, TeX errors: ${tex.errs.length}`);
  }
  await browser.close();
  if (errors.length || failed.length) {
    const gh = !!process.env.GITHUB_ACTIONS, say = m => console.log(gh ? '::error::' + m.replace(/\n/g, ' ') : '  ' + m);
    console.log('FAIL'); errors.forEach(say); failed.forEach(f => say('check failed — ' + f)); process.exit(1); }
  console.log('smoke test passed: all tabs rendered');
})().catch(e => { console.error(e); process.exit(1); });
