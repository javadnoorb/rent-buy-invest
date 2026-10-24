/* ===================== Pop-up help ===================== */
/* Each entry: [title, body]. Bodies are short, plain-language explanations of what the item is and how it moves the result. */
const HELP={
 // ---------- settings ----------
 P:['Home price','What you would pay for the home. A higher price raises the mortgage, property tax, insurance and upkeep, and the down payment the renter invests instead.'],
 dp:['Down payment','Share of the price you pay in cash. More down means a smaller loan and less interest, but more money tied up in the house instead of invested. Under 20% adds mortgage insurance (PMI), or FHA premiums for FHA loans.'],
 rate:['30-year mortgage rate','Annual interest rate on a 30-year fixed loan. Defaults to this week\'s Freddie Mac national average; your quote may differ by credit score, points and lender.'],
 rate15:['15-year mortgage rate','Used only when the loan term is 15 years. 15-year loans have lower rates but much higher monthly payments.'],
 term:['Loan term','How many years the mortgage lasts. Shorter terms build equity faster and cost less interest, but raise the monthly payment.'],
 loanType:['Loan type','Conventional fixed: one rate for the whole loan, PMI if under 20% down. FHA fixed: government-insured, as little as 3.5% down, with an upfront and an annual insurance premium. ARM: a lower starting rate that resets every 6 months after 5 or 7 years.'],
 armRate:['ARM starting rate','The rate during the fixed period of an adjustable-rate mortgage. Defaults to today\'s fixed rate minus the current gap between ARM and fixed rates in the MBA weekly survey.'],
 armYears:['ARM fixed period','How long the starting rate lasts before resets begin: 5 or 7 years. After that the rate moves every 6 months with the index, within caps.'],
 armMargin:['ARM margin','Fixed amount added to the index (SOFR) at each reset. Your new rate = index + margin, limited by the caps. Typical margins are 2–3 points.'],
 pts:['Discount points','Upfront fees that buy a lower rate. One point costs 1% of the loan. Worth it only if you keep the loan long enough for the lower payments to repay the fee.'],
 ptsCut:['Rate cut per point','How much one point lowers your rate. It varies by lender and day; about 0.25 percentage point of rate per point paid is a common rough figure. Ask lenders for their pricing.'],
 close:['Buyer closing costs','Lender fees, title, appraisal, escrow and similar costs paid when you buy, as a share of the price. Transfer taxes paid by the buyer are added separately.'],
 pmiAppr:['Remove PMI with an appraisal','Lenders drop PMI early if a new appraisal shows the loan at or below 75% of the home\'s current value after 2 years, or 80% after 5 years. Helps most when prices rise. You pay for the appraisal (a few hundred dollars, not modeled).'],
 extraPay:['Extra each month','Money added to the buyer\'s monthly budget on top of the regular costs. To keep the comparison fair, the renter invests the same amount. Set where it goes below.'],
 extraMode:['Put the extra toward','Mortgage principal pays the loan off sooner and saves interest at your loan rate, risk-free. Buyer\'s portfolio invests it instead, which usually earns more but is taxed and can fall. The summary shows how much the choice is worth.'],
 pmi:['PMI','Private mortgage insurance, charged on conventional loans with under 20% down until the balance falls to 78% of the original price. It protects the lender, not you. Enter the yearly rate for 3–5% down; with a larger down payment the app scales it down (see the next setting). Actual quotes depend heavily on your credit score.'],
 fico:['Credit score','Lenders charge more for lower scores. Fannie Mae publishes these charges as upfront fees by credit score and down payment (loan-level price adjustments); the app turns the difference from the borrower behind the survey rate (20% down, good to excellent credit) into a rate change using your points-to-rate setting, and scales PMI by the premiums the Urban Institute reports by score. First-time buyers earning up to the area median income (120% in high-cost areas) are exempt from these fees. FHA loans do not use them.'],
 pmiScale:['Lower PMI with more down','Lenders require less mortgage insurance coverage when you put more down, so the premium is lower. The app scales your PMI rate by Fannie Mae\'s required coverage. Real premiums fall somewhat faster, so this errs on the high side. Choose No to use the same rate at every down payment.'],
 refiOn:['Refinancing','If on, the buyer refinances whenever market rates fall far enough below the loan rate, paying refinance costs. Lower future rates then help the buyer.'],
 rateLR:['Expected market rate later','Where you expect 30-year mortgage rates to settle. The projection moves rates from today toward this level; the simulations pull rates toward it at the historical pace.'],
 glide:['Years to reach that rate','How many years the projection takes to move from today\'s rate to your expected later rate.'],
 refiTh:['Refinance trigger','How far market rates must fall below your loan rate before refinancing. A common rule of thumb is 0.75 to 1.5 points.'],
 refiCost:['Refinance cost','Closing costs of a refinance as a share of the remaining balance, paid in cash.'],
 ptax:['Property tax','Yearly property tax as a share of the home\'s value. Location presets use the area\'s effective rate from the Census survey (median tax ÷ median value), raised to what recent buyers in the state pay (Census microdata: where assessments are capped, new owners pay more than long-time owners); your town may differ a lot.'],
 hsEx:['Homestead exemption','Many states take a fixed amount off the taxed value of an owner\'s primary residence (for example Florida about $50,000, Texas $140,000 for school taxes, California $7,000). Picking a location fills in the state\'s statewide exemption, as an equivalent amount off the full tax rate where it covers only some levies, and shows the property tax rate before it, so the typical home there still pays the Census rate while cheaper homes pay a lower share and pricier ones a higher share. Renters do not get it. Local exemptions and those for seniors, veterans or low incomes are not included; the exemption stays fixed in dollars.'],
 hsCredit:['Homestead credit','A few states give owners a fixed credit off the property tax bill instead (Arkansas $600, North Dakota up to $1,600, Mississippi up to $300, Wisconsin\'s lottery credit about $200).'],
 ptaxCap:['Assessment growth cap','Some states limit how fast the taxed value of a home can rise each year (California 2%, Florida 3%, Texas 10% for homesteads). Then your tax grows more slowly than the home\'s value. The cap resets when the home is sold, so it starts from your price. Picking a location sets its state\'s statewide cap; local limits are not included. 0 = no cap.'],
 ptaxCapCPI:['Cap also limited to inflation','In some states the taxed value rises by the lower of the cap or inflation (California, Florida, Michigan), or by inflation only (Georgia\'s homestead exemption; set the cap to 0).'],
 ins:['Home insurance','Yearly homeowners insurance premium. Location presets use state averages; coastal and wildfire areas can cost much more.'],
 maint:['Maintenance','Average yearly upkeep and repairs as a share of home value. The simulations make repairs lumpy (some years much more, some less).'],
 hoa:['HOA dues','Monthly homeowners-association or condo fees, growing with inflation.'],
 sell:['Selling costs','Agent commissions and other seller fees when you sell, as a share of the price. Seller-paid transfer taxes are added separately.'],
 ttAuto:['Transfer and recording taxes','Taxes charged when a home changes hands or a mortgage is recorded. "From location" fills them in from the state, county and city rules for the chosen metro, at your price and loan size.'],
 ttBuy:['Buyer transfer taxes','Transfer, mansion and mortgage-recording taxes paid by the buyer, as a share of the price. Added to closing costs.'],
 ttSell:['Seller transfer taxes','Transfer taxes paid by the seller, as a share of the sale price. Added to selling costs.'],
 insG:['Insurance growth above inflation','How much faster than inflation insurance premiums rise each year. The default is the 1998–2025 gap between the BLS homeowners-insurance price index and CPI.'],
 utilDiff:['Extra utilities','How much more you would pay for utilities as an owner: bigger homes cost more to heat and cool, and owners often pay water, sewer and trash that rent includes.'],
 floodIns:['Flood / earthquake insurance','Homeowners policies exclude floods and earthquakes. Picking a location fills in the average yearly flood-insurance cost across all homes there, from FEMA data: the share of homes with an NFIP policy times the typical policy cost. Lenders require flood insurance only in the high-risk zone (the hint shows that share); if the home you are looking at is in one, enter its actual quote, which can be several times the average. Earthquake insurance is not included.'],
 moveIn:['Move-in costs','One-time costs of buying beyond closing: furniture for a bigger home, immediate repairs, and so on. The renter invests this money instead.'],
 impShare:['Improvements share','Part of upkeep that counts as capital improvements (a new roof, a kitchen). It is added to the home\'s tax basis and lowers capital-gains tax when you sell.'],
 stMode:['State income tax','"From the location\'s state" estimates your state income tax from the 2026 brackets of the state you picked: your income minus the state\'s standard deduction, taxed at its rates. It also sets the state rate on investment income and whether the state lets you deduct mortgage interest and property tax. With a county or ZIP picked, a county-wide local income tax is added where one applies (New York City, Maryland and Indiana counties); city-only taxes (Ohio cities, Philadelphia), personal exemptions and credits are left out, so check it against last year\'s return. The state saving from owning counts only the interest and property tax above the state\'s standard deduction. Choose manual to enter your own figures.'],
 rins:['Renter\'s insurance','Yearly renter\'s insurance premium. The default is what renters spend on average (BLS Consumer Expenditure Survey), which counts renters without a policy, so a quote for your own policy is likely higher. A small cost, but it counts against renting.'],
 rMove:['Renter moves per year','Share of renters who move each year. Each move costs money and resets rent to the market level.'],
 rMoveCost:['Cost per move','Movers, application fees, deposits lost to timing and overlapping rent each time a renter moves.'],
 broker:['Broker fee','Some cities (e.g. New York, Boston) charge tenants about one month of rent per move. 0 elsewhere.'],
 beds:['Bedrooms','Sets the comparable rent. The rent for this bedroom count = Zillow\'s typical rent for the area × the Census ratio of rents for this size to all rentals. Compare like with like: the rent of a home similar to the one you would buy.'],
 rentMode:['Rent','Estimate from home price uses your location\'s typical rent for the bedrooms chosen, scaled to your price: rent rises about 0.65% for each 1% of home value (Census county data), so a home twice the typical price rents for about 1.57 times the typical rent. Typing a rent switches to your own figure; a real comparable rental is always better than the estimate.'],
 rent0:['Comparable rent','Monthly rent for a home similar to the one you would buy. This is the single most important input; a real listing is best.'],
 renewGap:['Lease renewals vs. market','How much slower your rent rises when you renew than market rents. 0 means your rent tracks the market. Lately renewals have risen faster than new leases.'],
 gh:['Home appreciation','Average yearly rise in the home\'s value. Long-run U.S. average is about 4% a year, roughly inflation plus 1 point. One of the two biggest drivers of the result.'],
 gr:['Rent growth','Average yearly rise in market rents. Higher rent growth helps buying, because the owner\'s payment is mostly fixed.'],
 inf:['Inflation','Yearly CPI inflation. Used for today\'s-dollar results and to grow costs like insurance, HOA and utilities.'],
 rs:['Stock return','Average yearly total return of the S&P 500 (the 500 largest U.S. companies), dividends included, as in a low-cost index fund. The other big driver: higher returns help renting and investing.'],
 rb:['Bond return','Average yearly return on bonds in the portfolio.'],
 rc:['Cash / T-bill return','Yearly return on Treasury bills. Used for the T-bills path, the cash part of the portfolio, and as the ARM index.'],
 ws:['Stocks share','Share of the investment portfolio in an S&P 500 index fund (stocks). The rest goes to bonds and T-bills.'],
 wb:['Bonds share','Share of the portfolio in bonds; whatever is not in stocks or bonds sits in T-bills.'],
 acct:['Account type','Taxable: dividends and interest are taxed every year and gains when sold. Tax-sheltered: no tax, like a Roth IRA (contribution limits not modeled).'],
 dy:['Dividend yield','Part of the stock return paid as dividends, which are taxed each year in a taxable account.'],
 fee:['Fund fees','Yearly expense ratio of the funds you invest in. Broad index funds charge under 0.1%.'],
 lev:['Portfolio leverage','1 = no borrowing. Above 1 borrows to invest, to compare the renter at a similar risk to a buyer, whose home is bought mostly with a loan.'],
 spread:['Borrowing spread','Interest above the T-bill rate paid on money borrowed to invest (only matters with leverage above 1).'],
 incGrowth:['Income growth','How fast your household income grows each year. It moves your tax bracket and the affordability ratio over time.'],
 income:['Household income','Gross yearly income before tax. Sets the federal tax bracket, the limit on deducting state and local taxes, the 3.8% investment tax, and the affordability check.'],
 debt:['Other debt payments','Monthly car, student-loan and card payments. Used for the total debt-to-income ratio lenders check.'],
 taxOn:['Model taxes','Turn off to compare before taxes. On is more realistic.'],
 filing:['Filing status','Single or married filing jointly. Changes the standard deduction, brackets, the home-sale exclusion ($250k / $500k) and tax thresholds.'],
 muMode:['Marginal rate','Automatic picks your federal bracket from income and 2026 tax brackets (indexed by your inflation setting in later years). Choose manual to enter it yourself.'],
 mu:['Marginal federal rate','Tax rate on your last dollar of income. Sets the value of mortgage-interest and property-tax deductions and the tax on interest income.'],
 stTax:['State & local income tax','Yearly state and local income tax. It counts toward the $40,400 cap on deducting state and local taxes, together with property tax.'],
 oth:['Other itemized deductions','Charitable gifts and other deductions. They help decide whether itemizing beats the standard deduction.'],
 stRate:['State tax on investments','Your state\'s tax rate on dividends, interest and capital gains (e.g. 5% in Massachusetts, 0 in Texas or Florida).'],
 stDed:['State deduction for homeowners','Some states let you deduct mortgage interest and property tax on the state return too.'],
 ltcgMode:['Capital-gains rate','Automatic picks 0%, 15% or 20% from your taxable income using 2026 thresholds (single: 0% up to $49,450, 20% above $545,500; joint: $98,900 and $613,700). A large gain in one year can push part of it into a higher tier; that is not modeled. Choose manual to enter a rate.'],
 ltcg:['Capital-gains rate','Federal rate on long-term gains and qualified dividends: 0%, 15% or 20% depending on income. The 3.8% investment tax is added automatically above $200k ($250k joint).'],
 hhRent:['House-hacking rent','Rent you collect from part of your home (a room, a basement or accessory unit). It lowers your housing cost; the net income is taxed. Choose a bigger home if you plan this.'],
 hhShare:['Share rented out','Part of the home used by the tenant. That share of interest, tax, insurance and upkeep becomes a rental expense instead of a personal deduction.'],
 hhVac:['House-hack vacancy','Share of the time the rented part sits empty.'],
 rentalOn:['Rental-property path','Adds a fourth household that rents its own home and puts the same starting cash into buying a rental property. Compares being a landlord with buying your own home or investing in a portfolio.'],
 dpR:['Rental down payment','Down payment on the rental property. Lenders require at least 15% (1 unit) or 25% (2–4 units) for investment properties.'],
 ratePrem:['Investment-property rate premium','Extra interest lenders charge on loans for rentals, typically 0.5–1 point above owner-occupied rates.'],
 vacR:['Rental vacancy','Share of the year the rental sits empty. The U.S. rental vacancy rate is about 7%.'],
 mgmt:['Management fee','Share of collected rent paid to a property manager. Set 0 if you manage it yourself (and value your time accordingly).'],
 landShare:['Land share','Part of the rental\'s price that is land. Land cannot be depreciated for tax, so a higher land share means less tax deduction.'],
 investShare:['Share actually invested','The model assumes the household paying less each month invests the difference. If you would spend some of it, lower this. This usually helps buying, because a mortgage forces saving.'],
 moveMode:['Planned move','If you already know you will move: sell at the chosen year and either buy again (paying closing costs again, at that year\'s rates) or rent from then on.'],
 moveYear:['Move year','The year of the planned move. It must come before the horizon to have an effect.'],
 volAdj:['Scale price swings','FHFA\'s home-price indexes leave out jumbo loans and swing less than Case-Shiller\'s. On keeps FHFA\'s timing and long-run growth but scales the ups and downs to Case-Shiller\'s size.'],
 heloc:['Home-equity line','A credit line secured by the home, up to this share of its value minus the mortgage (lenders typically allow 80–85%). It is counted as reserve cash in the liquidity checks but never drawn. Banks can freeze or cut lines when prices fall, as many did in 2008.'],
 basis:['Today\'s vs. nominal dollars','Nominal dollars are the amounts you would actually see in the future. Today\'s dollars divide each future amount by the inflation expected up to that year (your inflation setting), so $100k in year 10 means what $100k buys now. The switch rescales every future amount: the headline, the Projection, Sensitivity, Monte Carlo, Locations and Scenarios charts, the yearly table and its CSV. It never changes which side wins, only the size of the gap. Amounts paid today (price, rent, cash needed, the Optimizer and affordability figures) are the same either way, and the Backtest and Data tabs always use today\'s dollars, adjusted with the inflation that actually happened.'],
 hz:['Chance of moving','Yearly chance you have to sell earlier than planned. Census surveys find about 4% of people in owned homes move each year, a typical stay of about 17 years; owners under 45 move more than twice as often.'],
 stressMult:['Moves likelier in bad years','How much more likely an early move is when home prices or stocks just fell (job loss and price drops tend to come together). Used in the simulations only.'],
 forcedDisc:['Forced-sale discount','How much below market value you would sell if forced to sell in a downturn. Research finds about 3–7% for sales after a bankruptcy or death, 27% for foreclosures.'],
 idio:['Own-home price risk','A single house\'s price varies around its area\'s index (location, condition, timing). This sets how much, as a standard deviation. Used in the simulations.'],
 idioMode:['Own-home risk model','One-time at sale: a single random shock when you sell (recent research). Compounds yearly: random each year, so it grows with time (older estimates, more risk).'],
 gamma:['Risk aversion','How much you dislike uncertainty, for the certainty-equivalent row in the risk table. 0 = you care only about the average; 2–5 is typical; higher weights bad outcomes more.'],
 // ---------- top card ----------
 metro:['Location','Fills in local home price, rent, property tax, insurance and transfer taxes, and uses local home-price and rent history in the backtest and simulations. Your own numbers are better when you have them.'],
 N:['Horizon','How many years until you would sell and compare. Buying has large upfront and exit costs, so it usually needs several years to win.'],
 verdict:['What "comes out ahead" means','Each path\'s net worth if you sold everything at the horizon: home sold (after commission, transfer taxes, mortgage payoff and tax) plus investments cashed out after tax. Both households spend the same each month; whoever pays less invests the difference.'],
 conf:['How sure is the answer?','Share of simulated futures (600 for the quick estimate, or the number set on the Monte Carlo tab; built from real historical years) in which buying ends ahead at your horizon. Very likely: 80%+ one way. Close call: 45–55%.'],
 paths:['The three paths','Buy: buy the home and invest any month owning is cheaper than renting. Rent + invest: rent and invest the down payment and any monthly savings in the portfolio. Rent + T-bills: same, but keep the money in Treasury bills (low risk). With the rental-property setting on, a fourth: Rent + rental property.'],
 st_pull:['Buying pulls ahead','First year from which buying stays ahead of renting and investing through your horizon, at your growth assumptions. With a longer horizon renting can move back ahead later (the Sensitivity tab\'s break-even chart runs 30 years).'],
 st_own1:['Owning, month 1','First month\'s cost of owning: mortgage payment, property tax, insurance, maintenance, HOA, mortgage insurance and extra utilities, before tax savings.'],
 st_cash:['Cash to buy','Money needed at purchase: down payment, closing costs, buyer transfer taxes, points and move-in costs. The renter invests the same amount.'],
 st_hti:['Housing / income','Month-1 owning cost as a share of gross monthly income, and with other debts added. Guidelines: up to 28% for housing and 36% in total (green); conventional loans often allow total debt up to 45–50% with strong credit, and this app uses 43% as a conservative lender limit (amber up to it, red above).'],
 st_beRent:['Break-even rent','The monthly rent at which buying and renting and investing would tie at your horizon. If comparable rent is above this, buying wins.'],
 st_beG:['Break-even home growth','The yearly home appreciation at which the two paths tie at your horizon.'],
 st_early:['Chance you sell early','The chance you have to sell before your horizon, from your yearly chance of moving (Life & risk preferences). Selling early means paying buying and selling costs over fewer years.'],
 st_exp:['Expected gap with move risk','The buy-minus-rent gap averaged over when you might have to sell early, given your chance of moving each year.'],
 st_cashpath:['Rent + T-bills','Net worth if you rent and keep all savings in Treasury bills: a low-risk benchmark.'],
 why:['Biggest drivers','The inputs that change the answer most (from the Sensitivity tab), and how far rent or home growth would have to move to flip the result.'],
 // ---------- presets & controls ----------
 presets:['Presets','Each preset fills the growth-rate settings (home prices, rents, stocks, bonds, cash, inflation) at once. <b>1928–2025 avg</b>: long-run U.S. averages, stocks about 10%, homes about 4%, inflation about 3% a year. <b>1972–2025 avg</b>: the era of modern mortgage data and higher inflation. <b>Forecasts</b>: the Philadelphia Fed survey of professional forecasters\' 10-year forecasts for stocks, bonds, cash and inflation; homes and rent grow at forecast inflation plus their own 1972–2025 growth above inflation. <b>Current YoY</b>: the latest one-year changes, noisy, better as a stress test. <b>Metro history</b>: the chosen location\'s own price history.'],
 pre_long:['1928–2025 averages','Fills growth rates with long-run U.S. averages: stocks about 10%, homes about 4%, inflation about 3% a year.'],
 pre_modern:['1972–2025 averages','Averages since 1972, the era of modern mortgage data and higher inflation.'],
 pre_fcst:['Forecasts','Median 10-year forecasts from the Federal Reserve Bank of Philadelphia\'s Survey of Professional Forecasters for stocks, bonds (the 10-year Treasury rate), cash and inflation. Homes and rent grow at the forecast inflation plus their own growth above inflation in 1972–2025, since nobody publishes a 10-year forecast for them. Lower stock returns than history.'],
 pre_now:['Current year-over-year','Uses the latest one-year changes in home prices, rents and inflation. Short-term figures are noisy; better as a stress test than a forecast.'],
 pre_metro:['Location history','Uses the chosen location\'s own historical home-price growth, and its rent growth where BLS publishes a rent index (the larger metros, and counties inside them).'],
 aq:['Find a setting','Type part of a setting\'s name or description to show only matching settings.'],
 nwBand:['Range from simulated futures','Shades where the middle half of simulated futures end up, to show uncertainty around the single projected line.'],
 shareBtn:['Share','Shares a short summary of the inputs and results with a link that opens the app with your exact inputs (your device\'s share sheet, or copied to paste anywhere). Anyone with the link sees them.'],
 printReport:['Save as PDF','Prints the answer, your inputs and the charts on the open tab. Choose "Save as PDF" in the print dialog for a file.'],
 openWizard:['Quick setup','Three questions (location, the home and your income, how long you\'d stay) that set up a realistic starting point.'],
 'mc-n':['Paths','Number of simulated futures. More is smoother but slower; 1,500 is plenty for percentages.'],
 'mc-b':['Block length','The simulation strings together runs of this many consecutive historical years, so booms and busts keep their real length.'],
 'mc-w':['Sample','Which history to draw years from: all years since 1928, or since 1972.'],
 'mc-rc':['Re-center','Shifts each historical series so its average matches your growth assumptions, while keeping its real volatility and how series moved together.'],
 'h-mode':['Annual or monthly data','Annual: 1972–2025 with local home and rent history. Monthly: 1991–2026 national data, month by month.'],
 'h-rate':['Mortgage rate in the backtest','Actual rate then: each start year uses that year\'s average mortgage rate. My rate: every start year uses today\'s rate.'],
 'h-rp':['Starting rent in the backtest','Mine: every purchase year starts with your rent, so at today\'s rent-to-price ratio. Historical: your ratio scaled by the national rent-to-price ratio of owner-occupied homes in that year compared with today (BEA and Federal Reserve data), so purchases at the 2006 peak start with relatively low rent and those in 2012 with high rent.'],
 'h-home':['Home prices in the backtest','Selected location: the metro\'s own price history where available. National: U.S. average.'],
 'h-year':['Bought in','Year of purchase for the detail chart, followed to the latest data. Its curve and heat-map column are highlighted in the charts above.'],
 optTerm:['Loan term','Switches the optimizer between 30- and 15-year loans.'],
 locMode:['Growth by location','Same: your growth rates in every location. Yours + local: your rates plus each location\'s historical gap to the U.S. average. Local history: each location\'s own past averages.'],
 scName:['Scenario name','Name the current inputs to save them on this device and compare later.'],
 cmp:['Pick two scenarios','Choose any two saved scenarios (or the current inputs) to compare side by side.'],
 // ---------- risk table ----------
 r_mean:['Mean','Average net worth across simulated futures.'],
 r_med:['Median','The middle outcome: half of futures end higher, half lower.'],
 r_p5:['5th percentile','A bad case: only 1 in 20 futures ends lower.'],
 r_p95:['95th percentile','A good case: only 1 in 20 futures ends higher.'],
 r_es:['Expected shortfall','Average of the worst 5% of futures: how bad the bad cases are, not just where they start.'],
 r_sd:['Standard deviation','Typical spread of outcomes around the average.'],
 r_ce:['Certainty equivalent','The sure amount you would value as much as the uncertain outcome, given your risk aversion. Compares paths after accounting for risk.'],
 r_lq:['Liquidity squeeze','Share of futures where liquid savings fell below 3 months of housing costs in the first 5 years: the risk of being cash-poor.'],
};
/* Chart purpose, keyed by plot id (the "How to read this" note under each chart has the details). */
const CHART_HELP={
 nw:'How much each household would have each year if it sold everything. The main answer over time.',
 gap:'What makes up the difference between buying and renting at your horizon: each part of owning and renting, adding up exactly to the answer.',
 flow:'Where the owner\'s monthly money goes, compared with rent.',
 unrec:'Money that builds no wealth each year, for owner and renter: the fairest yearly cost comparison.',
 comp:'How much of the buyer\'s wealth is in the house vs. invested.',
 liq:'How many months of costs each household could cover from savings without selling the house.',
 tor:'Which assumptions change the answer most.',
 heat:'The result for every combination of home appreciation and portfolio return.',
 ptr:'How the break-even year depends on rent.',
 opt:'The best down payment for each length of stay.',
 spag:'What would have happened if you had made this decision in each past year.',
 hheat:'Past outcomes for every start year and holding period at once.',
 hdet:'One historical start year in detail.',
 fan:'The range of outcomes across simulated futures.',
 prob:'The chance buying wins, by how long you stay.',
 mchist:'How the simulated outcomes are spread.',
 mcsc:'Which combinations of home and stock growth make buying win.',
 mcrate:'Simulated mortgage-rate paths and how often they trigger a refinance.',
 scen:'Saved scenarios side by side over time.',
 loc:'The buy-vs-rent gap over time in each ticked location.',
 locsc:'Whether expensive-relative-to-rent places favor renting.',
 cmp:'Two scenarios compared.',
 cum:'Long-run growth of stocks, bonds, bills, home prices and rent since 1927.',
 metro:'The location\'s home prices against the national index.',
 roll:'10-year returns over history, showing how much timing matters.',
 corr:'How the series moved together historically.',
 mort:'Mortgage rates and inflation over time.',
 zori:'Rents on new leases vs. all leases.',
};
const CARD_HELP={'30-yr mortgage':'Freddie Mac weekly national average for a 30-year fixed loan.','15-yr mortgage':'Freddie Mac weekly national average for a 15-year fixed loan.',
 '10-yr Treasury':'Yield on 10-year U.S. government bonds; 30-year mortgage rates have averaged about 1.7 points above it since 1972, lately 2–2.5 points.','Home prices (FHFA)':'Change in U.S. home prices over the past 12 months, from the Federal Housing Finance Agency\'s purchase-only index (homes bought with conforming mortgages, not seasonally adjusted).',
 'Typical home value':'Zillow\'s typical U.S. home value (middle of the market).',
 'Typical rent':'Zillow\'s typical U.S. asking rent across all rental sizes.','CPI inflation':'Change in consumer prices over the past year (BLS).','Property tax':'U.S. median real-estate taxes paid divided by the median home value (Census American Community Survey).','Data as of':'When the market figures above were last updated.'};

