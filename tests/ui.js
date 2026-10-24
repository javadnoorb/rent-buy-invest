#!/usr/bin/env node
/* UI logic tests: serves the built index.html locally with a stubbed chart library and a small county list swapped in, then checks
   the headline wording, ties, break-even search, affordability colors, the undo bar, the county picker, the Monte Carlo
   cache and chart descriptions. Run: node tests/ui.js   (needs playwright or playwright-core, like tests/smoke.js) */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
// county scaling figures in the page, and the raw list the page fetches on first use: King County comes out at
// 850,000 × 1.2 = $1,020,000, tax 7,225 ÷ 850,000 = 0.85% (× Washington's new-buyer factor), Washington insurance $1,404
// HUD rents for King County: 2,600 for 3 bedrooms with utilities × (1,750 contract ÷ 2,000 gross) = 2,275 → $2,280;
// Autauga has no HUD row and no ACS rent, so it falls back to the U.S. typical rent. Price history for King from its state file.
const META = { t: 'test counties', u: 'https://api.census.gov/', span: '2020–2024', kP: 1.2, kR: 1.5, cg: 0.85, insU: null, stateIns: { Washington: 1404 }, file: 'data/counties.json', rows: null,
  fmr: { fy: 2026, u: 'https://www.huduser.gov/', file: 'data/county_fmr.json', rows: null }, zip: { dir: 'data/zip/' }, hpi: { t: 'test index', u: 'https://www.fhfa.gov/', dir: 'data/county_hpi/', volK: 1.1 } };
const ROWS = { rows: [['53033', 'King County, Washington', 850000, 1750, 7225, 2000], ['01001', 'Autauga County, Alabama', 190000, null, 703, null]] };
// ZIP 98101 in King County: value 700,000 × 1.2 = $840,000; tax 6,300 ÷ 700,000 = 0.9%; HUD 3BR 3,200 × (1,800 ÷ 2,000) = $2,880
const ZIP98 = { meta: { acs: { t: 'Census ACS 5-year 2020–2024, ZIP Code Tabulation Areas', u: 'https://www.census.gov/' }, safmr: { t: 'HUD Small Area Fair Market Rents FY2027', u: 'https://www.huduser.gov/' } },
  zips: { '98101': ['53033', 700000, 1800, 6300, 2000, [1600, 1900, 2400, 3200, 3700]] } };
