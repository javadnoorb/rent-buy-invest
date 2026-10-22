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

It then opens full-screen from its own icon, and works offline after the first visit (charts need one online load to cache the charting library).

## Features

- **Projection:** month-by-month model covering mortgage amortization, PMI, refinancing, property tax (with an optional assessment cap), insurance, maintenance, HOA, the federal itemized-deduction benefit (2026 standard deduction, SALT cap schedule, $750k interest limit) and the Section 121 home-sale exclusion. Portfolios can be taxable or sheltered, with yearly dividend and interest tax and optional leverage.
- **Location presets:** 23 U.S. metros with Zillow home values and rents, property-tax rates, state insurance averages, and metro home-price history from Case-Shiller or FHFA.
- **Sensitivity:** a tornado chart of the main inputs, a heatmap of home appreciation × portfolio return, and break-even rent curves.
- **Optimizer:** down payment × horizon for 15- and 30-year loans, plus the break-even value of each key input.
- **Backtest:** annual data for 1972–2025 and monthly data for 1987–2026, using actual home prices, rents, returns, inflation and mortgage rates (with refinancing).
- **Monte Carlo:** block bootstrap of joint historical years, optionally re-centered to your assumptions. Includes single-house price risk, sampled mortgage-rate paths, moving risk, certainty equivalents, expected shortfall and liquidity stress.
- **Other ways to own:** house-hacking income (renting part of your home) and an optional fourth path: rent your home and buy a rental property (vacancy, management, depreciation, passive-loss limits, recapture).
- **Realism:** lease renewals vs. market rent with resets on moves, income growth with per-year tax brackets, a planned move (sell and rebuy, or sell and rent), and moves that are likelier in downturns with a forced-sale discount.
- **Presets:** 1928–2025 and 1972–2025 historical averages, current year-over-year figures, and 2026 published forecasts (Horizon Actuarial survey of 43 firms; Pulsenomics home-price expectations).
- **Scenarios:** save named setups in the browser and compare them.
- **Sources:** every data point links to its source; the Method tab lists the formulas.

## Repository layout

| Path | Contents |
|---|---|
| `index.html` | Built app (generated; do not edit by hand) |
| `src/` | `body.html`, `style.css`, `model.js` (simulation), `app/NN-*.js` (UI and charts, concatenated in order) |
| `data/snapshot.json` | Current market figures shown in the header cards and used as defaults |
| `data/metro_*.json` | Per-metro price, rent, tax, insurance and home-price index, with source URLs |
| `data/research.json` | Sourced parameters (single-house volatility, tenure, dividend yield, costs, annual mortgage averages) |
| `data/monthly.json` | Raw monthly series, 1987–2026 |
| `data/monthly_processed.json` | Monthly returns used by the monthly backtest |
| `build.py` | Assembles `index.html` from `src/` and `data/` |
| `manifest.webmanifest`, `sw.js`, `icons/` | Home-screen install and offline support |
| `make_icons.py` | Draws the app icons |
| `prep_monthly.py` | Converts `monthly.json` into `monthly_processed.json` |

## Updating

1. Edit the figures in `data/snapshot.json` (or a metro file), keeping each source URL in step with its value.
2. If you changed `data/monthly.json`, run `python3 prep_monthly.py`.
3. Run `python3 build.py --pwa` to regenerate `index.html`. Without `--pwa` it builds the version that runs inside a Claude artifact.
4. Commit and push. GitHub Pages serves the new version within a minute or two.

The build uses only the Python standard library. In the browser, the page loads Plotly (charts), MathJax (formulas) and Google Fonts from public CDNs.

## Refreshing data

The **Refresh data** workflow (Actions tab → Refresh data → Run workflow) downloads FHFA home-price indexes, BLS CPI, rent and insurance price indexes, Census ACS tables and Freddie Mac mortgage rates; merges them into `data/` with `scripts/apply_public.py`; rebuilds `index.html`; runs the tests; and commits only if the tests pass. It never runs on a schedule. Zillow, NAR, property-tax and insurance survey figures, forecasts and tax law are updated by hand.

## Tests

`node tests/run.js` checks the model math (74 checks) (mortgage amortization against the closed form, tax brackets, SALT cap, home-sale exclusion, PMI, refinancing, annual vs. monthly paths, directional sanity checks, and each realism feature). Run it after any change to `src/model.js`. `node tests/smoke.js` opens every tab in a browser and fails on errors or charts that don't draw. Both run automatically on every push (Tests workflow).

## Data sources

- **Annual returns, 1928–2025:** Damodaran, NYU Stern. The real-estate series is Case-Shiller from 1987 and Shiller's reconstruction before that.
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