function helpBtn(key,title){return `<button type="button" class="hlp" data-h="${key}" aria-label="Help: ${(title||'').replace(/"/g,'')}">?</button>`}
function addHelp(el,key,title,where){if(!el||el.querySelector(':scope > .hlp'))return;el.insertAdjacentHTML(where||'beforeend',helpBtn(key,title))}
let POP=null,POP_FOR=null;
function closeHelp(){if(POP){POP.hidden=true;POP_FOR=null}}
function openHelp(btn){const k=btn.dataset.h;let t,b;
  if(k.startsWith('chart:')){const id=k.slice(6);t=btn.closest('.card').querySelector('h2').textContent.trim();b=CHART_HELP[id]+' <em>See "How to read this" below the chart for details.</em>'}
  else if(k.startsWith('card:')){t=k.slice(5);b=CARD_HELP[t]||''}
  else{const h=HELP[k];if(!h)return;[t,b]=h}
  if(!POP){POP=document.createElement('div');POP.className='hpop';POP.setAttribute('role','dialog');POP.setAttribute('aria-live','polite');document.body.appendChild(POP)}
  if(POP_FOR===btn&&!POP.hidden){closeHelp();return}
  POP.innerHTML=`<div class="hpop-t">${t}</div><div class="hpop-b">${b}</div>`;POP.hidden=false;POP_FOR=btn;
  const r=btn.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,w=Math.min(320,vw-24);
  POP.style.width=w+'px';const left=Math.max(12,Math.min(vw-w-12,r.left+r.width/2-w/2));POP.style.left=left+'px';
  const ph=POP.offsetHeight;let top=r.bottom+8;if(top+ph>vh-12&&r.top-ph-8>12)top=r.top-ph-8;POP.style.top=Math.max(12,top)+'px'}
