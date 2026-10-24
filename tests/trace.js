#!/usr/bin/env node
/* Trace tests: the "How this was computed" panel must stay true to the model as the app grows. Opens the built page with
   the real chart library and fails when
   - provenance: a setting has no stated origin, or a default that comes from data or research has no source link;
   - registry:   a trace node uses an equation missing from EQ, an EQ entry points to a Method section that does not
                 exist, or an EQ entry is used by neither a trace nor a Method block;
   - closure:    any node's equation, applied to its parts, does not give its value (over a matrix of settings that
                 reaches every model branch); a model change the trace does not mirror fails here;
   - reads:      the model reads a setting that appears nowhere in the trace;
   - coverage:   a chart trace has no recipe (meta 'deco:…' marks reference marks that are not results);
   - plot=trace: a recipe's value differs from what the chart plots, at sampled points, in three places.
   Charts in PENDING are not traced yet; each later step of the work removes its charts from it.
   Needs the built page on :8765 (python3 build.py --pwa; python3 -m http.server 8765) and Playwright. */
'use strict';
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const URL = process.env.URL || 'http://127.0.0.1:8765/index.html?view=detailed';
const PENDING = new Set(['p-loc', 'p-locsc', 'p-sbs', 'p-cmp', 'p-scen', 'p-cum', 'p-metro', 'p-roll', 'p-corr', 'p-mort', 'p-zori']);
// equations only reached by recipes not written yet
const EQ_PENDING = new Set();
let pass = 0, fail = 0; const fails = [];
const ok = (c, name, detail) => { if (c) pass++; else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); } };

/* runs in the page: expand a tree fully (each node once) and check every equation against its parts */
function walkTrees(roots) {
  const seen = new Set(), bad = [], eqs = new Set(), pks = new Set(), noEq = new Set();
  const walk = nd => { if (!nd || seen.has(nd)) return; seen.add(nd); [].concat(nd.pk || []).forEach(x => pks.add(x));
    if (nd.leaf === 'set') pks.add(nd.pk);
    if (!nd.build) return; if (nd.eq) { eqs.add(nd.eq); if (!EQ[nd.eq]) noEq.add(nd.eq); }
    const b = nd.built || (nd.built = nd.build()), c = b.calc(b.kids.map(k => k.v));
    if (!(Math.abs(c - nd.v) <= 1e-7 * Math.max(1, Math.abs(nd.v)))) bad.push(`${nd.label}: shows ${nd.v}, its equation gives ${c}`);
    b.kids.forEach(walk); };
  roots.forEach(walk);
  return { n: seen.size, bad, eqs: [...eqs], pks: [...pks], noEq: [...noEq] };
}