const FMR = { rows: { '53033': [1500, 1700, 2000, 2600, 3000] } };
const HPI53 = { meta: {}, counties: { '53033': Object.fromEntries([...Array(36)].map((_, i) => [String(1990 + i), Math.round(100 * Math.pow(1.05, i) * 100) / 100])) } };
const ROOT = path.join(__dirname, '..');
const FCSTV = { rs: JSON.parse(fs.readFileSync(path.join(ROOT, 'data/forecasts_public.json'), 'utf8')).spf.stocks };
(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*plotly*', r => r.fulfill({ contentType: 'text/javascript', body: 'window.Plotly={react(el){el.innerHTML="<svg class=main-svg></svg>"},Fx:{unhover(){}},Plots:{resize(){}}}' }));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/const COUNTIES=.*;\n/, () => 'const COUNTIES=' + JSON.stringify(META) + ';\n');  // the build writes it on one line; titles can contain ';'
  let countyFetches = 0;
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/' || u === '/index.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html); }
    const json = { '/data/counties.json': ROWS, '/data/county_fmr.json': FMR, '/data/county_hpi/53.json': HPI53, '/data/zip/98.json': ZIP98 }[u];
    if (u === '/data/counties.json') countyFetches++;
    if (json) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(json)); }
    const f = path.join(ROOT, path.normalize(u));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const base = `http://127.0.0.1:${server.address().port}/`;
  await page.addInitScript(() => { try { if (!sessionStorage.getItem('init')) { localStorage.clear(); sessionStorage.setItem('init', '1'); } localStorage.setItem('rbi-wz', '1'); } catch (e) {} });
  await page.goto(base + 'index.html');
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

  /* county picker (choosing a location goes back to the price-based rent estimate); the list loads on first use */
  await set({ metro: 'us' }); ok(await page.inputValue('#rentMode') === 'auto', 'a location change goes back to the estimate');
  ok(countyFetches === 0, 'the county list is not downloaded until a county is wanted');
  await page.selectOption('#metro', '__county');
  ok(await page.isVisible('#countyQ') && await page.inputValue('#metro') === 'us', 'picking "Any county" opens the search and keeps the location');
  await page.waitForFunction(() => document.getElementById('countyList').options.length > 0, null, { timeout: 5000 });
  ok(countyFetches === 1, 'the county list is downloaded once when needed');
  await page.fill('#countyQ', 'king county, washington'); await page.press('#countyQ', 'Enter'); await page.waitForTimeout(500);
  ok(await page.inputValue('#metro') === 'cty:53033', 'county selected');
  ok(await page.evaluate(() => numOf('P') === 1020000 && Math.abs(numOf('ptax') - 0.85 * nbK('WA')) < 0.001 && numOf('ins') === 1404), 'county fills price, tax (× the state\'s new-buyer factor) and state insurance');
  ok(await page.evaluate(() => !locRows().some(r => r.m.county)), 'counties stay out of the Locations comparison');
  ok(await page.evaluate(() => numOf('rent0')) === 2280, 'county rent from HUD by bedrooms, without utilities', String(await page.evaluate(() => numOf('rent0'))));
  await set({ beds: '1' }); ok(await page.evaluate(() => numOf('rent0')) === 1490, 'HUD 1-bedroom rent', String(await page.evaluate(() => numOf('rent0')))); await set({ beds: '3' });
  await page.waitForFunction(() => !document.getElementById('metroPreset').hidden, null, { timeout: 5000 }).catch(() => {});
  ok(/King County, Washington 1991–2025 avg/.test(await page.textContent('#metroPreset')) && await page.evaluate(() => !!curMetro().hpi), 'county price history loads and offers its own preset');
  ok(await page.evaluate(() => { const a = metroAnnual(curMetro(), true); return Math.abs(a[2000 - Y0] - 5) < 0.01 && a[1990 - Y0] == null; }), 'county yearly price changes come from its index');
  await page.waitForTimeout(400); await page.reload(); await page.waitForFunction(() => document.getElementById('vhead').textContent !== 'Computing…');
  await page.waitForFunction(() => document.getElementById('metro').value === 'cty:53033', null, { timeout: 5000 }).catch(() => {});
  ok(await page.inputValue('#metro') === 'cty:53033' && await page.evaluate(() => numOf('P')) === 1020000, 'a saved county is restored after reloading');

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

  /* ZIP codes: value, tax and HUD rent for the ZIP, county price history; restored after reload */
  await set({ metro: 'us' }); await page.selectOption('#metro', '__county');
  await page.waitForFunction(() => document.getElementById('countyList').options.length > 0, null, { timeout: 5000 });
  await page.fill('#countyQ', '98101'); await page.press('#countyQ', 'Enter');
  await page.waitForFunction(() => document.getElementById('metro').value === 'zip:98101', null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(400);
  ok(await page.inputValue('#metro') === 'zip:98101' && /ZIP 98101 · King County/.test(await page.evaluate(() => curMetro().name)), 'a ZIP code becomes the location');
  ok(await page.evaluate(() => numOf('P') === 840000 && Math.abs(numOf('ptax') - 0.9 * nbK('WA')) < 0.006 && numOf('ins') === 1404 && numOf('rent0') === 2880), 'ZIP fills value, tax, county insurance and HUD 3-bedroom rent', JSON.stringify(await page.evaluate(() => [numOf('P'), numOf('ptax'), numOf('ins'), numOf('rent0')])));
  await page.waitForFunction(() => curMetro().hpi, null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => !!curMetro().hpi), 'ZIP uses its county price history');
  await page.waitForTimeout(400); await page.reload(); await page.waitForFunction(() => document.getElementById('vhead').textContent !== 'Computing…');
  await page.waitForFunction(() => document.getElementById('metro').value === 'zip:98101', null, { timeout: 5000 }).catch(() => {});
  ok(await page.inputValue('#metro') === 'zip:98101', 'a saved ZIP is restored after reloading');
  await page.selectOption('#metro', '__county'); await page.fill('#countyQ', '99999'); await page.press('#countyQ', 'Enter'); await page.waitForTimeout(500);
  ok(/No data for ZIP 99999/.test(await page.getAttribute('#countyQ', 'placeholder')), 'an unknown ZIP says so');
  await page.press('#countyQ', 'Escape');

  /* the top card says whether the rent is estimated, and offers the estimate back after a typed rent */
  await set({ metro: 'us' }); ok((await page.textContent('#rentTag')).trim() === 'est.', 'top card marks the rent as estimated');
  await page.click('#q-rent0'); await page.keyboard.press('Control+A'); await page.keyboard.type('2500'); await page.waitForTimeout(400);
  ok(await page.isVisible('#rentTag [data-act="rent-est"]'), 'after typing a rent, the top card offers the estimate');
  await page.click('#rentTag [data-act="rent-est"]'); await page.waitForTimeout(400);
  ok(await page.inputValue('#rentMode') === 'auto' && await page.evaluate(() => numOf('rent0')) !== 2500, '"use est." goes back to the estimate');

  /* setups saved before the estimate, or marked "my own" by the first version: an untouched rent becomes the estimate */
  const reloadWith = async state => { await page.evaluate(st => localStorage.setItem('rbi-inputs', JSON.stringify(st)), state); await page.reload();
    await page.waitForFunction(() => document.getElementById('vhead').textContent !== 'Computing…'); await page.waitForTimeout(300); };
  const typUS = await page.evaluate(() => Math.round(METROS[0].rent * bedRatio(METROS[0], '3') / 10) * 10);
  await reloadWith({ v: 4, metro: 'us', beds: '3', P: '800000', rent0: String(typUS) });
  ok(await page.inputValue('#rentMode') === 'auto' && await page.evaluate(() => numOf('rent0')) > typUS, 'old save with the default rent: estimated from its price');
  await reloadWith({ v: 4, metro: 'us', beds: '3', P: '800000', rent0: String(typUS), rentMode: 'manual' });
  ok(await page.inputValue('#rentMode') === 'auto', 'v4 save marked "my own" with the default rent: estimated');
  await reloadWith({ v: 4, metro: 'us', beds: '3', P: '800000', rent0: '2777', rentMode: 'manual' });
  ok(await page.inputValue('#rentMode') === 'manual' && await page.evaluate(() => numOf('rent0')) === 2777, 'a typed rent in an old save is kept');
  await reloadWith({ v: 5, metro: 'us', beds: '3', P: '800000', rent0: String(typUS), rentMode: 'manual' });
  ok(await page.inputValue('#rentMode') === 'manual', 'a current save that chose "my own" is kept');

  /* where the gap comes from: the parts add up to the headline gap, in today's and nominal dollars */
  const gapSums = await page.evaluate(() => [true, false].map(r => { REAL = r; const o = simulate(P, constPath(P, P.N), { detail: true }), g = gapParts(P, o);
    const d = Math.abs(g.parts.reduce((a, x) => a + x[1], 0) - adj(o.buy[P.N] - o.inv[P.N], o.cpi[P.N])); return [d, g.parts.find(x => /Inflation/.test(x[0]))]; }));
  await page.evaluate(() => { REAL = true; });
  ok(gapSums.every(([d]) => d < 1), 'gap parts add up to the answer');
  ok(gapSums[0][1] && gapSums[0][1][1] > 0 && !gapSums[1][1], 'inflation shrinks the loan in today\'s dollars only');

  /* affordability: the highest price sits at the limit that binds */
  const aff = await page.evaluate(() => { const p = Object.assign({}, P, { income: 120000, debt: 500 }), cash = 1e6, c = maxPrice(p, cash, 0.28, 0.36), l = maxPrice(p, cash, 0.43, 0.43), inc = p.income / 12;
    const tight = maxPrice(p, 10000, 0.28, 0.36); return { c: c && Math.max(c.piti / inc / 0.28, (c.piti + p.debt) / inc / 0.36), l: l && (l.piti + p.debt) / inc, cl: c && c.limit, tl: tight && tight.limit, order: c && l && l.P > c.P }; });
  ok(aff.c > 0.98 && aff.c <= 1 && aff.cl === 'income', 'comfortable price uses the 28/36 limit when cash is plentiful', JSON.stringify(aff));
  ok(aff.l > 0.425 && aff.l <= 0.43 && aff.order, 'lender-limit price uses 43% and is higher');
  ok(aff.tl === 'cash', 'with little cash, the cash limits the price');

  /* side by side: a county and a ZIP code next to each other, with the difference column */
  await page.evaluate(() => { localStorage.removeItem('rbi-sbs'); SBS = null; });
  await page.click('[data-tab="loc"]'); await page.waitForTimeout(600);
  await page.fill('#sbsA', 'King County, Washington'); await page.press('#sbsA', 'Enter'); await page.waitForTimeout(500);
  await page.fill('#sbsB', '98101'); await page.press('#sbsB', 'Enter'); await page.waitForTimeout(600);
  const sbs = await page.evaluate(() => [...document.querySelectorAll('#sbsT tr')].map(r => [...r.children].map(c => c.textContent.trim())));
  const priceRow = sbs.find(r => r[0] === 'Home price');
  ok(sbs[0][1] === 'King County, Washington' && /ZIP 98101/.test(sbs[0][2]), 'side by side shows a county and a ZIP', JSON.stringify(sbs[0]));
  ok(priceRow && priceRow[2] === '$840k' && /^[+−]/.test(priceRow[3]), 'ZIP price and the B − A column', JSON.stringify(priceRow));
  await page.fill('#sbsB', 'Atlantis'); await page.press('#sbsB', 'Enter'); await page.waitForTimeout(300);
  ok(/No data for/.test(await page.textContent('#sbsMsg')), 'an unknown place shows a message');
  await page.click('#sbsSwap'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => SBS[0].startsWith('zip:') && SBS[1].startsWith('cty:')), 'swap exchanges the two places');
  await page.click('[data-tab="proj"]');

  /* saves from before v6 pick up the new defaults for renter's insurance and the chance of moving; later choices are kept */
  const defs = await page.evaluate(() => [D0.rins, D0.hz]);
  await reloadWith({ v: 5, metro: 'us', beds: '3', P: '500000', rins: '0', hz: '5.6' });
  const mig = await page.evaluate(() => [numOf('rins'), numOf('hz')]);
  ok(mig[0] === defs[0] && mig[1] === defs[1], 'old save: renter\'s insurance and moving chance take the new defaults', JSON.stringify([mig, defs]));
  await reloadWith({ v: 6, metro: 'us', beds: '3', P: '500000', rins: '0', hz: '5.6' });
  ok(await page.evaluate(() => numOf('rins') === 0 && numOf('hz') === 5.6), 'a v6 save keeps its own values');
  ok(defs[0] > 20 && defs[1] > 1 && defs[1] < 15, 'defaults come from the public data', JSON.stringify(defs));

  /* forecast preset: public 10-year forecasts, homes and rent = forecast inflation plus their own real growth */
  const fc = await page.evaluate(() => { const f = PRESETS.fcst, real = a => (1 + geo(a, 1972) / 100) / (1 + geo(INF, 1972) / 100);
    return f && { f, gh: ((1 + f.inf / 100) * real(HOME) - 1) * 100, note: document.getElementById('fcstPreset').parentElement.nextElementSibling.textContent }; });
  ok(fc && fc.f.rs === FCSTV.rs && Math.abs(fc.f.gh - fc.gh) < 0.01, 'forecast preset uses the survey and real home growth', JSON.stringify(fc && fc.f));
  ok(fc && !/__G[HR]__/.test(fc.note) && /Philadelphia Fed/.test(fc.note), 'forecast note names its source and fills in homes and rent');

  /* header line with the data date */
  ok(/Market data updated .+ refreshed weekly/.test(await page.textContent('#asof')), 'header shows when the data was updated');

  /* state rules follow the location: income tax (Massachusetts flat), inflation-linked cap (Florida), county transfer taxes (Washington) */
  await page.evaluate(() => { localStorage.removeItem('rbi-inputs'); });
  await set({ metro: 'boston' }); await page.waitForTimeout(500);
  const ma = await page.evaluate(() => [P.stMode, P.stRate, P.stDed, P.stTax, document.getElementById('stTax').disabled]);
  ok(ma[0] === 'auto' && Math.abs(ma[1] - 0.05) < 1e-9 && ma[2] === false && ma[3] > 0 && ma[4], 'Massachusetts: 5% state tax, no deduction, fields locked', JSON.stringify(ma));
  await set({ metro: 'miami' }); await page.waitForTimeout(500);
  const fl = await page.evaluate(() => [P.stTax, P.stRate, P.ptaxCap, P.ptaxCapCPI]);
  ok(fl[0] === 0 && fl[1] === 0 && Math.abs(fl[2] - 0.03) < 1e-9 && fl[3] === true, 'Florida: no income tax; 3% or inflation assessment cap', JSON.stringify(fl));
  await set({ stMode: 'manual' }); await page.waitForTimeout(400);
  ok(await page.evaluate(() => P.stMode === 'manual' && !document.getElementById('stTax').disabled), 'manual state tax unlocks the fields');
  await set({ stMode: 'auto' });
  const wa = await page.evaluate(() => loadCounties().then(() => { const m = countyMetro('cty:53033'); return [m.st, m.ptaxCap, m.tt && m.tt.length, transferTaxes(m.tt, 600000, 480000).seller]; }));
  ok(wa[0] === 'WA' && wa[1] === 0 && wa[2] > 0 && Math.abs(wa[3] - (525000 * 0.011 + 75000 * 0.0128 + 600000 * 0.005)) < 1, 'King County: Washington state REET plus the 0.5% county rate, no cap', JSON.stringify(wa));
  await set({ metro: 'us' }); await page.waitForTimeout(300);

  /* homestead exemption: the rate is before the exemption, so the typical Dallas home still pays the new-buyer Census rate */
  await set({ metro: 'dallas' }); await page.waitForTimeout(500);
  const tx = await page.evaluate(() => { const m = selMetro(); return [P.hsEx, ptaxOn(P, m.P) / m.P, m.acs.rate / 100, ptaxOn(P, 200000) / 200000 < ptaxOn(P, 600000) / 600000]; });
  ok(tx[0] === 70000 && Math.abs(tx[1] - tx[2]) < 1e-4 && tx[3], 'Texas: $70k exemption, typical home at the Census rate, cheaper homes taxed at a lower share', JSON.stringify(tx));
  /* local income tax for counties (Montgomery County, MD) and credit score */
  const md = await page.evaluate(() => loadCounties().then(() => { const r = stateIncomeTax('MD', 150000, 'single', '24031'); return [r.local && r.local.rate, r.local && r.local.tax > 3000, r.tax]; }));
  ok(md[0] === 0.032 && md[1], 'Montgomery County, MD: 3.2% local income tax added', JSON.stringify(md));
  const r0 = await page.evaluate(() => loanSetup(P, P.rate).rate);
  await set({ fico: '639-' }); await page.waitForTimeout(400);
  const r1 = await page.evaluate(() => [loanSetup(P, P.rate).rate, pmiRate(Object.assign({}, P, { dp: 0.05 }), 0.05) / pmiRate(Object.assign({}, P, { dp: 0.05, fico: '760-779' }), 0.05), CREDIT.pmi.rel['639-']]);
  ok(Math.abs(r1[0] - r0 - 0.0053125) < 1e-9 && Math.abs(r1[1] - r1[2]) < 1e-9, 'credit 639 or lower: +0.53 pts and higher PMI', JSON.stringify([r0, r1]));
  await set({ fico: '760-779', metro: 'us' }); await page.waitForTimeout(300);
  /* charts: an axis of named categories keeps every label (no tick limit) and every axis sizes its margin to its labels */
  const ax = await page.evaluate(() => { const L = fitAxes([{ y: ['a', 'b'], x: [1, 2] }], { xaxis: { nticks: 6 }, yaxis: { nticks: 5 } }); return [L.yaxis.nticks, L.xaxis.nticks, L.yaxis.automargin, L.xaxis.automargin]; });
  ok(ax[0] === undefined && ax[1] === 6 && ax[2] && ax[3], 'category axes show every label; numeric axes keep their tick limit', JSON.stringify(ax));
  /* the dollar basis is named in the headline and switches with the toggle */
  const bh = await page.evaluate(async () => { const a = document.getElementById('vhead').textContent; document.getElementById('nomBtn').click(); await new Promise(r => setTimeout(r, 900));
    const b = document.getElementById('vhead').textContent; document.getElementById('realBtn').click(); await new Promise(r => setTimeout(r, 900)); return [a, b]; });
  ok(/today's \$/.test(bh[0]) && /nominal \$/.test(bh[1]), 'headline names the dollar basis', JSON.stringify(bh));
  /* every chart says which model sections, data and settings produced it; big tables start folded */
  const ci = await page.evaluate(() => { const plots = [...document.querySelectorAll('.card .plot')].map(p => p.id.slice(2));
    const missing = plots.filter(k => !document.querySelector(`dd.cinfo[data-c="${k}"]`));
    const box = document.createElement('div'); box.innerHTML = ciHTML('nw');
    return { missing, links: box.querySelectorAll('[data-ci-sec]').length, sets: box.querySelectorAll('[data-ci-set]').length, folded: [...document.querySelectorAll('details.tfold')].every(d => !d.open) }; });
  ok(!ci.missing.length && ci.links >= 3 && ci.sets >= 8 && ci.folded, 'chart notes on every chart; tables folded', JSON.stringify(ci));
  /* Basic shows the core settings only, says when hidden settings were changed, and a search looks through all of them */
  const bm = await page.evaluate(async () => { const vis = () => [...document.querySelectorAll('aside .f')].filter(r => getComputedStyle(r).display !== 'none' && !r.hidden && r.closest('details:not([hidden])') && getComputedStyle(r.closest('details')).display !== 'none').length;
    setMode('basic'); const b = vis(); const n0 = +((document.getElementById('modeNote').textContent.match(/^(\d+)/) || [0, 0])[1]); setMode('all'); const a = vis(); const h = document.getElementById('hoa'); h.value = '150'; h.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 600)); setMode('basic'); const note = document.getElementById('modeNote').textContent; filterSettings('hoa'); const q = vis(); filterSettings('');
    resetField('hoa'); update(); setMode('all'); return { b, a, note, q, n0 }; });
  ok(bm.b === 13 && bm.a > 60 && new RegExp('^' + (bm.n0 + 1) + ' other changed').test(bm.note) && bm.q === 1, 'Basic / All settings', JSON.stringify(bm));
  /* untrusted values (shared links, old saves) can't inject HTML: fields keep only numbers or listed options */
  const xs = await page.evaluate(async () => { const inc = document.getElementById('income').value;
    setRaw({ income: '<img/src="x"/onerror="window.PWNED=1">', loanType: '<b>x</b>', P: '400,000' }); printInputs(); await new Promise(r => setTimeout(r, 300));
    const r = { pwned: !!window.PWNED, income: document.getElementById('income').value, loan: document.getElementById('loanType').value, P: document.getElementById('P').value, imgs: document.querySelectorAll('#printInputs img').length };
    setRaw({ income: inc, P: '366157' }); update(); return r; });
  ok(!xs.pwned && xs.imgs === 0 && !/</.test(xs.income) && xs.loan !== '<b>x</b>' && /400/.test(xs.P), 'shared-link values are validated and escaped', JSON.stringify(xs));
  /* saved setups and shared links from older versions: untouched old defaults are dropped, edited values kept */
  const mg = await page.evaluate(() => { const capF = CAP_FROM_LOC, taxF = TAX_FROM_LOC;
    const a = migrateSave({ v: 5, rins: '0', hz: '5.6', pmi: '0.5', metro: 'boston', ptaxCap: '0', stTax: '8000' }), b = migrateSave({ v: 7, ptax: '1.1', floodIns: '0' }), c = migrateSave({ v: 8, ptax: '1.3', hsEx: '0' });
    const r = { a: [a.rins, a.hz, a.pmi, a.ptaxCap, a.stMode], b: [b.ptax, b.floodIns, TAX_FROM_LOC && TAX_FROM_LOC.ptax], c: c.ptax };
    CAP_FROM_LOC = capF; TAX_FROM_LOC = taxF; return r; });
  ok(JSON.stringify(mg) === JSON.stringify({ a: [null, null, null, null, 'auto'], b: [null, null, '1.1'], c: '1.3' }), 'old saves and links are brought up to date', JSON.stringify(mg));
  /* every list that names settings, Method sections or sources refers to ones that exist */
  const reg = await page.evaluate(() => { const ids = new Set(F.map(f => f[1])), bad = [];
    Object.keys(DEPS).concat(CORE, QUICK).forEach(id => { if (!ids.has(id)) bad.push('setting ' + id) });
    Object.entries(CHART_INFO).forEach(([k, c]) => { c.a.forEach(id => { if (!ids.has(id)) bad.push(k + ': setting ' + id) });
      c.m.forEach(m => { if (!document.getElementById('m-' + m)) bad.push(k + ': method ' + m) }); c.d.forEach(d => { if (!SRC[d]) bad.push(k + ': source ' + d) });
      if (!document.getElementById('p-' + k)) bad.push('chart ' + k) });
    return bad; });
  ok(!reg.length, 'settings, Method sections and sources named in lists all exist', reg.join(', '));
  /* after a link from a chart's notes, the Back button and the browser's back return to the chart */
  await page.evaluate(() => { const d = document.querySelector('dd.cinfo[data-c="gap"]').closest('details'); d.open = true; });
  await page.waitForTimeout(200); await page.click('dd.cinfo[data-c="gap"] a[data-ci-sec]'); await page.waitForTimeout(700);
  const bk1 = await page.evaluate(() => [CUR, !document.getElementById('ciBack').hidden, document.getElementById('ciBack').textContent]);
  await page.click('#ciBack'); await page.waitForTimeout(700);
  const bk2 = await page.evaluate(() => { const r = document.getElementById('p-gap').getBoundingClientRect(); return [CUR, document.getElementById('ciBack').hidden, r.top < innerHeight && r.bottom > 0]; });
  await page.click('dd.cinfo[data-c="gap"] a[data-ci-set]'); await page.waitForTimeout(500);
  const bkSet = await page.evaluate(() => [...document.querySelectorAll('.ciback')].filter(b => !b.hidden).map(b => { const r = b.getBoundingClientRect(); return [b.closest('.ahead') ? 'panel' : 'tabs', r.top >= 0 && r.bottom <= innerHeight && r.width > 0]; }));
  ok(JSON.stringify(bkSet) === '[["panel",true]]', 'after a setting link, Back sits in the assumptions header, on screen', JSON.stringify(bkSet));
  await page.goBack(); await page.waitForTimeout(700);
  const bk3 = await page.evaluate(() => [CUR, document.getElementById('ciBack').hidden]);
  ok(bk1[0] === 'method' && bk1[1] && /Where the gap/.test(bk1[2]) && bk2[0] === 'proj' && bk2[1] && bk2[2] && bk3[0] === 'proj' && bk3[1], 'back from a chart-note link to the chart', JSON.stringify([bk1, bk2, bk3]));
  /* sensitivity chart: the row labels fit inside the chart */
  await page.evaluate(() => document.querySelector('[role="tab"][data-tab="sens"]').click()); await page.waitForTimeout(1200);
  const torClip = await page.evaluate(() => { const p = document.getElementById('p-tor'), L = p.getBoundingClientRect().left; return [...p.querySelectorAll('.ytick text')].filter(t => t.getBoundingClientRect().left < L - 1).map(t => t.textContent); });
  ok(!torClip.length, 'sensitivity chart labels are not cut off', JSON.stringify(torClip));
  await page.evaluate(() => document.querySelector('[role="tab"][data-tab="proj"]').click()); await page.waitForTimeout(500);
  /* money fields: separators appear while typing, and typing replaces the selected value */
  await page.click('#q-P'); await page.keyboard.type('1250000'); const lv = await page.evaluate(() => document.getElementById('q-P').value);
  await page.waitForTimeout(600); const lp = await page.evaluate(() => P.P);
  await page.click('#q-P'); await page.keyboard.type('366157'); await page.waitForTimeout(600);
  ok(lv === '1,250,000' && lp === 1250000, 'thousands separators while typing; typing replaces the value', JSON.stringify([lv, lp]));
  /* dependent settings: hidden while the setting they depend on makes them irrelevant */
  const vis = id => page.evaluate(id => !document.getElementById(id).closest('.f').classList.contains('dep-off'), id);
  const d0 = [await vis('armRate'), await vis('pmi'), await vis('mu'), await vis('refiTh')];
  await set({ loanType: 'arm', dp: '5', taxOn: '0' }); await page.evaluate(() => syncDeps());
  const d1 = [await vis('armRate'), await vis('pmi'), await vis('mu')];
  ok(!d0[0] && !d0[1] && d0[2] && d1[0] && d1[1] && !d1[2], 'dependent settings show and hide with their parent', JSON.stringify([d0, d1]));
  await set({ loanType: 'fixed', dp: '20', taxOn: '1' }); await page.evaluate(() => syncDeps());

  ok(!errors.length, 'no page errors', errors.join(' | '));
  await browser.close(); server.close();
  console.log(`${pass} passed, ${fail} failed`); if (fail) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
