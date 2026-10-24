---
name: upgrade-app
description: Audit and upgrade the Rent, Buy or Invest app end to end — check the financial formulas, the user-facing text, the UI/UX on desktop and phone, and the code structure / dev loop with independent reviewers, verify every finding, fix in a safe order, test, and ship. Use when asked to "improve the app", "what else can be improved", "check formulas / text / UI", "review the app", or to repeat this upgrade pass.
---

# Upgrade pass for Rent, Buy or Invest

A repeatable pass that finds and fixes problems across the whole app. It worked well as: **independent reviews in
parallel → verify each finding in the code → fix in priority order → test everything → ship → report**.

Repo layout to know first: `build.py` assembles `index.html` from `src/body.html`, `src/style.css`, `src/model.js`
(all the math, no DOM) and `src/app/NN-*.js` (plain scripts sharing one global scope, concatenated in file order) plus
`data/*.json`. The Method tab (`src/app/16-method.js`) documents every formula; it must match `src/model.js`.
Settings are the `F` table in `src/app/03-inputs.js` (label, default, hint), help text in `src/app/186-help.js`,
chart notes in `src/app/188-chart-info.js`, Basic-mode/dependency lists in `src/app/185-settings.js`.

## 0. Set up (once per session)

```bash
python3 build.py --pwa                                  # 0.1 s
python3 -m http.server 8765 >/dev/null 2>&1 &           # browser tests and screenshots use :8765
```
- Playwright + Chromium are preinstalled in cloud sessions (`require('playwright')`). Put `typescript@5.6.3` and
  `axe-core@4.10.2` in a scratch `node_modules` (`npm i --no-save` in the scratchpad; note `npm i --no-save` removes
  packages not named, so install both together) and symlink it as `node_modules` in the repo only while running
  `tests/a11y.js`; remove the link afterwards.
- Government data sites are usually blocked from the container. To read a PDF or call an API, push a temporary
  `.github/workflows/probe.yml` on the working branch (trigger: push to that branch, `paths: [.github/workflows/probe.yml]`),
  read its log with the GitHub MCP `get_job_logs`, then delete the probe in a later commit.

## 1. Review — four independent agents in parallel (background)

Launch four `general-purpose` agents in one message. Each **reports only, edits nothing**, writes scratch files under
the scratchpad, and gets file pointers rather than conclusions. Ask each for a prioritized list with file:line, a
concrete example, a proposed fix, and an explicit list of what it checked and found correct.

1. **Formulas** — `src/model.js` (simulate, loanSetup, PMI/FHA/ARM, refinancing, taxes incl. SALT cap, $750k limit,
   home-sale exclusion, NIIT, transfer taxes, assessment caps, Monte Carlo `mcCore`), `05-analysis-helpers.js`,
   `095-gap.js` (parts must sum exactly), `115-afford.js`, `17-snapshot.js` (state/local tax, county rules),
   `03-inputs.js parseP` (units: % vs decimal, monthly vs yearly). Compare with the Method tab. Probe numerically by
   loading `model.js` in `vm` the way `tests/run.js` does. Check the current tax year's rules (law changes!).
2. **Text** — every label, hint, help popup, caption, "How to read this", generated headline/takeaways, Method text,
   README. Accuracy vs. what the code does; one term per concept; clarity for a non-expert; render several scenarios
   (default, a tie, short/long horizon, FHA 3.5%, taxes off, rental path, a high-cost metro) and read the generated text.
3. **UI/UX** — Playwright at 1280×900 and 390×844 (isMobile/hasTouch), light and dark; realistic tasks (first visit,
   set up my case incl. county/ZIP, find a setting, compare places, scenarios, share/print). Measure load, tab and
   Monte Carlo times, layout shift (CLS), tap targets, overflow, focus/keyboard, sticky elements covering content.
   The agent must look at its screenshots.
4. **Code / dev loop** — time every check, find fragility (global state, duplicated lists, hard-coded years, unescaped
   HTML from shared links/saves, silent catches), build/CI robustness (deploy gating, workflow duplication), and
   propose small, low-risk refactors with effort estimates. House style is dense one-line JS: don't propose
   reformatting the codebase.

While they run, also do a **visual sweep** yourself: `node .claude/skills/upgrade-app/sweep.js <outdir>` screenshots
every chart on every tab at desktop and phone width, in the Detailed view (light and dark with `--dark`); then
`python3 .claude/skills/upgrade-app/montage.py <outdir>` tiles them so a few image reads cover all charts. Look for
missing axis titles, overlapping labels, clipped annotations, legends colliding with titles, empty or half-drawn series
(e.g. zeros on a log axis), unreadable dark-mode bands.

## 2. Verify before fixing

Reviewers can be confidently wrong. For each finding, read the code it cites and reproduce it (a numeric probe, a
Playwright check, a screenshot). Drop what doesn't reproduce; note uncertain claims (e.g. figures from memory or
search snippets) as uncertain in the report and in code comments.

## 3. Fix, in this order, committing each batch

1. **Formula bugs** that change results → fix in `model.js`, add a test per fix in `tests/run_new.js` (exports in
   `tests/run.js EXPORTS`), update the Method tab to match, and run `node tests/validate.js` (published-study check).
   Report before/after headlines for the default U.S. case and a couple of metros.