(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)(?!cdnjs|cdn\.jsdelivr|unpkg)/, r => r.abort());
  await page.goto(URL); await page.waitForTimeout(2500);
  await page.evaluate(() => { try { closeWizard(false); } catch (e) {} });
  await page.addScriptTag({ content: walkTrees.toString() });
  const setPlace = m => page.evaluate(m => { const s = document.getElementById('metro'); if (s.value !== m) { s.value = m; s.dispatchEvent(new Event('change', { bubbles: true })); } }, m);

  /* ---- provenance ---- */
  for (const place of ['us', 'san-francisco']) {
    await setPlace(place); await page.waitForTimeout(600);
    const pv = await page.evaluate(() => { const out = { missing: [], extra: [], unsourced: [] };
      F.forEach(f => { if (!ORIGIN[f[1]]) out.missing.push(f[1]); });
      Object.keys(ORIGIN).forEach(k => { if (!F.some(f => f[1] === k)) out.extra.push(k); });
      F.forEach(f => { const o = settingOrigin(f[1]); if (!o) return; const h = originHTML(o);
        if (['market', 'location', 'history', 'research', 'rule'].includes(o.kind) && !/href=|data:/.test(h) && !o.keys.length) out.unsourced.push(`${f[1]} (${o.kind})`); });
      Object.values(ORIGIN).forEach(o => (o[1] || []).forEach(k => { if (!SRC[k]) out.unsourced.push('missing source key ' + k); }));
      return out; });
    ok(!pv.missing.length && !pv.extra.length, `${place}: every setting states where its value comes from`, JSON.stringify(pv));
    ok(!pv.unsourced.length, `${place}: every default from data, research or rules links its source`, pv.unsourced.join(', '));
  }
  await setPlace('us'); await page.waitForTimeout(600);

  /* ---- closure and reads over a matrix of settings that reaches every branch of the model ---- */
  const mx = await page.evaluate(() => {
    const cfgs = { base: {}, fha: { loanType: 'fha', dp: 0.05 }, arm: { loanType: 'arm', N: 15 }, arm7: { loanType: 'arm', armYears: 7, armCapInit: 0.05, N: 20, rc: 0.06 }, refi: { refiOn: true, rateLR: 0.035, glide: 2, N: 12 },
      move: { moveMode: 'buy', moveYear: 4 }, moveRent: { moveMode: 'rent', moveYear: 3, N: 8 }, hh: { hhRent: 900, hhShare: 0.3, hhVac: 0.05 }, extra: { extraPay: 2000, N: 30 },
      extraInv: { extraPay: 500, extraMode: 'invest' }, cap: { ptaxCap: 0.02, ptaxCapCPI: true, hsEx: 50000, hsCredit: 300 }, lowdp: { dp: 0.05, pmiAppr: true, gh: 0.06, N: 12 },
      shelter: { acct: 'sheltered' }, notax: { taxOn: false }, lev: { lev: 1.5, ws: 0.6, wb: 0.3 }, cashHeavy: { lev: 0.5, ws: 0.4, wb: 0.2 },
      rich: { filing: 'mfj', income: 600000, pts: 2, stDed: true, stRate: 0.05, muMode: 'auto', ltcgMode: 'auto' }, t15: { term: 15, rate: 0.055 },
      neg: { gh: -0.05, rs: -0.02, N: 10, dp: 0.03, sellBase: 0.07, sell: 0.07 }, rental: { rentalOn: true }, underwater: { moveMode: 'rent', moveYear: 3, gh: -0.12, dp: 0.03, N: 8 }, heloc: { heloc: 0.8 }, credit: { fico: '680-699', dp: 0.1 } };
    const out = {};
    for (const [k, c] of Object.entries(cfgs)) {
      const p = Object.assign({}, P, c), reads = new Set();
      simulate(new Proxy(p, { get(t, key) { if (typeof key === 'string') reads.add(key); return t[key]; } }), constPath(p, p.N), { N: p.N });
      const T = traceRun(p, constPath(p, p.N), { kind: 'const' }), N = p.N, roots = [T.nwBuy(N), T.nwInv(N), T.nwCash(N), T.helocN(N)].concat(p.rentalOn ? [T.nwRental(N)] : []).concat(T.opts());
      const w = walkTrees(roots); out[k] = { n: w.n, bad: w.bad.slice(0, 5), unread: [...reads].filter(x => !w.pks.includes(x)), eqs: w.eqs, noEq: w.noEq };
    }
    return out; });
  const eqSeen = new Set();
  for (const [k, r] of Object.entries(mx)) {
    ok(!r.bad.length, `closure (${k}, ${r.n} nodes): every equation reproduces its value from its parts`, r.bad.join(' | '));
    ok(!r.unread.length, `reads (${k}): every setting the model reads appears in the trace`, r.unread.join(', '));
    ok(!r.noEq.length, `registry (${k}): every equation a node uses is in EQ`, r.noEq.join(', '));
    r.eqs.forEach(e => eqSeen.add(e));
  }

  /* ---- coverage and plot = trace on every tab, in three places ---- */
  const tabs = await page.$$eval('[role="tab"]', t => t.map(e => e.dataset.tab).filter(k => k !== 'method'));
  const runs = [['us', tabs], ['san-francisco', tabs], ['cleveland', tabs], ['us, monthly Backtest', ['hist']], ['us, own-home risk compounding yearly', ['mc', 'proj']]];
  for (const [place, tabList] of runs) {
    if (/monthly/.test(place)) await page.evaluate(() => { const s = document.getElementById('h-mode'); s.value = 'monthly'; s.dispatchEvent(new Event('change', { bubbles: true })); });
    else if (/yearly/.test(place)) { await page.evaluate(() => { const s = document.getElementById('idioMode'); s.value = 'yearly'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(800); }
    else { await setPlace(place); await page.waitForTimeout(800); }
    for (const k of tabList) {
      await page.evaluate(k => showTab(k), k);
      await page.waitForFunction(k => [...document.querySelectorAll(`#tab-${k} .plot`)].every(el => !el.offsetParent || el.querySelector('svg.main-svg') || el.dataset.err), k, { timeout: k === 'mc' ? 30000 : 10000 }).catch(() => {});
      await page.waitForTimeout(k === 'mc' ? 1500 : 300);
      const res = await page.evaluate(PENDING => {
        const out = { charts: 0, points: 0, noMeta: [], noRecipe: [], mismatch: [], bad: [], eqs: [] };
        const roots = [];
        document.querySelectorAll(`#tab-${CUR} .plot`).forEach(el => { if (!el.offsetParent || !el.data || PENDING.includes(el.id)) return; out.charts++;
          el.data.forEach((d, ci) => { if (!d.meta) { out.noMeta.push(`${el.id}[${ci}] ${d.name || d.type || ''}`); return; } if (/^deco:/.test(d.meta)) return;
            const f = TRACE_RECIPES[d.meta]; if (!f) { out.noRecipe.push(`${el.id}: ${d.meta}`); return; }
            const n = (d.y || d.x || []).length, pick = n => n <= 20 ? [...Array(n).keys()] : [...new Set([0, Math.floor(n / 4), Math.floor(n / 2), n - 1])];
            const hist = d.type === 'histogram' ? (el.calcdata[ci] || []).map((c, b) => ({ curveNumber: ci, pointNumber: b, x: c.p, y: c.s, pointNumbers: c.pts })).filter(c => c.y > 0) : null;
            const pts = hist ? [hist[0], hist[Math.floor(hist.length / 2)], hist[hist.length - 1]].filter(Boolean) : d.type === 'heatmap' ? [[0, 0], [d.y.length - 1, d.x.length - 1], [Math.floor(d.y.length / 2), Math.floor(d.x.length / 3)]].map(([i, j]) => ({ curveNumber: ci, pointNumber: [i, j], x: d.x[j], y: d.y[i], z: d.z[i][j] }))
              : pick(n).map(i => ({ curveNumber: ci, pointNumber: i, x: d.x && d.x[i], y: d.y && d.y[i], customdata: d.customdata && d.customdata[i] }));
            pts.filter(pt => pt.z !== null && (pt.y != null || pt.z != null)).forEach(pt => { const i = pt.pointNumber;
              let r; try { r = f(pt, el); } catch (e) { out.mismatch.push(`${el.id} ${d.meta}[${i}]: ${e.message}`); return; }
              const at = r.at || 'y', want = at === 'customdata' ? pt.customdata : at === 'customdata1' ? pt.customdata[1] : at === 'x' ? pt.x : at === 'xnum' ? +pt.x : at === 'z' ? pt.z : pt.y;
              out.points++; roots.push(r.node);
              if (!(Math.abs(r.node.v - want) <= 1e-6 * Math.max(1, Math.abs(want)))) out.mismatch.push(`${el.id} ${d.meta}[${i}]: plotted ${want}, trace ${r.node.v}`); }); }); });
        const w = walkTrees(roots); out.bad = w.bad.slice(0, 5); out.eqs = w.eqs; out.noEq = w.noEq; return out; }, [...PENDING]);
      if (!res.charts) continue;
      ok(!res.noMeta.length && !res.noRecipe.length, `${place} ${k}: every chart trace has a recipe (${res.charts} charts)`, res.noMeta.concat(res.noRecipe).join(' | '));
      ok(!res.mismatch.length, `${place} ${k}: plotted values equal their traces (${res.points} points)`, res.mismatch.slice(0, 5).join(' | '));
      ok(!res.bad.length && !res.noEq.length, `${place} ${k}: chart traces close`, res.bad.concat(res.noEq).join(' | '));
      res.eqs.forEach(e => eqSeen.add(e));
    }
  }
  await setPlace('us'); await page.waitForTimeout(600);

  /* ---- registry: every entry used, every section real ---- */
  const reg = await page.evaluate(() => { showTab('method'); return { all: Object.keys(EQ), method: [...EQ_METHOD], html: Object.entries(EQ).filter(([, e]) => /[<>&]/.test(e.t)).map(([k]) => k), badSec: Object.entries(EQ).filter(([, e]) => !document.getElementById('m-' + e.s)).map(([k, e]) => `${k} → ${e.s}`) }; });
  const unused = reg.all.filter(k => !eqSeen.has(k) && !reg.method.includes(k) && !EQ_PENDING.has(k));
  ok(!reg.html.length, 'registry: no equation uses a raw <, > or & (write \\lt, \\gt; they break the HTML around the TeX)', reg.html.join(', '));
  ok(!reg.badSec.length, 'registry: every equation names a Method section that exists', reg.badSec.join(', '));
  ok(!unused.length, 'registry: every equation is used by a trace or a Method block', unused.join(', '));

  /* ---- the panel opens from a real click on a chart point ---- */
  await page.evaluate(() => showTab('proj')); await page.waitForTimeout(600);
  const xy = await page.evaluate(() => { const el = document.getElementById('p-nw'), fl = el._fullLayout, i = el.data.findIndex(d => d.meta === 'nw:buy'), d = el.data[i], k = d.x.length - 1;
    el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
    return { x: r.left + fl._size.l + fl.xaxis.d2p(d.x[k]), y: r.top + fl._size.t + fl.yaxis.d2p(d.y[k]) }; });
  await page.mouse.move(xy.x, xy.y); await page.waitForTimeout(200); await page.mouse.click(xy.x, xy.y); await page.waitForTimeout(800);
  const pn = await page.evaluate(() => { const p = document.getElementById('trp'); return p && !p.hidden ? { sub: document.getElementById('trpS').textContent, rows: p.querySelectorAll('.trn').length, eq: !!p.querySelector('.treq') } : null; });
  ok(pn && /Buy, year/.test(pn.sub) && pn.rows > 3 && pn.eq, 'clicking a point opens the panel with its equation and parts', JSON.stringify(pn));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.getElementById('trp').hidden), 'Escape closes the panel');

  ok(!errors.length, 'no page errors', errors.join(' | '));
  await b.close();
  console.log(`${pass} passed, ${fail} failed`); if (fail) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
