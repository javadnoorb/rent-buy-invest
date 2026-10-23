# Rent, Buy or Invest

**Live app:** https://javadnoorb.github.io/rent-buy-invest/

An interactive calculator comparing three paths on the same monthly budget:

- **Buy** a home and invest any monthly surplus.
- **Rent and invest** the difference in a stock/bond/T-bill portfolio.
- **Rent and hold T-bills.**

Results are liquidation net worth: what each household would have after selling the house, paying off the mortgage, and cashing out, net of selling costs and taxes.

The whole app is one static page, `index.html`. Open it in a browser or serve it with GitHub Pages.

## Install on your phone

- **iPhone (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap the **⋮** menu, then **Install app** (or **Add to Home screen**).

It then opens full-screen from its own icon, and works offline after the first visit.

## Features

- **Projection:** month-by-month model covering mortgage amortization, PMI, refinancing, property tax (with an optional assessment cap), insurance, maintenance, HOA, the federal itemized-deduction benefit (2026 standard deduction, SALT cap schedule, $750k interest limit) and the Section 121 home-sale exclusion. Portfolios can be taxable or sheltered, with yearly dividend and interest tax and optional leverage.
- **Location presets:** 23 U.S. metros with Zillow home values and rents, property-tax rates, state insurance averages, and FHFA metro home-price and BLS metro rent history.
- **Sensitivity:** a tornado chart of the main inputs, a heatmap of home appreciation × portfolio return, and break-even rent curves.
- **Optimizer:** down payment × horizon for 15- and 30-year loans, plus the break-even value of each key input.
- **Backtest:** annual data for 1972–2025 and monthly data for 1987–2026, using actual home prices, rents, returns, inflation and mortgage rates (with refinancing).
- **Monte Carlo:** block bootstrap of joint historical years, optionally re-centered to your assumptions. Includes single-house price risk, sampled mortgage-rate paths, moving risk, certainty equivalents, expected shortfall and liquidity stress.
- **Other ways to own:** house-hacking income (renting part of your home) and an optional fourth path: rent your home and buy a rental property (vacancy, management, depreciation, passive-loss limits, recapture).
- **Realism:** lease renewals vs. market rent with resets on moves, income growth with per-year tax brackets, a planned move (sell and rebuy, or sell and rent), and moves that are likelier in downturns with a forced-sale discount.
- **Presets:** 1928–2025 and 1972–2025 historical averages, current year-over-year figures, and 2026 published forecasts (Horizon Actuarial survey of 43 firms; Pulsenomics home-price expectations).
- **Any county:** pick "Any U.S. county…" in Location to fill price, rent and property tax for any of about 3,200 counties from Census ACS 5-year data, scaled to today's national Zillow figures (appears once the Refresh data workflow has fetched `data/counties.json`).
- **Rent from price:** by default the comparable rent is estimated from the home price (the location's typical rent × (price ÷ typical price)^0.65, from Census county data), so pricier homes don't get an unrealistically low rent; typing a rent uses yours instead.
- **Mortgage choices:** extra monthly payments toward principal or invested instead (with the difference shown in the summary), PMI removal by appraisal, and a home-equity line counted as an emergency reserve.
- **Locations:** the same household in all 23 metros at once: verdict, monthly cost, cash needed, affordability and break-even year, sortable, with growth set the same everywhere, adjusted by each metro's history, or taken from it.
- **Scenarios:** save named setups in the browser and compare them.
- **Share and print:** copy a link, use the phone's share sheet, or print the answer with your inputs (or save it as a PDF). An undo bar lists what changed whenever one action changes several settings.
- **Help, accessibility and offline:** a "?" next to every setting, number and chart; every chart is announced to screen readers with its title and written takeaway; works offline once installed; warns when market data is more than three weeks old.
- **Sources:** every data point links to its source; the Method tab lists the formulas.

## Repository layout

| Path | Contents |
|---|---|
| `index.html` | Built app (generated; do not edit by hand) |
| `src/` | `body.html`, `style.css`, `model.js` (simulation), `app/NN-*.js` (UI and charts, concatenated in order) |
| `data/snapshot.json` | Current market figures shown in the header cards and used as defaults |
| `data/metro_*.json` | Per-metro price, rent, tax, insurance and home-price index, with source URLs |
| `data/counties.json` | County median home value, contract rent and real-estate tax (Census ACS 5-year), written by `scripts/fetch_counties.py` |
| `data/research.json` | Sourced parameters (single-house volatility, tenure, dividend yield, costs, annual mortgage averages) |
| `data/monthly.json` | Raw monthly series, 1987–2026 |
| `data/monthly_processed.json` | Monthly returns used by the monthly backtest |
| `build.py` | Assembles `index.html` from `src/` and `data/` |
| `manifest.webmanifest`, `sw.js`, `icons/` | Home-screen install and offline support |
| `vendor/` | Pinned copies of Plotly 2.35.2, cartesian build (MIT) and MathJax 3.2.2 (Apache-2.0) used by the installed build, with their licenses |
| `make_icons.py` | Draws the app icons |
| `prep_monthly.py` | Converts `monthly.json` into `monthly_processed.json` |

## Development

Everything runs with the Python standard library and Node; no install is needed except Playwright for the browser test.

| Command | What it does |
|---|---|
| `npm run build` | Builds `index.html` (the GitHub Pages / installable version) |
| `npm run build:artifact` | Builds `dist/artifact.html`, the version that runs inside a Claude artifact |
| `npm run watch` | Rebuilds `index.html` whenever `src/` or `data/` changes |
| `npm run serve` | Serves the folder at http://localhost:8000 |
| `npm test` | Lint plus the model tests (about a second) |
| `npm run smoke` | Browser test with the real chart and formula libraries (needs `npm i playwright`) |
| `npm run test:ui` | Browser test of the UI logic: headline wording, ties, undo, counties, chart descriptions |
| `npm run check` | Build, test, and the browser tests with a stubbed chart library (works offline) |

`src/app/*.js` files are concatenated in name order into one script, so they share one scope: `npm run lint` fails if a top-level name is declared twice, if code looks up an element id that does not exist, or if a setting has no pop-up help.

## Updating figures

1. Edit the figures in `data/snapshot.json` (or a metro file), keeping each source URL in step with its value.
2. If you changed `data/monthly.json`, run `python3 prep_monthly.py`.
3. Run `npm run build` and commit `index.html` with your change (CI fails if it is out of date).
4. Push. GitHub Pages serves the new version within a minute or two.

The GitHub Pages build loads Plotly (charts, the 1.4 MB cartesian build) and MathJax (formulas) from `vendor/` and precaches them for offline use; only Google Fonts comes from a CDN. MathJax loads the first time a tab with formulas opens, and the county list (`data/counties.json`) the first time someone picks a county; data files are fetched network-first so monthly refreshes show up. The artifact build loads both libraries from public CDNs. To upgrade a library, replace its file in `vendor/`, update the paths in `build.py` and `sw.js`, and bump `CACHE` in `sw.js`.

## Refreshing data

The **Refresh data** workflow runs on the 4th of each month and on demand (Actions tab → Refresh data → Run workflow). It downloads FHFA home-price indexes, BLS CPI, rent and insurance price indexes, Census ACS tables (including county figures) and Freddie Mac mortgage rates; merges them into `data/` with `scripts/apply_public.py`; rebuilds `index.html`; then `scripts/check_data.py` compares the new data with what is on main and stops the run on anything implausible (months lost, past values revised by more than a few percent, mortgage rates moving more than 1.5 points in a month or 2 points between refreshes, price indexes jumping more than 5% in a month, out-of-range tax rates, or a county file that is short or has many medians changing by more than half). If that and the tests pass and something changed, it commits to main and GitHub Pages serves the update. Zillow, NAR, property-tax and insurance survey figures, forecasts and tax law are updated by hand.

## Tests

`npm test` runs `tests/lint.js` (static checks) and `tests/run.js`, with `tests/run_new.js`, which check the model math (mortgage amortization against the closed form, tax brackets, SALT cap, home-sale exclusion, PMI, refinancing, annual vs. monthly paths, directional sanity checks, each realism feature, underwater sales, tax-year indexing, and property checks over random inputs: results stay finite, monthly and annual paths agree, and higher home or stock growth never hurts the matching path). Run it after any change to `src/model.js`. `tests/smoke.js` opens every tab at phone width and fails on page errors, charts that don't draw, formulas that don't render, anything wider than the screen, or a chart readout that doesn't close on a second tap. `tests/ui.js` loads the page with a small county list swapped in and checks the headline wording, ties, break-even search, affordability colors, the undo bar, the county picker, Monte Carlo caching and chart descriptions. All run on every push (Tests workflow, about a minute).

## Data sources

- **Annual returns, 1928–2025:** Damodaran, NYU Stern. The national real-estate series is Shiller's reconstruction through 1986 and Case-Shiller 1987–1991 (as published by Damodaran); from 1992 it is FHFA's U.S. purchase-only index, rebuilt from `data/monthly.json` at each build, with its swings scaled to Case-Shiller's size by one stored ratio.
- **CPI and rent CPI:** BLS (public domain).
- **Mortgage rates:** Freddie Mac PMMS (used with attribution).
- **Treasury rates:** Federal Reserve H.15 (public domain).
- **Home-price indexes:** FHFA purchase-only indexes (public), downloaded from fhfa.gov by `scripts/fetch_fhfa.py` (run by hand via the *Fetch FHFA house price data* workflow). Case-Shiller data are not stored; one volatility ratio per location is.
- **S&P 500 monthly:** total returns only, computed from Robert Shiller's monthly data (index levels not stored).
- **Home values and rents:** Zillow market reports.
- **Property tax:** ATTOM and SmartAsset.
- **Insurance:** Insurify.
- **Tax law:** IRS releases.

Full links are inside the app.

Market figures are a snapshot as of the date shown in the header. This tool is for exploring trade-offs, not financial or tax advice.
