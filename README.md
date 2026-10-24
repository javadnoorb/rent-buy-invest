# Rent, Buy or Invest

**Live app:** https://javadnoorb.github.io/rent-buy-invest/

An interactive calculator comparing three paths on the same monthly budget:

- **Buy** a home and invest any monthly surplus.
- **Rent and invest** the difference in a stock/bond/T-bill portfolio.
- **Rent and hold T-bills.**

Results are liquidation net worth: what each household would have after selling the house, paying off the mortgage, and cashing out, net of selling costs and taxes.

The whole app is one static page, `index.html`, built from `src/` and `data/` by `build.py` (`npm run build`). It is not committed: the **Deploy site** workflow builds and publishes it with GitHub Pages on every push to main.

## Install on your phone

- **iPhone (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap the **⋮** menu, then **Install app** (or **Add to Home screen**).

It then opens full-screen from its own icon, and works offline after the first visit.

## Features

- **Projection:** month-by-month model covering mortgage amortization, PMI, refinancing, property tax (with an optional assessment cap), insurance, maintenance, HOA, the federal itemized-deduction benefit (2026 standard deduction, SALT cap schedule, $750k interest limit) and the Section 121 home-sale exclusion. Portfolios can be taxable or sheltered, with yearly dividend and interest tax and optional leverage.
- **Location presets:** 23 U.S. metros with Zillow home values and rents, property-tax rates, state insurance averages, and FHFA metro home-price and BLS metro rent history.
- **The renter's side:** under the answer, what the renter must invest to get the rent + invest result: the buyer's up-front cash at the start, then the monthly difference while renting is cheaper (and when the buyer invests instead), with what happens if the monthly savings are spent. The year-by-year table has the same amounts.
- **How this was computed:** tap or click any point on any chart to select it, then "How was this computed?" under the chart. The panel docks beside the page on wide screens (the charts narrow to fit) and fills the space below the chart on phones, so the chart stays in view; while it is open, clicking another point updates it. It shows that number as a tree of equations: each line opens to its equation, the same equation with your numbers in it, a link to the Method section that explains it, and the parts it is made of, down to settings (with where each value comes from and a link to change it), data (with its source) and the model's fixed rules. Statistics show how they are computed from the simulated futures, with the paths behind them traced in full. The Method tab's Equation index lists every equation the panel can show.
- **Data tab:** a table of every dataset in the app (what it is, what it's used for, its period and its sources), then charts of the history.
- **Simple / Detailed view:** a switch at the top. Simple (the default) shows the answer, the main charts, taxes, the loan, affordability, places and scenarios with the basic settings; Detailed adds the Backtest, Monte Carlo and Data tabs, the heat maps and the more technical cards. `?view=detailed` in the address opens Detailed.
- **Investing:** "invest" means an S&P 500 index fund by default (stock returns are the S&P 500's total return); the portfolio can mix in 10-year Treasuries and T-bills, leverage and fees, and a line under the answer says what it currently is.
- **Taxes and your loan:** a Taxes card totals what each path pays in each tax over the horizon and lists the rules that apply to you; a Your loan card shows the rate after credit score and points, the payment, mortgage insurance and when it ends, and when the projection refinances.
- **Basic / All settings:** the assumptions panel starts with the 13 settings that move the answer most; "All settings" shows every one, and a search always looks through all of them.
- **Chart notes:** under each chart, "How to read this" ends with the model sections (links into the Method tab), the data sources and the settings it uses with their current values (links open the setting).
- **Where the gap comes from:** the buy-minus-rent result split into home price change, selling and buying costs, interest, property tax, other owner costs, upkeep, tax savings, rent, inflation shrinking the loan and the renter's investment returns, adding up exactly.
- **Affordability:** the highest price your income and cash allow under the 28/36 guideline and a conservative 43% lender limit, and the income a given price needs (Optimizer tab).
- **Sensitivity:** a tornado chart of the main inputs, a heatmap of home appreciation × portfolio return, and break-even rent curves.
- **Optimizer:** down payment × horizon for 15- and 30-year loans, plus the break-even value of each key input.
- **Backtest:** annual data for 1972–2025 and monthly data for 1991–2026, using actual home prices, rents, returns, inflation and mortgage rates (with refinancing).
- **Monte Carlo:** block bootstrap of joint historical years, optionally re-centered to your assumptions. Includes single-house price risk, sampled mortgage-rate paths, moving risk, certainty equivalents, expected shortfall and liquidity stress.
- **Other ways to own:** house-hacking income (renting part of your home) and an optional fourth path: rent your home and buy a rental property (vacancy, management, depreciation, passive-loss limits, recapture).
- **Realism:** lease renewals vs. market rent with resets on moves, income growth with per-year tax brackets, a planned move (sell and rebuy, or sell and rent), and moves that are likelier in downturns with a forced-sale discount.
- **Presets:** 1928–2025 and 1972–2025 historical averages, current year-over-year figures, public 10-year forecasts (Philadelphia Fed Survey of Professional Forecasters; homes and rent at forecast inflation plus their 1972–2025 real growth), and the location's own history.
- **State rules by location:** picking a metro, county or ZIP code sets its state's income tax (2026 brackets: tax, rate on investment income, whether mortgage interest and property tax are deductible), its statewide assessment cap (e.g. California 2% or inflation, Florida 3% or inflation, Texas 10%), and for counties and ZIPs its state-level transfer taxes. Counties inside one of the 23 metros use the metro's BLS rent history.
- **Property tax for a new buyer:** Census tax rates average over all owners, including long-time owners whose taxes are held down by assessment caps; each location's rate is scaled by what owners who moved in within about four years pay in that state (Census microdata: about +19% in California, +15% in Florida, +10% in Texas). Statewide homestead exemptions and credits (e.g. Texas $140,000 for school taxes, Florida about $50,000, DC $91,950) are applied as dollars off the taxed value, with the rate shown before the exemption.
- **Credit score:** the mortgage rate moves by Fannie Mae's published loan-level price adjustments for your score and down payment, relative to the borrower behind Freddie Mac's survey rate; PMI scales by premiums by score (Urban Institute).
- **Flood insurance:** each location defaults to the average yearly flood-insurance cost across its homes (share with an NFIP policy × typical policy cost, FEMA OpenFEMA), with the share of homes in the high-risk zone in the hint.
- **Local taxes for counties and ZIPs:** county-wide income taxes (New York City, Maryland and Indiana counties, Philadelphia, Louisville, St. Louis, Portland area) and county transfer taxes (Maryland counties, New York City, San Francisco, Northern Virginia, Washington's local excise tax and others).
- **Side by side:** any two places (metro, county or ZIP) compared line by line, with a chart of the gap over time.
- **Any county:** pick "Any U.S. county…" in Location to fill price and property tax for any of about 3,200 counties from Census ACS 5-year data (values scaled to today's national Zillow figure), rent by bedrooms from HUD Fair Market Rents (without utilities), and local price history from FHFA's county indexes for the backtest, Monte Carlo and a local-average preset.
- **Rent from price:** by default the comparable rent is estimated from the home price (the location's typical rent × (price ÷ typical price)^0.65, from Census county data), so pricier homes don't get an unrealistically low rent; typing a rent uses yours instead.
- **ZIP codes:** type a 5-digit ZIP in the county search for that ZIP's median value and property tax (Census ACS by ZIP Code Tabulation Area) and rent by bedrooms (HUD Small Area Fair Market Rents, without utilities), with its county's insurance and price history.
- **Mortgage choices:** extra monthly payments toward principal or invested instead (with the difference shown in the summary), PMI removal by appraisal, and a home-equity line counted as an emergency reserve.
- **Locations:** the same household in all 23 metros at once: verdict, monthly cost, cash needed, affordability and break-even year, sortable, with growth set the same everywhere, adjusted by each metro's history, or taken from it.
- **Scenarios:** save named setups in the browser and compare them.
- **Share and print:** copy a link, use the phone's share sheet, or print the answer with your inputs (or save it as a PDF). An undo bar lists what changed whenever one action changes several settings.
- **Help, accessibility and offline:** a "?" next to every setting, number and chart; every chart is announced to screen readers with its title and written takeaway; works offline once installed; warns when market data is more than three weeks old.
- **Sources:** every data point links to its source; the Method tab lists the formulas, and each of its sections ends with the sources behind it.
- **Colours:** buy is red-orange, rent + invest blue, rent + T-bills teal, in every chart and table; maps of buy − rent use the same blue ↔ red-orange scale through grey. The palette is checked for colour-blind separation and text contrast; coloured text uses darker versions of the same hues, and affordability ratings use separate status colours (green / amber / red).

## Repository layout

| Path | Contents |
|---|---|
| `index.html` | Built app (generated by `npm run build`, not committed) |
| `src/` | `body.html`, `style.css`, `model.js` (simulation), `app/NN-*.js` (UI and charts, concatenated in order) |
| `data/snapshot.json` | Current market figures shown in the header cards and used as defaults |
| `data/metro_*.json` | Per-metro price, rent, tax, insurance and home-price index, with source URLs |
| `data/counties.json` | County median home value, contract and gross rent, and real-estate tax (Census ACS 5-year), written by `scripts/fetch_counties.py` |
| `data/county_fmr.json` | HUD Fair Market Rents by county and bedrooms, written by `scripts/fetch_fmr.py` |
| `data/zip/` | ZIP-code values, rents, taxes, HUD Small Area FMRs and county, one file per first two digits, written by `scripts/fetch_zips.py` |
| `data/county_hpi/` | FHFA annual county price indexes, one file per state, written by `scripts/fetch_county_hpi.py` |
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
| `npm run test:layout` | Chart layout: labels overlapping or clipped at four widths (needs the built page on :8765) |
| `npm run test:trace` | The trace panel stays true to the model (needs the built page on :8765; see below) |
| `npm run check` | Build, test, and the browser tests with a stubbed chart library (works offline) |

`src/app/*.js` files are concatenated in name order into one script, so they share one scope: `npm run lint` fails if a top-level name is declared twice, if code looks up an element id that does not exist, or if a setting has no pop-up help.

## Updating figures

1. Edit the figures in `data/snapshot.json` (or a metro file), keeping each source URL in step with its value.
2. If you changed `data/monthly.json`, run `python3 prep_monthly.py`.
3. Run `npm run build` to check it locally.
4. Push. The Deploy site workflow builds the page and GitHub Pages serves it within a minute or two.

The GitHub Pages build loads Plotly (charts, the 1.4 MB cartesian build) and MathJax (formulas) from `vendor/` and precaches them for offline use; only Google Fonts comes from a CDN. MathJax loads the first time a tab with formulas opens, and the county list (`data/counties.json`) the first time someone picks a county; data files are fetched network-first so monthly refreshes show up. The artifact build loads both libraries from public CDNs. To upgrade a library, replace its file in `vendor/`, update the paths in `build.py` and `sw.js`, and bump `CACHE` in `sw.js`.

## Refreshing data

The **Refresh data** workflow runs every Friday and on demand (Actions tab → Refresh data → Run workflow). It downloads Treasury yields, CPI, Zillow's typical home value and rent (U.S. and metros), FHFA home-price indexes (including annual county indexes), HUD Fair Market Rents by county, BLS CPI, rent and insurance price indexes, Census ACS tables (including county figures) and Freddie Mac mortgage rates; merges them into `data/` with `scripts/apply_public.py`; rebuilds `index.html`; then `scripts/check_data.py` compares the new data with what is on main and stops the run on anything implausible (months lost, past values revised by more than a few percent, mortgage rates moving more than 1.5 points in a month or 2 points between refreshes, price indexes jumping more than 5% in a month, out-of-range tax rates, or a county file that is short or has many medians changing by more than half). If that and the tests pass and something changed, it commits the data files to main, and the Deploy site workflow rebuilds and publishes the page. Published forecasts, homeowner-tenure figures and tax law are updated by hand. The header cards and the 'data as of' date come from the newest automatic figures.

## Tests

`node tests/validate.js` replays the setup of a published 30-year study of actual buy-vs-rent outcomes (Beracha & Johnson 2012) through the model and fails if the share of holds where renting wins drifts more than 10 points from theirs; it runs in the Tests workflow and is summarized in the Method tab. `npm run typecheck` runs TypeScript over the plain JavaScript (`tsconfig.json`, `types/globals.d.ts`; nothing is compiled): it catches misspelled or undefined names, wrong calls and unused variables, and runs in the Tests workflow. To repeat a full audit-and-upgrade pass (formulas, text, UI/UX, code), Claude Code can use the `upgrade-app` skill in `.claude/skills/upgrade-app/` (process, chart screenshot sweep and montage scripts). `npm run check:all` (`scripts/check.sh`) builds and runs every check CI runs, the browser tests in parallel (about 2 minutes; `npm run check:fast` skips the browser tests, about 5 seconds). `npm test` runs `tests/lint.js` (static checks) and `tests/run.js`, with `tests/run_new.js`, which check the model math (mortgage amortization against the closed form, tax brackets, SALT cap, home-sale exclusion, PMI, refinancing, annual vs. monthly paths, directional sanity checks, each realism feature, underwater sales, tax-year indexing, and property checks over random inputs: results stay finite, monthly and annual paths agree, and higher home or stock growth never hurts the matching path). Run it after any change to `src/model.js`. `tests/smoke.js` opens every tab at phone width and fails on page errors, charts that don't draw, formulas that don't render, anything wider than the screen, or a chart readout that doesn't close on a second tap. `tests/ui.js` loads the page with a small county list swapped in and checks the headline wording, ties, break-even search, affordability colors, the undo bar, the county picker, Monte Carlo caching, chart descriptions, side-by-side places and state rules. `tests/a11y.js` runs axe-core (WCAG 2.1 AA) on every tab in light and dark mode and at phone width. `tests/layout.js` opens every chart at four widths (390 to 1280px) and three places and fails on labels that overlap or touch each other, sit on an arrow or are crossed by a line, or fall outside the chart (needs the page on :8765; `npm run test:layout`). `tests/test_scripts.py` feeds each data-script parser a small sample of the real file format. `node tests/validate.js` also refits the rent-from-price exponent on the stored county data. `python3 scripts/check_links.py` checks every link cited in the app's code and data files (the monthly State rules check workflow runs it; this container can't reach most sites, so run it on GitHub). All run on every push (Tests workflow, a few minutes).

### Adding a chart or a setting

The trace panel and `tests/trace.js` keep each chart's "How this was computed" tree in step with the model. The test
fails, naming what to add, when a new chart or setting is missing one of these:

- **A chart:** give every trace `meta:'<chart>:<series>'` and add a recipe to `TRACE_RECIPES` (`src/app/189d-recipes.js`)
  that returns the plotted value's node; marks that are not results (reference markers, bands, legend stubs) get
  `meta:'deco:…'`. The test samples points on every chart and compares the recipe's value with the plotted one.
- **A model quantity or formula change:** mirror it in the node for that quantity (`src/app/189c-trace.js`); each node's
  value comes from the run's ledger (`simulate(..., {trace:true})` → `o.tr`) and its formula must rebuild that value
  from its parts. The closure check runs over a list of settings that reaches every branch plus seeded random ones.
- **An equation:** add it to `EQ` (`src/app/189b-equations.js`) with its Method section, and the symbol each part plays in
  it to `EQP` (the panel shows it beside the part's row; parts with their own equation or a setting symbol in `SETSYM`
  get one automatically); write `<` as `\lt`.
- **A setting:** add where its default comes from to `ORIGIN` (`src/app/189-provenance.js`), and make sure it appears in
  the trace wherever the model reads it (the reads check wraps the settings and lists any it never sees).

## Data sources

- **Annual returns, 1928–2025:** Damodaran, NYU Stern. The national real-estate series is Shiller's reconstruction through 1986 and Case-Shiller 1987–1991 (as published by Damodaran); from 1992 it is FHFA's U.S. purchase-only index, rebuilt from `data/monthly.json` at each build, with its swings scaled to Case-Shiller's size by one stored ratio.
- **CPI and rent CPI:** BLS (public domain).
- **Mortgage rates:** Freddie Mac PMMS (used with attribution).
- **Treasury rates:** Federal Reserve H.15 (public domain).
- **County rents:** HUD Fair Market Rents (public), the 40th-percentile rent with utilities paid by recent movers, by bedrooms; converted to rent without utilities with each county's Census ratio of contract to gross rent.
- **ZIP codes:** HUD Small Area Fair Market Rents (public), Census ACS 5-year by ZIP Code Tabulation Area and the Census 2020 ZCTA-to-county relationship file (public domain).
- **County price history:** FHFA annual all-transactions county indexes (public; developmental; cite Bogin, Doerner & Larson 2016, FHFA Working Paper 16-01), scaled by the metros' median volatility ratio.
- **Home-price indexes:** FHFA purchase-only indexes (public), downloaded from fhfa.gov by `scripts/fetch_fhfa.py` (run by hand via the *Fetch FHFA house price data* workflow). Case-Shiller data are not stored; one volatility ratio per location is.
- **S&P 500 monthly:** total returns only, computed from Robert Shiller's monthly data (index levels not stored).
- **Home values and rents:** Zillow Home Value Index and Zillow Observed Rent Index (Zillow research data, free for public use with attribution to Zillow), downloaded by `scripts/fetch_market.py`.
- **Treasury yields:** U.S. Treasury daily par yield curve (public domain).
- **Property tax:** Census ACS median real-estate taxes ÷ median home value (U.S., metro, county and ZIP).
- **Insurance:** median yearly insurance paid by owners of one-family homes, by state, from the Census ACS 1-year microdata (public domain), brought to today's prices with the BLS homeowners-insurance price index; downloaded by `scripts/fetch_insurance.py`.
- **Tax law:** IRS releases.
- **State rules** (`data/state_rules.json`): income tax brackets, assessment caps, homestead exemptions, state and county transfer taxes and county income taxes, compiled in October 2026 from state revenue departments and statutes (each entry links its source and marks figures that could not be confirmed); local taxes are not included. Update by hand when states change their laws; the *State rules check* workflow checks every cited link monthly and opens a review issue each January.
- **Forecasts and mobility:** Philadelphia Fed Survey of Professional Forecasters (10-year medians), Census CPS Table A-4 mover rates, BLS Consumer Expenditure Survey renters insurance, Census CBSA delineation file (counties in each metro); fetched weekly.
- **Credit score:** Fannie Mae Loan-Level Price Adjustment Matrix (purchase loans); PMI by score from the Urban Institute's Housing Finance at a Glance.
- **Flood insurance:** FEMA OpenFEMA NFIP Residential Penetration Rates and NFIP policies (public domain), fetched monthly by `scripts/fetch_flood.py`.
- **New-buyer property tax:** Census ACS 1-year microdata (tax ÷ value of owners who moved in within about four years vs all owners), in `scripts/fetch_insurance.py`.
- **PMI:** Freddie Mac's typical range ($30–70 a month per $100k) for the default, scaled by Fannie Mae's required mortgage-insurance coverage by down payment.

Full links are inside the app.

Market figures are a snapshot as of the date shown in the header. This tool is for exploring trade-offs, not financial or tax advice.
