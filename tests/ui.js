#!/usr/bin/env node
/* UI logic tests: loads the built index.html with a stubbed chart library and a small county list swapped in, then checks
   the headline wording, ties, break-even search, affordability colors, the undo bar, the county picker, the Monte Carlo
   cache and chart descriptions. Run: node tests/ui.js   (needs playwright or playwright-core, like tests/smoke.js) */
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const FIXTURE = { t: 'test counties', u: 'https://api.census.gov/', span: '2020–2024', kP: 1.2, kR: 1.5, insU: null,
  rows: [['53033', 'King County, Washington', 1020000, 2600, 0.85, 1404], ['01001', 'Autauga County, Alabama', 228000, null, 0.37, null]] };
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*plotly*', r => r.fulfill({ contentType: 'text/javascript', body: 'window.Plotly={react(el){el.innerHTML="<svg class=main-svg></svg>"},Fx:{unhover(){}},Plots:{resize(){}}}' }));
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/const COUNTIES=[^;]*;/, 'const COUNTIES=' + JSON.stringify(FIXTURE) + ';');
  await page.route('**/index.html', r => r.fulfill({ contentType: 'text/html', body: html }));
  await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('rbi-wz', '1'); } catch (e) {} });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => document.getElementById('vhead').textContent !== 'Computing…', null, { timeout: 30000 });
  let pass = 0, fail = 0; const fails = [];
  const ok = (c, name, detail) => { if (c) pass++; else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); } };
  const set = async (vals) => { await page.evaluate(v => { for (const [id, x] of Object.entries(v)) { const e = document.getElementById(id); e.value = x; e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); } }, vals); await page.waitForTimeout(400); };
  const text = id => page.textContent('#' + id);

  /* rent estimated from price: scales with (price ÷ typical)^0.65 until a rent is typed */
  const typ = await page.evaluate(() => numOf('rent0')), P0 = await page.evaluate(() => numOf('P'));
  ok(await page.inputValue('#rentMode') === 'auto', 'rent starts as an estimate');
  await set({ P: P0 * 2 });
  ok(Math.abs(await page.evaluate(() => numOf('rent0')) - typ * Math.pow(2, 0.65)) <= 10, 'double the price: rent × 2^0.65', String(await page.evaluate(() => numOf('rent0'))));
  await page.click('#q-rent0'); await page.keyboard.press('Control+A'); await page.keyboard.type('2500'); await page.waitForTimeout(400);
  ok(await page.inputValue('#rentMode') === 'manual', 'typing a rent switches to your own');
  await set({ P: P0 * 3 }); ok(await page.evaluate(() => numOf('rent0')) === 2500, 'your rent stays when the price changes');
  ok(/Estimate from price would be/.test(await page.evaluate(() => document.getElementById('rentMode').closest('.f').querySelector('.hint').textContent)), 'the estimate is still shown for comparison');
  await set({ P: P0, rentMode: 'manual' });

  /* headline: clear wins name the winner; a gap within 2% of the outcome reads "about even" with no "best" tag */
  await set({ rent0: 6000 }); ok(/^Buying comes out ahead/.test(await text('vhead')), 'high rent: buying ahead', await text('vhead'));
  await set({ rent0: 900 }); ok(/^Renting and investing comes out ahead/.test(await text('vhead')), 'low rent: renting ahead', await text('vhead'));
  const tie = await page.evaluate(() => bisect(r => advAt(P, { rent0: r }), 10, P.P / 20));
  ok(tie != null, 'break-even rent found');
  ok(await page.evaluate(r => Math.abs(advAt(P, { rent0: r })) < P.P * 1e-4, tie), 'break-even rent ties the two paths');
  await set({ rent0: Math.round(tie) }); ok(/about even/.test(await text('vhead')), 'at the break-even rent: about even', await text('vhead'));
  ok(await page.evaluate(() => ![...document.querySelectorAll('#bars .bar')].some(b => /Buy|Rent \+ invest/.test(b.textContent) && b.querySelector('.pill'))), 'no "best" tag on a tie');

  /* affordability colors follow 28/36 and 43% */
  const col = await page.evaluate(() => { const p = Object.assign({}, P, { income: 120000, debt: 0 }), m = 10000; return [affCell(0.25 * m, p), affCell(0.33 * m, Object.assign({}, p, { debt: 0 })), affCell(0.5 * m, p)].map(h => (h.match(/var\((--\w+)\)/) || [])[1]); });
  ok(col[0] === '--buy' && col[1] === '--cash' && col[2] === '--neg', 'affordability colors', col.join(','));

  /* undo bar: shows for a location change, not for one edit that also recalculates transfer taxes or tax rates */
  await set({ metro: 'boston' }); ok(!(await page.isHidden('#undoBar')), 'undo bar after a location change');
  ok(/Location United States → Boston/.test(await text('undoTxt')), 'undo bar lists the change', await text('undoTxt'));
  await page.click('#undoBtn'); await page.waitForTimeout(400);
  ok(await page.inputValue('#metro') === 'us', 'undo restores the location');
  await set({ metro: 'new-york' }); await page.evaluate(() => { document.getElementById('undoBar').hidden = true; });
  await set({ P: 1500000 }); await set({ income: 400000 });
  ok(await page.isHidden('#undoBar'), 'single edits with recalculated fields do not show the undo bar');
  ok(await page.evaluate(() => settingValue('P', '1500000') === '$1,500,000' && settingValue('dp', '20') === '20%' && settingValue('loanType', 'fha').startsWith('FHA')), 'setting values formatted for the undo bar');

  /* county picker (choosing a location goes back to the price-based rent estimate) */
  await set({ metro: 'us' }); ok(await page.inputValue('#rentMode') === 'auto', 'a location change goes back to the estimate');
  await page.selectOption('#metro', '__county');
  ok(await page.isVisible('#countyQ') && await page.inputValue('#metro') === 'us', 'picking "Any county" opens the search and keeps the location');
  await page.fill('#countyQ', 'king county, washington'); await page.press('#countyQ', 'Enter'); await page.waitForTimeout(500);
  ok(await page.inputValue('#metro') === 'cty:53033', 'county selected');
  ok(await page.evaluate(() => numOf('P') === 1020000 && numOf('ptax') === 0.85 && numOf('ins') === 1404), 'county fills price, tax and state insurance');
  ok(await page.evaluate(() => !locRows().some(r => r.m.county)), 'counties stay out of the Locations comparison');

  /* Monte Carlo results survive a horizon or risk-aversion change, not a model input change */
  await page.waitForFunction(() => MC && MC.key === mcKey(), null, { timeout: 30000 });
  const k = await page.evaluate(() => MC.key);
  await set({ N: 17 }); await set({ gamma: 5 });
  ok(await page.evaluate(k => MC && MC.key === k && MC.h === 17, k), 'horizon and risk aversion reuse the simulation');
  await set({ gh: 5 }); ok(await page.evaluate(k => !MC || MC.key !== k, k), 'a model input invalidates the simulation');

  /* every drawn chart has a name and a description */
  const bad = await page.evaluate(() => [...document.querySelectorAll('#tab-proj .plot')].filter(e => e.getAttribute('role') !== 'img' || /\?|^: /.test(e.getAttribute('aria-label') || '?') || !document.getElementById(e.getAttribute('aria-describedby'))).map(e => e.id));
  ok(!bad.length, 'charts have accessible names and descriptions', bad.join(', '));

  /* printed inputs list the main settings and every changed one */
  await set({ hoa: 250 }); await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  ok(await page.evaluate(() => /HOA/.test(document.getElementById('printInputs').textContent) && /King County/.test(document.getElementById('printInputs').textContent)), 'print report lists changed settings');

  ok(!errors.length, 'no page errors', errors.join(' | '));
  await browser.close();
  console.log(`${pass} passed, ${fail} failed`); if (fail) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