function wireHelp(){
  // settings
  F.forEach(f=>{const id=f[1];if(!HELP[id])return;const el=document.getElementById(id);const lab=el&&el.closest('.f')?.querySelector('label');if(!lab)return;const rst=lab.querySelector('.rst');
    if(rst)rst.insertAdjacentHTML('beforebegin',helpBtn(id,HELP[id][0])+' ');else addHelp(lab,id,HELP[id][0])});
  // top card
  [['metro','metro'],['q-P','P'],['q-rent0','rent0'],['q-dp','dp'],['q-rate','rate']].forEach(([el,k])=>{const lab=document.querySelector(`label[for="${el}"]`);addHelp(lab,k,HELP[k][0])});
  addHelp(document.querySelector('label[for="N"]'),'N',HELP.N[0]);
  document.querySelector('#realBtn').closest('.seg').insertAdjacentHTML('afterend',helpBtn('basis',HELP.basis[0]));
  document.querySelector('.vtop').insertAdjacentHTML('beforeend',`<div class="vhelp">${helpBtn('verdict','What comes out ahead means')}<span class="sub vlab">what this means</span> ${helpBtn('conf','How sure')}<span class="sub vlab">how sure</span> ${helpBtn('paths','The paths')}<span class="sub vlab">the paths</span></div>`);
  // presets and controls
  const pr=document.querySelector('.presets');if(pr)pr.insertAdjacentHTML('beforeend',helpBtn('presets','About presets'));
  [['scName','afterend'],['locMode','afterend']].forEach(([id,w])=>{const el=document.getElementById(id);if(el)el.insertAdjacentHTML(w,helpBtn(id,HELP[id][0]))});
  {const g=document.getElementById('h-rp');if(g)g.insertAdjacentHTML('afterend',' '+helpBtn('h-rp',HELP['h-rp'][0]))}
  ['nwBand','mc-n','mc-b','mc-w','mc-rc','h-mode','h-rate','h-home'].forEach(id=>{const el=document.getElementById(id);const lab=el&&el.closest('label');if(lab)lab.insertAdjacentHTML('afterend',helpBtn(id,HELP[id][0]))});
  // the Backtest slider: the "?" goes in the label line, so it doesn't take a cell of their grid
  ['h-year'].forEach(id=>{const sp=document.getElementById(id).closest('label').querySelector('span');if(sp)sp.insertAdjacentHTML('beforeend',' '+helpBtn(id,HELP[id][0]))});
  const ot=document.getElementById('opt30');if(ot)ot.parentElement.insertAdjacentHTML('afterend',helpBtn('optTerm',HELP.optTerm[0]));
  const ca=document.getElementById('cmpB');if(ca)ca.closest('label').insertAdjacentHTML('afterend',helpBtn('cmp',HELP.cmp[0]));
  // chart titles
  document.querySelectorAll('.card .plot').forEach(p=>{const id=p.id.replace(/^p-/,'');const h2=p.closest('.card').querySelector('h2');if(h2&&CHART_HELP[id])addHelp(h2,'chart:'+id,'About this chart')});
  // re-rendered content
  const mo=new MutationObserver(()=>decorateHelp());['vgrid','vgrid2','snap','riskT','why'].forEach(id=>{const el=document.getElementById(id);if(el)mo.observe(el,{childList:true})});decorateHelp();
  // clicks
  document.addEventListener('click',e=>{const lab=e.target.closest('.vlab'),b=e.target.closest('.hlp')||(lab&&lab.previousElementSibling&&lab.previousElementSibling.matches('.hlp')?lab.previousElementSibling:null);if(b){e.preventDefault();e.stopPropagation();openHelp(b);return}if(POP&&!POP.hidden&&!e.target.closest('.hpop'))closeHelp()},true);
  addEventListener('keydown',e=>{if(e.key==='Escape')closeHelp()});
  addEventListener('scroll',()=>closeHelp(),{passive:true});addEventListener('resize',()=>closeHelp());
  document.getElementById('aside').addEventListener('scroll',()=>closeHelp(),{passive:true});
}
/* help buttons inside content that is re-rendered (stats, market cards, risk table) */
const STAT_HELP={'Chance you sell early':'st_early','Buying pulls ahead':'st_pull','Owning, month 1':'st_own1','Cash to buy':'st_cash','Housing / income':'st_hti','Break-even rent':'st_beRent','Break-even home growth':'st_beG','Rent + T-bills':'st_cashpath'};
const RISK_HELP={'Mean':'r_mean','Median':'r_med','5th percentile':'r_p5','95th percentile':'r_p95','Expected shortfall (worst 5%)':'r_es','Standard deviation':'r_sd','Liquid < 3 months of costs (first 5 yrs)':'r_lq'};
function decorateHelp(){
  document.querySelectorAll('.stat .k').forEach(k=>{if(k.querySelector('.hlp'))return;const txt=k.textContent.trim();const key=STAT_HELP[txt]||(txt.startsWith('Expected gap')?'st_exp':null);if(key)k.insertAdjacentHTML('beforeend',' '+helpBtn(key,HELP[key][0]))});
  document.querySelectorAll('.chip .k').forEach(k=>{if(k.querySelector('.hlp'))return;const t=k.textContent.trim();if(CARD_HELP[t])k.insertAdjacentHTML('beforeend',' '+helpBtn('card:'+t,t))});
  const w=document.getElementById('why');if(w&&w.textContent.trim()&&!w.querySelector('.hlp'))w.insertAdjacentHTML('afterbegin',helpBtn('why',HELP.why[0])+' ');
  document.querySelectorAll('#riskT tbody tr td:first-child').forEach(td=>{if(td.querySelector('.hlp'))return;const t=td.textContent.trim();const key=RISK_HELP[t]||(t.startsWith('Certainty equivalent')?'r_ce':null);if(key)td.insertAdjacentHTML('beforeend',' '+helpBtn(key,HELP[key][0]))});
}
