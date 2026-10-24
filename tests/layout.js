#!/usr/bin/env node
/* Chart layout test: opens every tab with the real chart library at phone, tablet and desktop width and, in every
   chart, fails on
   - text overlapping or touching other text (closer than 2px; tick labels of one axis may touch),
   - text overlapping a drawn shape (arrows, bands), or a line shape (connector, zero line, guide) running through it,
   - text or a legend outside the chart's box, and a legend over the plot area.
   Runs at the default inputs and at two more places, since label lengths change with the numbers.
   Needs the built page on :8765 (python3 build.py --pwa; python3 -m http.server 8765) and Playwright. */
'use strict';
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const URL = process.env.URL || 'http://127.0.0.1:8765/index.html?view=detailed';
const WIDTHS = [[390, true], [600, true], [900, false], [1280, false]], PLACES = ['us', 'san-francisco', 'cleveland'];

/* runs in the page: problems in one chart */
function check(id) {
  const p = document.getElementById(id); if (!p || !p.offsetParent || !p.querySelector('svg.main-svg')) return [];
  const box = p.getBoundingClientRect(), fl = p._fullLayout, out = [];
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  const hit = (a, b, m) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > m && Math.min(a.b, b.b) - Math.max(a.t, b.t) > m;
  const items = [], add = (sel, kind) => p.querySelectorAll(sel).forEach(e => { const r = R(e); if (r.w > 1 && r.h > 1 && getComputedStyle(e).visibility !== 'hidden' && e.getAttribute('opacity') !== '0') items.push({ kind, txt: (e.textContent || '').trim().slice(0, 30), r, el: e }); });
  add('.xtick text', 'xtick'); add('.ytick text', 'ytick'); add('.y2tick text', 'y2tick');
  add('.g-xtitle text', 'xtitle'); add('.g-ytitle text', 'ytitle'); add('.g-y2title text', 'y2title');
  add('.legend .traces', 'legend'); add('.annotation', 'note'); add('.colorbar .cbtitle', 'cbtitle'); add('.colorbar .cbaxis text', 'cbtick');
  add('.textpoint text', 'value'); add('.g-gtitle text', 'title');
  // text against text: different kinds of label need 2px of space; labels of one kind (one axis's ticks, legend
  // entries) may touch but not overlap
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    if (a.kind === 'value' && b.kind === 'value') continue;  // heatmap cell labels sit in their own cells
    if (hit(a.r, b.r, a.kind === b.kind ? 1 : -2)) out.push(`${a.kind} "${a.txt}" ${hit(a.r, b.r, 1) ? 'overlaps' : 'touches'} ${b.kind} "${b.txt}"`);
  }
  // text against drawn shapes bigger than a line (thin guide and connector lines may pass behind a label with a background)
  const shapes = [...p.querySelectorAll('.shapelayer path')].map(R).filter(r => r.w > 4 && r.h > 4 && r.w * r.h < box.width * box.height * 0.5);
  items.filter(a => /note|value|legend|title|tick/.test(a.kind)).forEach(a => shapes.forEach(s => { if (hit(a.r, s, 1)) out.push(`${a.kind} "${a.txt}" overlaps a shape`); }));
  // line shapes (connectors, zero lines, guides) must not run through a label; a label resting on its line is fine
  const lines = [...p.querySelectorAll('.shapelayer path')].map(R).filter(r => (r.w <= 4) !== (r.h <= 4));
  const inner = r => ({ l: r.l + 2, r: r.r - 2, t: r.t + 2, b: r.b - 2 });
  items.filter(a => /note|value/.test(a.kind)).forEach(a => lines.forEach(l => { if (hit(inner(a.r), l, 0)) out.push(`a line runs through ${a.kind} "${a.txt}"`); }));
  // everything inside the chart's box
  items.forEach(a => { if (a.r.l < box.left - 1 || a.r.r > box.right + 1 || a.r.t < box.top - 1 || a.r.b > box.bottom + 1) out.push(`${a.kind} "${a.txt}" outside the chart`); });
  // legend not over the plot area
  const lg = p.querySelector('.legend .bg') || p.querySelector('.legend'), s = fl && fl._size;
  if (lg && s && fl.showlegend !== false) { const r = R(lg), pa = { l: box.left + s.l, r: box.left + s.l + s.w, t: box.top + s.t, b: box.top + s.t + s.h }; if (r.w > 2 && hit(r, pa, 2)) out.push('legend over the plot area'); }
  return [...new Set(out)].slice(0, 8);
}

(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}); let bad = 0, charts = 0;
  for (const [W, mob] of WIDTHS) {
    const page = await b.newPage({ viewport: { width: W, height: 900 }, isMobile: mob, hasTouch: mob });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)(?!cdnjs|cdn\.jsdelivr|unpkg)/, r => r.abort());
    await page.goto(URL); await page.waitForTimeout(2500);
    await page.evaluate(() => { try { closeWizard(false); } catch (e) {} });
    const tabs = await page.$$eval('[role="tab"]', t => t.map(e => e.dataset.tab).filter(k => k !== 'method'));
    for (const place of PLACES) {
      await page.evaluate(m => { const s = document.getElementById('metro'); if (s.value !== m) { s.value = m; s.dispatchEvent(new Event('change', { bubbles: true })); } const u = document.getElementById('undoBar'); if (u) u.hidden = true; }, place);
      await page.waitForTimeout(600);
      // places other than the default: the tabs whose labels depend on the numbers
      for (const k of place === 'us' ? tabs : tabs.filter(t => /proj|sens|opt|mc|loc/.test(t))) {
        await page.evaluate(k => showTab(k), k);
        await page.waitForFunction(k => [...document.querySelectorAll(`#tab-${k} .plot`)].every(el => !el.offsetParent || el.querySelector('svg.main-svg') || el.dataset.err), k, { timeout: k === 'mc' ? 30000 : 10000 }).catch(() => {});
        await page.waitForTimeout(k === 'mc' ? 1500 : 400);
        const ids = await page.$$eval(`#tab-${k} .plot`, e => e.filter(x => x.offsetParent).map(x => x.id));
        for (const id of ids) { charts++; const pr = await page.evaluate(check, id); if (pr.length) { bad++; console.log(`✗ ${W}px ${place} ${k} ${id}:\n    ${pr.join('\n    ')}`); } }
      }
    }
    await page.close();
  }
  await b.close();
  console.log(bad ? `${bad} chart layout problem(s) in ${charts} chart views` : `chart layout: ${charts} chart views clean`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