2. **Security** (anything from `?s=` links or `localStorage` reaching `innerHTML`: validate in `setRaw`, escape with
   `escapeHtml`), then **code/CI** hardening and refactors.
3. **Text**: contradictions on the same screen first, then accuracy, then terminology and formatting. Re-render the
   scenarios to read the generated text again.
4. **UI/UX**: input behaviour, layout shift, phone hierarchy, tap targets, print, keyboard, dark mode.

Conventions: match the surrounding code's density and comment style; comments explain *why*; no hard-coded data years
(`LAST_Y`); settings must exist in `F` (a UI test checks every list that names settings, Method sections or sources).
When the "How to read this" text or a takeaway describes a chart, keep it true after the change.

## 4. Test

```bash
npm run check:fast        # build, lint, tsc, model tests, validate, parser tests (~5 s)
npm run check:all         # + smoke, ui, a11y in parallel (~2 min; a11y needs axe-core, see setup)
```
Add a UI test (`tests/ui.js`) for each new behaviour. If a test asserted old wording, update it to the new wording
rather than weakening it.

## 5. Ship

- Commit on the working branch with a descriptive message (what changed and why, grouped), push the branch, then
  fast-forward `main` (`git fetch origin main && git merge origin/main`, push `HEAD:main`).
- The site deploys only after the **Tests** workflow passes on `main` (`pages.yml` is triggered by `workflow_run`), so
  check that Tests and then "Deploy site" succeed.
- Don't push to `main` while a **Refresh data** run is in progress if avoidable (it merges `main` if it moved, but
  a conflict on data files stops it).

## 6. Report

Lead with what changed for the user (results that moved, with numbers), then text and UI changes, then code/dev-loop
changes, then what was **not** done and why, and any uncertain facts. Offer the next candidates as a short list.

## Lessons from previous passes

- Monte Carlo block bootstrap must wrap around (circular), or re-centering misses the user's growth rates.
- "Break-even" must be defined the same way everywhere (through the horizon), and anything computed on a 30-year run
  must say so; same for "wins more often than not".
- Year-1 / month-1 costs: say which (before or after tax savings, nominal or today's $).
- Log axes can't show zero, and a linear axis scaled to one series hides the other (liquidity: renter 30–90 months,
  buyer 0–13): plot log10(1 + value) with ticks labelled in real values (0, 1, 3, 6, 12…) and exact values on hover.
- Category axes on phones lose labels if `nticks` applies: `fitAxes` in `04-state-helpers.js` handles it.
- Typing into a field must replace the value (select on focus) and money fields keep separators while typing.
- Reserve the height of anything filled in by script (market cards) and mark Basic-mode groups in the HTML to avoid
  layout shift.
- Colour: run the dataviz skill's validator (`validate_palette.js`, light and dark surfaces, `--pairs all`) before changing
  series colours; don't eyeball. Marks use the validated series colours; coloured text uses the darker `--*-t` tokens
  (4.5:1 on cards and takeaways, axe checks it); status meanings (affordability) use `--good/--warn/--bad`, never the
  buy/rent colours; places get their own palette (`placePal`). Diverging maps: saturated at both ends, grey midpoint,
  dark-mode version; continuous heat maps use `zsmooth:'best'`; set the colour range from a percentile when a few
  cells are extreme. When colours change, search the help texts for colour words ("green", "red") and update them.
- Figures read like a paper's: axis titles name the variable and unit only; results ("buying won in 51%…", base values,
  refinance shares) go in the takeaway, not in axis titles or annotations. Every colour encoding needs a legend or a
  colour bar (dummy marker traces give scatter/histogram colours a legend). Reference lines go under the data
  (`plot()` sets `layer:'below'`, except over heatmaps). Use dollars when the price is fixed; % of price only when
  comparing different purchases.
- Simple / Detailed view: technical tabs and cards carry `class="tech"`; tests and the sweep open `?view=detailed`.
- References: each Method section lists its sources (`MREF` in `16-method.js`, checked by a UI test); every setting has
  a `.hint` element (an empty one is hidden) so location hints are never dropped; constants fitted from data get a
  refit test (`RENT_ELAST` in `tests/validate.js`); check links with `scripts/check_links.py` from a temporary probe
  workflow, then replace dead ones from official sources found by search (an agent can do this in the background).
- A source with several documents needs one entry per URL; a list joined into one href is a broken link.
- Every dataset belongs in the Data tab's inventory (`151-data-inventory.js`); a UI test fails when a cited source is
  missing from it. Show each figure's data period (from `SNAP.items`), not the fetch date, in one date style.
- On phones, don't line-clamp or ellipsize sentences: write a shorter version that fits (`.lede .lshort`); a UI test
  checks the header and market cards at 390px.
- State what each path must do to earn its result (the renter's up-front and monthly investing, `investPlan`), not
  only the outcome.
- Overlap checks must include drawn shapes, not only text: the gap chart's names collided with its arrows on phones
  (fixed by sizing the chart per row and giving labels a background). A test checks it at 390px.
