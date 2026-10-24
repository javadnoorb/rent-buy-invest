/* ===================== Method ===================== */
function buildMethod(){
  document.getElementById('methodCard').innerHTML=`
  <h2>How the model works</h2>
  <p>The model runs month by month for each of the three households (and the optional fourth). Both main households spend the same amount each month: the larger of the owner's cost and the renter's cost. Whichever is cheaper that month invests the difference. Every symbol is defined under the equation where it first appears; the full list is in <a href="#notation" class="src">Notation</a> at the end.</p>

  <h3>Time and growth</h3>
  <p>Months are indexed by \\(t = 1, 2, \\dots\\) and years by \\(y = 0, 1, \\dots, N-1\\). Within year \\(y\\), a yearly growth rate \\(g_y\\) becomes a monthly factor \\((1+g_y)^{1/12}\\); with monthly historical data the actual monthly changes are used instead.</p>
  <dl class="sym"><dt>\\(N\\)</dt><dd>horizon in years (the slider)</dd><dt>\\(g_y\\)</dt><dd>growth rate of a series (home price, rent, stocks, inflation…) in year \\(y\\), as a decimal</dd></dl>

  <h3>Mortgage</h3>
  ${eqLines(['loan','monthlyRate','payment','interest','principal','balanceMonth'])}
  <dl class="sym"><dt>\\(P\\)</dt><dd>purchase price</dd><dt>\\(d\\)</dt><dd>down payment as a share of the price</dd><dt>\\(L\\)</dt><dd>loan amount</dd><dt>\\(r\\)</dt><dd>annual note rate (after any points)</dd><dt>\\(i\\)</dt><dd>monthly rate</dd><dt>\\(n\\)</dt><dd>number of monthly payments (12 × loan term in years)</dd><dt>\\(M\\)</dt><dd>monthly principal-and-interest payment</dd><dt>\\(I_t\\)</dt><dd>interest paid in month \\(t\\)</dd><dt>\\(\\text{Prin}_t\\)</dt><dd>principal repaid in month \\(t\\) from the payment</dd><dt>\\(X_t\\)</dt><dd>extra principal paid in month \\(t\\) (see Extra payments)</dd><dt>\\(B_t\\)</dt><dd>loan balance at the start of month \\(t\\), before that month's payment</dd></dl>

  <h3>Refinancing</h3>
  <p>If the market rate falls far enough below the loan rate, and at least 12 months have passed since the purchase or the last refinance, the loan is refinanced over its remaining months:</p>
  \\[ \\begin{aligned} &\\text{if } r - m_t \\ge \\Delta_R: \\\\ &\\quad r \\leftarrow m_t, \\quad \\text{cost} = c_R\\,B_t \\\\ &\\quad M \\leftarrow \\frac{B_t\\,m_t/12}{1-(1+m_t/12)^{-(n-t)}} \\end{aligned} \\]
  <dl class="sym"><dt>\\(m_t\\)</dt><dd>market 30-year fixed rate in month \\(t\\): moves linearly from today's rate to your expected later rate \\(\\bar m\\) in the projection (for a 15-year loan, to \\(\\bar m\\) less today's gap between the 30- and 15-year rates, \\(\\delta_{15}\\)), is the actual Freddie Mac rate in the backtest, and is simulated in the Monte Carlo (below)</dd><dt>\\(\\Delta_R\\)</dt><dd>rate drop that triggers a refinance</dd><dt>\\(c_R\\)</dt><dd>refinance cost as a share of the balance, paid in cash</dd></dl>

  <h3>Loan types and points</h3>
  <p>FHA loans:</p>\\[ \\begin{aligned} L &= P(1-d)(1+u_F) \\\\ \\text{MI}_t &= \\pi_F\\,B_{t-1}/12, \\quad t \\le n_F \\end{aligned} \\]
  <p>ARM resets: the target rate, then the per-reset cap, then the floor and lifetime cap:</p>\\[ \\begin{aligned} \\hat r_k &= \\lfloor x + \\chi \\rceil_{1/8} \\\\ \\bar r_k &= \\min\\big(r_{k-1} + c_k, \\\\ &\\qquad \\max(r_{k-1} - c_k,\\ \\hat r_k)\\big) \\\\ r_k &= \\min\\big(r_0 + c_L,\\ \\max(\\chi,\\ \\bar r_k)\\big) \\end{aligned} \\]
  <p>When a chart tests a different mortgage rate, an ARM keeps its spread to the 30-year rate:</p>${eqLines(['armQuote'])}
  <p>Points:</p>\\[ \\begin{aligned} r_0 &= r_{quote} - p_n\\,\\Delta_p \\\\ \\text{cash cost} &= \\tfrac{p_n}{100}\\,P(1-d) \\end{aligned} \\]
  <dl class="sym"><dt>\\(u_F\\)</dt><dd>FHA upfront premium, 1.75%, added to the loan</dd><dt>\\(\\pi_F\\)</dt><dd>FHA annual premium: 0.50–0.75% for terms over 15 years (by loan size and LTV), 0.15–0.65% for 15-year</dd><dt>\\(n_F\\)</dt><dd>months the premium is charged: 132 (11 years) with at least 10% down, otherwise the whole term</dd><dt>\\(r_0\\)</dt><dd>ARM starting rate, fixed for 5 or 7 years; resets then happen every 6 months</dd><dt>\\(x\\)</dt><dd>ARM index (30-day SOFR in practice; the model uses the T-bill rate in each scenario)</dd><dt>\\(\\chi\\)</dt><dd>ARM margin over the index (also the rate floor)</dd><dt>\\(c_k\\)</dt><dd>cap on the change at reset \\(k\\): 2 points at the first reset of a 5/6 ARM (5 points for 7/6), then 1 point</dd><dt>\\(c_L\\)</dt><dd>lifetime cap over the starting rate, 5 points</dd><dt>\\(\\lfloor\\cdot\\rceil_{1/8}\\)</dt><dd>rounding to the nearest 1/8 point</dd><dt>\\(r_{quote}\\)</dt><dd>rate before points</dd><dt>\\(p_n\\)</dt><dd>number of discount points</dd><dt>\\(\\Delta_p\\)</dt><dd>rate reduction per point</dd></dl>
  <p><em>Credit score</em> (conventional loans): the survey rate is for about 20% down and a 760–779 score, so the rate is raised by \\((\\text{LLPA}(score, LTV) - \\text{LLPA}(760\\text{–}779, 80\\%))\\times\\Delta_p\\): the difference in Fannie Mae's loan-level price adjustments, in points of the loan, turned into rate at the same rate cut per point \\(\\Delta_p\\) as discount points. FHA loans have no such adjustment here.</p>
  <p>Refinancing an ARM switches it to a fixed rate; refinancing an FHA loan moves it to a conventional loan, so FHA's mortgage insurance ends (conventional PMI applies only while the balance is above 78% of the price). A planned move to a new home uses a conventional fixed loan. Points are deducted in the purchase year if you itemize; the renter invests the same cash.</p>

  <h3>Owner's monthly cost</h3>
  \\[ \\begin{aligned} C^{own}_t = {}& M + \\text{MIP}_t + \\text{PMI}_t \\\\ &+ \\tfrac{1}{12}\\big(\\tau_p A_y + \\psi H_y \\epsilon_y + \\text{Ins}_y\\big) \\\\ &+ \\text{HOA}_y + U_y + \\text{Refi}_t \\\\ &- R^{hh,net}_t - \\mathbb{1}_{\\text{Dec}}\\,S_y \\end{aligned} \\]
  <dl class="sym"><dt>\\(H_y\\)</dt><dd>home market value at the start of year \\(y\\)</dd><dt>\\(A_y\\)</dt><dd>assessed value for property tax: equal to \\(H_y\\), or with an assessment cap \\(a_{cap}\\), \\(A_y = \\min(H_y, F_y)\\) where the capped base \\(F_y = F_{y-1}(1+\\min(a_{cap}, \\pi_{y-1}))\\) starts at the price (\\(\\pi\\) only for inflation-linked caps such as California's and Florida's); after a price drop the assessment follows the market down and returns toward the base as prices recover</dd><dt>\\(\\tau_p\\)</dt><dd>effective property tax rate</dd><dt>\\(\\psi\\)</dt><dd>maintenance as a share of home value per year</dd><dt>\\(\\epsilon_y\\)</dt><dd>upkeep shock: 1 in the projection; in the Monte Carlo a gamma draw with mean 1 and coefficient of variation ${MAINT_CV}, so repairs arrive in lumps</dd><dt>\\(\\text{Ins}_y\\)</dt><dd>homeowners plus flood/earthquake insurance, growing at inflation plus \\(g_{ins}\\) per year</dd><dt>\\(\\text{HOA}_y,\\ U_y\\)</dt><dd>HOA dues and extra owner utilities per month, growing with inflation</dd><dt>\\(\\text{PMI}_t\\)</dt><dd>\\(p_{mi}L/12\\) while \\(B_t > 0.78P\\) and \\(d \\lt 20\\%\\) (conventional loans). \\(p_{mi} = \\bar p_{mi}\\,k_{score}\\,\\text{cov}/35\\): the PMI setting \\(\\bar p_{mi}\\) is the rate at 3–5% down, \\(\\text{cov}\\) the coverage lenders require at your loan-to-value (35% above 95% loan-to-value, 30% above 90%, 25% above 85%, 12% above 80%), and \\(k_{score}\\) the premium for your credit score relative to 760+ (1 to about 3.3)</dd><dt>\\(\\text{Refi}_t\\)</dt><dd>refinance cost in the month it happens</dd><dt>\\(R^{hh,net}_t\\)</dt><dd>house-hacking rent after vacancy and its tax (below); 0 if none</dd><dt>\\(\\mathbb{1}_{\\text{Dec}}\\)</dt><dd>1 in December, else 0: the year's tax saving is credited once</dd><dt>\\(S_y\\)</dt><dd>tax saving from owning in year \\(y\\) (below)</dd></dl>

  <h3>Renter's monthly cost</h3>
  \\[ \\begin{aligned} C^{rent}_t = {}& R_y + \\tfrac{1}{12}\\,\\text{Ins}^{r}_y \\\\ &+ \\tfrac{1}{12}\\,\\eta\\,(c_{mv} + b\\,R^{mkt}_y) \\end{aligned} \\]
  ${eqLines(['marketRent','lease'])}
  <dl class="sym"><dt>\\(R_y\\)</dt><dd>the renter's lease rent per month in year \\(y\\)</dd><dt>\\(R^{mkt}_y\\)</dt><dd>market rent for a comparable home (starts at your comparable rent)</dd><dt>\\(g^{rent}_y\\)</dt><dd>market rent growth</dd><dt>\\(\\delta\\)</dt><dd>how much slower renewals grow than market rent (0 = lease tracks market)</dd><dt>\\(\\eta\\)</dt><dd>share of renters who move each year; a move resets the lease to market rent</dd><dt>\\(c_{mv}\\)</dt><dd>cost per move (grows with inflation)</dd><dt>\\(b\\)</dt><dd>broker fee per move, in months of rent</dd><dt>\\(\\text{Ins}^{r}_y\\)</dt><dd>renter's insurance per year</dd></dl>

  <h3>Equal budgets</h3>
  ${eqLines(['delta','investR','investB'])}
  <dl class="sym"><dt>\\(\\Delta_t\\)</dt><dd>how much more owning costs than renting in month \\(t\\)</dd><dt>\\(a\\)</dt><dd>share of the monthly difference actually invested (1 = all of it; the rest is spent)</dd></dl>
  <p>At the start the renter invests the cash the buyer spends: \\(C_0 = P(d + c) + \\text{move-in costs} + \\text{points cost}\\).</p>

  <h3>Taxes</h3>
  <p>Every tax the model applies, and where its formula is. Income taxes count only where they differ between the paths. The Taxes card on the Projection tab totals each tax over your horizon and lists the rules that apply to you.</p>
  <ul class="facts"><li><b>Income tax saved by owning</b>: 2026 federal brackets and standard deduction, the SALT cap and its phase-out, the $750,000 limit on mortgage interest, points in the purchase year, mortgage insurance from 2026, and a state deduction where the state allows it (<a href="#m-federal-and-state-tax-saving" class="mlink">Federal and state tax saving</a>).</li><li><b>Your marginal rates</b>: federal bracket from income (growing with it), state and local income tax for the location, 3.8% net investment income tax above $200,000 / $250,000, and the 0/15/20% capital-gains rate (<a href="#m-federal-and-state-tax-saving" class="mlink">Federal and state tax saving</a>, <a href="#m-income-growth-and-affordability" class="mlink">Income growth</a>, <a href="#m-extra-payments-pmi-removal-gains-tax-and-home-equity-line" class="mlink">Capital-gains rate</a>).</li><li><b>Tax on investments</b>: dividends taxed each year at the gains rate, bond and T-bill interest at the ordinary rate, and the gains taxed when the portfolio is sold; none in a sheltered account (<a href="#m-investment-returns-taxes-and-leverage" class="mlink">Investment returns, taxes and leverage</a>).</li><li><b>Property tax</b>: effective rate on the assessed value, with state assessment caps and homestead exemptions or credits (<a href="#m-owner-s-monthly-cost" class="mlink">Owner's monthly cost</a>).</li><li><b>Transfer and recording taxes</b>: state, county and city taxes on the price or the loan, flat or by bracket, split between buyer and seller (<a href="#m-transfer-taxes" class="mlink">Transfer taxes</a>).</li><li><b>Tax on the home sale</b>: gain over the price plus closing costs and improvements, less the $250,000 / $500,000 exclusion after 2 years (<a href="#m-buyer-s-net-worth" class="mlink">Buyer's net worth</a>).</li><li><b>Renting out part of the home or a rental</b>: tax on the rent net of the rented share of costs; for a rental, depreciation, the $25,000 passive-loss allowance and tax on recaptured depreciation at sale (<a href="#m-house-hacking" class="mlink">House-hacking</a>, <a href="#m-rent-rental-property" class="mlink">Rent + rental property</a>).</li></ul>

  <h3>Federal and state tax saving</h3>
  \\[ \\begin{aligned} S_y &= \\mu_y\\,\\big(D^{1}_y - D^{0}_y\\big) - \\mu_y\\tfrac{2}{37}\\mathbb{1}_{37}\\big(\\hat D^{1}_y - \\hat D^{0}_y\\big) \\\\ &\\quad + \\mathbb{1}_{st}\\,t_s\\,\\big(\\max(s_{st}\\Pi_y,\\ I^{ded}_y + \\tau_pA_y + O) \\\\ &\\qquad - \\max(s_{st}\\Pi_y,\\ O)\\big) \\\\ D^{1}_y &= \\max\\big(D^{std}_y,\\ \\min(\\text{SALT}_y,\\ T^{st}+\\tau_pA_y) \\\\ &\\qquad\\quad + I^{ded}_y + O\\big) \\\\ D^{0}_y &= \\max\\big(D^{std}_y,\\ \\min(\\text{SALT}_y,\\ T^{st}) \\\\ &\\qquad\\quad + O\\big) \\end{aligned} \\]
  <dl class="sym"><dt>\\(D^{1}_y,\\ D^{0}_y\\)</dt><dd>deductions with and without owning: itemized or standard, whichever is larger</dd><dt>\\(\\mu_y\\)</dt><dd>federal marginal tax rate (from income and 2026 brackets in automatic mode)</dd><dt>\\(D^{std}_y\\)</dt><dd>standard deduction ($16,100 single, $32,200 joint in 2026), indexed to inflation</dd><dt>\\(\\text{SALT}_y\\)</dt><dd>state-and-local-tax deduction cap: $40,400 in 2026, +1% a year through 2029, $10,000 from 2030; above $505,000 of income it shrinks by 30% of the excess, to a $10,000 floor</dd><dt>\\(T^{st}\\)</dt><dd>your state and local income tax per year</dd><dt>\\(\\hat D^{1}_y,\\ \\hat D^{0}_y,\\ \\mathbb{1}_{37}\\)</dt><dd>the itemized deductions (0 when the standard deduction is taken); in the 37% bracket (\\(\\mathbb{1}_{37}=1\\)) itemized deductions are cut by 2/37 from 2026, so they save 35% (taken as if taxable income is above the 37% bracket by at least the deductions)</dd><dt>\\(s_{st}\\)</dt><dd>the state's standard deduction (in automatic mode; 0 when entered by hand), indexed like the federal one: the state saving counts only what itemizing adds over it</dd><dt>\\(I^{ded}_y\\)</dt><dd>deductible mortgage interest: interest paid in year \\(y\\) times \\(\\min(1, \\$750{,}000/\\bar B_y)\\) with \\(\\bar B_y\\) the year's average balance (IRS Pub. 936), plus points in the purchase year and, from 2026, mortgage insurance (fully below $100,000 of income, phased out by $110,000)</dd><dt>\\(O\\)</dt><dd>other itemized deductions</dd><dt>\\(t_s\\)</dt><dd>your state tax rate on investment income</dd><dt>\\(\\mathbb{1}_{st}\\)</dt><dd>1 if your state lets you deduct mortgage interest and property tax, else 0</dd></dl>
  <p>With house-hacking, only the share \\((1-z)\\) of interest and property tax enters the itemized deductions.</p>

  <h3>Investment returns, taxes and leverage</h3>
  ${eqLines(['mix','rho'])}
  ${eqLines(['liquid','ledgerMonth'])}
  <dl class="sym"><dt>\\(w_s, w_b, w_c\\)</dt><dd>portfolio weights in stocks, bonds and T-bills (sum to 1)</dd><dt>\\(r^{stk}_t, r^{bond}_t, r^{bill}_t\\)</dt><dd>monthly total returns of stocks, bonds and T-bills</dd><dt>\\(g_t\\)</dt><dd>unlevered portfolio return in month \\(t\\)</dd><dt>\\(\\lambda\\)</dt><dd>leverage on the portfolio (1 = none; below 1 the rest sits in T-bills, with no spread)</dd><dt>\\(s_b\\)</dt><dd>borrowing spread over the T-bill rate, per year</dd><dt>\\(f\\)</dt><dd>fund fees per year</dd><dt>\\(\\rho_t\\)</dt><dd>net portfolio return in month \\(t\\), before tax</dd><dt>\\(V\\)</dt><dd>portfolio value</dd><dt>\\(\\text{basis}\\)</dt><dd>money put in plus income already taxed</dd><dt>\\(\\kappa_y\\)</dt><dd>tax rate on gains and dividends: capital-gains rate + NIIT \\(\\nu_y\\) + state rate \\(t_s\\)</dd><dt>\\(\\nu_y\\)</dt><dd>net investment income tax: 3.8% when income exceeds $200,000 single / $250,000 joint, else 0</dd><dt>\\(W^{liq}\\)</dt><dd>what the portfolio is worth after paying tax on a sale</dd></dl>
  <p>In a taxable account, dividends (yield \\(q\\)) are taxed each year at \\(\\kappa_y\\) and bond and T-bill interest at \\(\\mu_y + \\nu_y\\) (Treasury interest is exempt from state income tax); taxed income is added to the basis. A sheltered account pays no tax. The T-bill-only path earns \\(r^{bill}_t\\) after ordinary-income tax.</p>

  <h3>Buyer's net worth</h3>
  \\[ \\begin{aligned} W^{buy}_t &= H_t(1-s)\\,\\xi - B_t \\\\ &\\quad + W^{liq}_{buy,t} - \\kappa_y\\,G_t \\\\ G_t &= \\big(H_t(1-s)\\,\\xi - P(1+c) \\\\ &\\qquad - \\Phi - \\text{Excl}\\big)^{+} \\end{aligned} \\]
  <dl class="sym"><dt>\\(G_t\\)</dt><dd>taxable gain on the home at sale; \\((z)^{+} = \\max(0, z)\\)</dd><dt>\\(s\\)</dt><dd>selling costs as a share of the price (commissions, fees and seller transfer taxes)</dd><dt>\\(c\\)</dt><dd>buyer closing costs as a share of the price (including buyer transfer taxes)</dd><dt>\\(\\xi\\)</dt><dd>single-house price shock at sale: 1 in the projection; in the Monte Carlo \\(\\exp(\\sigma_h\\varepsilon - \\sigma_h^2/2)\\)</dd><dt>\\(\\Phi\\)</dt><dd>improvements added to the tax basis: a share \\(\\varphi\\) of each year's upkeep</dd><dt>\\(\\text{Excl}\\)</dt><dd>home-sale exclusion: $250,000 single, $500,000 joint, if owned at least 2 years</dd><dt>\\(W^{liq}_{buy,t}\\)</dt><dd>the buyer's own portfolio after tax</dd></dl>
  <p>The renter's net worth is \\(W^{inv}_t = W^{liq}_{rent,t}\\). Values in today's dollars divide by cumulative inflation \\(\\prod(1+\\pi_y)\\), where \\(\\pi_y\\) is CPI inflation.</p>

  <h3>Transfer taxes</h3>
  \\[ \\begin{aligned} \\text{flat: } & \\tau\\,X \\\\ \\text{whole-amount: } & \\tau_j\\,X, \\quad a_j \\le X \\lt b_j \\\\ \\text{marginal: } & \\textstyle\\sum_j \\tau_j\\,\\big(\\min(X, b_j) - a_j\\big)^{+} \\end{aligned} \\]
  <dl class="sym"><dt>\\(X\\)</dt><dd>the amount taxed: the price \\(P\\), or the loan \\(L\\) for mortgage-recording taxes</dd><dt>\\(\\tau,\\ \\tau_j\\)</dt><dd>tax rate, or the rate for bracket \\(j\\)</dd><dt>\\(a_j, b_j\\)</dt><dd>lower and upper bounds of bracket \\(j\\)</dd></dl>
  <p>Buyer-paid taxes are added to \\(c\\), seller-paid taxes to \\(s\\); split taxes are divided evenly. Seller taxes are worked out again at the sale price (the brackets that apply then), and the affordability search works out buyer taxes at each price it tries. First-time-buyer reliefs are not applied.</p>

  <h3>House-hacking</h3>
  \\[ \\begin{aligned} R^{hh,net}_t &= R^{hh}_y(1-v_h) \\\\ &\\quad - \\tfrac{1}{12}(\\mu_y + \\nu_y + t_s)\\,Q_y^{+} \\\\ Q_y &= 12R^{hh}_y(1-v_h) - z\\,K_y \\\\ K_y &= I_y + \\tau_pA_y + \\text{Ins}_y \\\\ &\\quad + (1-\\varphi)\\psi H_y + 12U_y \\end{aligned} \\]
  <dl class="sym"><dt>\\(Q_y,\\ K_y\\)</dt><dd>yearly taxable rental income; yearly owner costs before the rented share \\(z\\) is taken</dd><dt>\\(R^{hh}_y\\)</dt><dd>monthly rent from the rented part of the home, growing with market rent</dd><dt>\\(v_h\\)</dt><dd>vacancy rate</dd><dt>\\(z\\)</dt><dd>share of the home rented out</dd><dt>\\(I_y\\)</dt><dd>mortgage interest paid in year \\(y\\)</dd></dl>
  <p>The model leaves out depreciation on the rented share; the IRS taxes the depreciation you could have taken (at up to 25%) when you sell, even if you didn't claim it ${RES.hhTax&&RES.hhTax.u?linkTo(RES.hhTax.u,'(IRS Pub 523)'):''}, so house-hacking looks slightly better here than it is.</p>

  <h3>Rent + rental property</h3>
  \\[ \\begin{aligned} P_R &= C_0/(d_R + c) \\\\ R^{R}_y &= \\frac{P_R}{P}\\,R_0\\,\\frac{R^{mkt}_y}{R^{mkt}_0} \\\\ \\text{collected}_y &= R^{R}_y(1-v_R)(1-f_m) \\end{aligned} \\]
  \\[ \\begin{aligned} \\text{taxable}_y = {}& 12\\,\\text{collected}_y - I^{R}_y \\\\ & - \\tau_p H^R_y - \\text{Ins}^R_y \\\\ & - 12\\,\\text{HOA}^R_y - (1-\\varphi)\\psi H^R_y \\\\ & - P_R(1+c)(1-\\ell)/27.5 \\end{aligned} \\]
  <dl class="sym"><dt>\\(C_0\\)</dt><dd>the same starting cash the renter invests (down payment, closing costs, points and move-in costs)</dd><dt>\\(d_R\\)</dt><dd>down payment on the rental</dd><dt>\\(P_R,\\ H^R_y\\)</dt><dd>rental purchase price and its value in year \\(y\\) (grows like your home)</dd><dt>\\(R^{R}_y\\)</dt><dd>its gross monthly rent, at your price-to-rent ratio</dd><dt>\\(v_R,\\ f_m\\)</dt><dd>rental vacancy and management fee</dd><dt>\\(I^R_y\\)</dt><dd>interest on the rental's 30-year loan at your rate plus the investment-property premium</dd><dt>\\(\\text{Ins}^R_y,\\ \\text{HOA}^R_y\\)</dt><dd>your insurance and HOA scaled by \\(P_R/P\\)</dd><dt>\\(\\ell\\)</dt><dd>land share of the price (not depreciable); buildings depreciate over 27.5 years</dd></dl>
  <p>Losses offset up to $25,000 of other income, phasing out between $100,000 and $150,000 of income; the rest is suspended and released at sale. At sale, gain up to accumulated depreciation is taxed at \\(\\min(25\\%, \\mu_y) + \\nu_y + t_s\\), the rest at \\(\\kappa_y\\) ${RES.dep&&RES.dep.u?linkTo(RES.dep.u,'(IRS Pub 527)'):''}. This household invests the same monthly surplus as the renter plus the rental's cash flow, borrowing at the T-bill rate + 3 points if its portfolio runs negative.</p>

  <h3>Income growth and affordability</h3>
  \\[ \\text{Inc}_y = \\text{Inc}_0\\,(1+g_I)^y \\]
  <dl class="sym"><dt>\\(\\text{Inc}_y\\)</dt><dd>household income in year \\(y\\)</dd><dt>\\(g_I\\)</dt><dd>income growth per year</dd></dl>
  <p>In automatic mode \\(\\mu_y\\) is the bracket for \\(\\text{Inc}_y / \\prod(1+\\pi)\\) (brackets are inflation-indexed); the SALT phase-out and NIIT threshold use \\(\\text{Inc}_y\\). Affordability: front-end ratio = month-1 principal, interest, property tax, insurance, HOA and mortgage insurance ÷ monthly gross income; back-end adds other debt payments. Guidelines are at most 28% and 36%; the lender limit here is a conservative 43% (automated underwriting for conventional loans often allows 45–50%; ${linkTo(AFF_URL,'Bankrate')}).</p>

  <h3>Planned move</h3>
  <p>At the start of the move year the buyer sells as in the net-worth formula. <em>Sell and buy again:</em> the next home costs what the old one sold for, closing costs are paid again, all remaining equity becomes the down payment, and a new fixed loan over your term is taken at \\(m_t\\) then (PMI if under 20% down; the 2-year exclusion clock restarts). <em>Sell and rent:</em> proceeds go into the buyer's portfolio and the household pays market rent from then on. Both households move, so moving costs common to both are left out; the renter's lease resets to market.</p>

  <p>A sale that brings in less than the mortgage leaves a shortfall. It is held as a negative balance that grows at the T-bill rate plus 3 points a year, \\(V_{t+1} = V_t\\,(1 + r^{bill}_t + 0.03/12)\\) while \\(V_t \\lt 0\\), and later savings pay it down before anything is invested.</p>

  <h3>Where the gap comes from</h3>
  <p>With both households spending the same each month, the gap at year \\(N\\) splits exactly into</p>
  \\[ \\begin{aligned} \\text{gap}_N = {}& (H_N - P) - s H_N - T^{sale} \\\\ &- (cP + \\text{move-in} + \\text{points}) \\\\ &- \\textstyle\\sum_y (I_y + \\tau_p A_y + \\text{Ins}_y + \\text{HOA}_y \\\\ &\\qquad + \\text{MI}_y + U_y + \\text{Refi}_y + \\psi H_y) \\\\ &+ \\textstyle\\sum_y S_y + \\sum_y R^{hh}_y + \\sum_y \\text{Rent}_y + (1-a)\\sum_t d_t \\\\ &+ \\big(L - \\textstyle\\sum_y \\text{Prin}_y - B_N\\big) \\\\ &+ (T^{inv}_R - T^{inv}_B) - (G^{R} - G^{B}) \\end{aligned} \\]
  <p>Each yearly flow is in the chosen dollars at the middle of its year. The loan term is the gain from repaying a fixed loan with dollars inflation has shrunk (zero in nominal dollars, apart from FHA's financed upfront premium). \\(T^{inv}_R,\\ T^{inv}_B\\) are each portfolio's taxes: yearly on dividends and interest plus the tax due on selling at year \\(N\\). \\(G^R - G^B\\), what the renter's portfolio earned beyond the buyer's before those taxes, is the remainder, so the parts always add up. Principal payments move money into the house without changing net worth, so they do not appear. \\(d_t\\) is the owner's minus the renter's cost in month \\(t\\) and \\(a\\) the share of it invested: the part nobody invests is spent, which favors whoever spent less. With a planned move the breakdown is not shown, since a second sale and purchase (or renting afterwards) has no term here.</p>

  <h3>Affordability</h3>
  <p>The payment lenders count is principal, interest, property tax, insurance (scaled with the price), HOA and mortgage insurance. Comfortable: that payment \\(\\le 28\\%\\) of gross monthly income and, with other debt payments, \\(\\le 36\\%\\). Lender limit: all debt \\(\\le 43\\%\\). Cash pays the down payment plus closing costs, transfer taxes and move-in costs, with at least 3% down (3.5% FHA). The highest price is found by bisection; the income needed for a price is \\(\\max(\\text{PITI}/0.28,\\ (\\text{PITI}+\\text{debt})/0.36)\\times 12\\).</p>

  <h3>Counties</h3>
  <p>A ZIP code uses the same figures for its ZIP Code Tabulation Area (Census ACS 5-year), HUD's Small Area Fair Market Rent for the bedrooms chosen (times the ZIP's contract-to-gross rent ratio), and the county holding most of its land (Census 2020 relationship file) for insurance and price history; missing ZIP figures fall back to the county's. Small Area FMRs cover ZIPs in metropolitan areas.</p>
  <p>Picking a county uses Census ACS 5-year medians: home value \\(\\times k_P\\) (the U.S. median's change to today's Zillow typical value) and property tax ÷ value. Rent is HUD's Fair Market Rent for the bedrooms chosen (the 40th-percentile rent of recent movers, including utilities) \\(\\times\\) the county's ACS median contract rent ÷ median gross rent, to leave utilities out; without a HUD figure it is the ACS median contract rent scaled to today's Zillow typical U.S. rent. Price history is FHFA's annual all-transactions county index (developmental; Bogin, Doerner &amp; Larson 2016), scaled like the metro indexes with the median metro volatility ratio. Insurance is the state average where a metro file has one, else the U.S. average. Transfer taxes come from the state's rules plus the county's own tax where one applies.</p>

  <h3>Rent estimated from the home price</h3>
  <p>With the rent setting on <em>Estimate from home price</em>: \\(\\text{rent}_0 = \\bar R_{loc}\\, b_{beds} \\,(P / \\bar P_{loc})^{0.65}\\), where \\(\\bar R_{loc}\\) and \\(\\bar P_{loc}\\) are the location's typical rent and home value and \\(b_{beds}\\) the Census rent ratio for the bedrooms chosen. The exponent is the slope of log median contract rent (rent without utilities) on log median home value across about 3,200 U.S. counties (Census ACS 2020–2024): pricier homes rent for less relative to their price. It is measured across places, so within one market the true slope may differ; a real comparable rental is better.</p>

  <h3>Extra payments, PMI removal, gains tax and home-equity line</h3>
  <p><em>Extra each month</em> \\(E\\) is added to the owner's monthly cost, so the renter invests the same amount. Toward principal: \\(B_{t+1} = B_t - (M - iB_t) - \\min(E, B_t)\\); once the loan is paid off early, the scheduled payment \\(M\\) keeps going into the buyer's portfolio until the original term ends, so both choices spend the same. Toward the portfolio: \\(E\\) is invested each month instead.</p>
  <p><em>PMI by appraisal</em> (conventional loans): PMI stops at the first month \\(t \\ge 24\\) with \\(B_t \\le 0.75\\,H_t\\), or \\(t \\ge 60\\) with \\(B_t \\le 0.80\\,H_t\\), besides the scheduled stop at \\(0.78\\,P\\). The appraisal fee is not modeled.</p>
  <p><em>Capital-gains rate, automatic:</em> \\(\\tau_g = 0\\%\\) for taxable ordinary income up to \\$49,450 (\\$98,900 joint), 15% up to \\$545,500 (\\$613,700), else 20% (2026 thresholds, indexed like the brackets). The gain itself is not stacked on income.</p>
  <p><em>Home-equity line:</em> available credit \\(\\max(0,\\ \\ell H_t - B_t)\\) for a limit \\(\\ell\\) is added to the buyer's liquid assets in the liquidity checks only; it is never drawn and does not change net worth.</p>

  <h3>Moving risk</h3>
  \\[ \\begin{aligned} \\Pr(T=\\tau) &= h(1-h)^{\\tau-1}, \\quad \\tau \\lt N \\\\ \\Pr(T=N) &= (1-h)^{N-1} \\\\ \\text{gap} &= \\textstyle\\sum_{\\tau=1}^{N}\\Pr(T=\\tau) \\\\ &\\quad \\times \\big(W^{buy}_{\\tau} - W^{inv}_{\\tau}\\big) \\end{aligned} \\]
  <dl class="sym"><dt>\\(T\\)</dt><dd>years until you sell (holding period), capped at \\(N\\)</dd><dt>\\(h\\)</dt><dd>chance of moving in any year</dd><dt>\\(\\tau\\)</dt><dd>a possible holding period, in years</dd><dt>\\(W^{buy}_{\\tau},\\ W^{inv}_{\\tau}\\)</dt><dd>net worth at the end of year \\(\\tau\\)</dd></dl>
  <p>In the Monte Carlo, \\(h\\) is multiplied by \\(k_s\\) in bad years (home prices fell or stocks fell more than 15%), and a move in a bad year sells at a discount \\(\\phi_f\\) to market value ${RES.forced&&RES.forced.u?linkTo(RES.forced.u,'(Campbell, Giglio &amp; Pathak 2011)'):''}.</p>

  <h3>Monte Carlo</h3>
  \\[ \\begin{aligned} \\tilde x_j = \\exp\\big(& \\ln(1+x_j) - \\overline{\\ln(1+x)} \\\\ & + \\ln(1+\\bar g)\\big) - 1 \\end{aligned} \\]
  \\[ \\begin{aligned} m_{y+1} = m_y &+ \\theta(\\bar m - m_y) \\\\ &+ \\beta_\\pi\\,(\\pi_y - \\pi_{y-1}) + e_y \\end{aligned} \\]
  <dl class="sym"><dt>\\(J\\)</dt><dd>block length: blocks of \\(J\\) consecutive historical years are drawn with replacement, keeping all series from the same years together; a block that runs past the last year continues from the first (circular), so every year is equally likely</dd><dt>\\(x_j\\)</dt><dd>a series' historical value in sampled year \\(j\\)</dd><dt>\\(\\overline{\\ln(1+x)}\\)</dt><dd>its historical average log growth</dd><dt>\\(\\bar g\\)</dt><dd>your assumption for that series; with re-centering the simulated geometric mean equals it</dd><dt>\\(\\sigma_h,\\ \\varepsilon\\)</dt><dd>single-house price volatility and a standard normal draw (used in \\(\\xi\\), or compounded yearly if you choose that model)</dd><dt>\\(m_y\\)</dt><dd>simulated market mortgage rate, in percentage points, kept within 2–20</dd><dt>\\(\\bar m\\)</dt><dd>your expected later rate</dd><dt>\\(\\theta\\)</dt><dd>pull-back speed toward \\(\\bar m\\), fitted on 1973–2025: ${RATE_AR.theta}</dd><dt>\\(\\beta_\\pi\\)</dt><dd>effect of a change in inflation on the rate: ${RATE_AR.beta}</dd><dt>\\(e_y\\)</dt><dd>residual from the same sampled year (normal with s.d. ${RATE_AR.sd} points for years before 1973)</dd><dt>\\(\\pi_y\\)</dt><dd>CPI inflation in year \\(y\\)</dd></dl>

  <h3>Risk adjustment</h3>
  \\[ \\begin{aligned} CE &= \\big(\\mathbb{E}[W^{1-\\gamma}]\\big)^{1/(1-\\gamma)}, \\quad \\gamma \\ne 1 \\\\ CE &= \\exp\\big(\\mathbb{E}[\\ln W]\\big), \\quad \\gamma = 1 \\end{aligned} \\]
  <dl class="sym"><dt>\\(CE\\)</dt><dd>certainty equivalent: the sure amount worth as much to you as the uncertain outcome</dd><dt>\\(W\\)</dt><dd>simulated net worth at the horizon, floored at 1% of the starting cash</dd><dt>\\(\\gamma\\)</dt><dd>relative risk aversion (0 = risk-neutral)</dd><dt>\\(\\mathbb{E}\\)</dt><dd>average across simulated futures</dd></dl>

  <h3>Home-price volatility scaling</h3>
  \\[ \\begin{aligned} g'_y &= \\bar g_{loc} + k_v\\,(g_y - \\bar g_{loc}) \\\\ k_v &= \\sigma_{CS}/\\sigma_{FHFA} \\end{aligned} \\]
  <dl class="sym"><dt>\\(g_y,\\ g'_y\\)</dt><dd>a location's FHFA yearly price change, before and after scaling</dd><dt>\\(\\bar g_{loc}\\)</dt><dd>its average yearly change</dd><dt>\\(\\sigma_{CS},\\ \\sigma_{FHFA}\\)</dt><dd>standard deviations of yearly changes in the Case-Shiller and FHFA indexes, 1992–2025</dd><dt>\\(k_v\\)</dt><dd>ratio stored per location (median 1.09; San Francisco and Atlanta 1.37)</dd></dl>
  ${MONTHLY?`<h3>Monthly bond returns</h3>
  \\[ r^{bond}_t \\approx \\frac{Y_{t-1}}{12} - D_b\\,(Y_t - Y_{t-1}) \\]
  <dl class="sym"><dt>\\(Y_t\\)</dt><dd>10-year Treasury yield in month \\(t\\) (decimal)</dd><dt>\\(D_b\\)</dt><dd>bond duration, 7.5 years</dd></dl>`:''}

  <h3>Backtest starting rent</h3>
  <p>Every Backtest purchase starts at your price. With starting rent <em>Mine</em> the first year's rent is your rent, so every purchase year starts at your rent-to-price ratio. With <em>Historical</em> it is \\(R_0\\,\\rho_s/\\rho_{\\text{latest}}\\), where \\(\\rho_s\\) is the national rent-to-price ratio of owner-occupied homes in the purchase year \\(s\\): yearly imputed rent of owner-occupied housing (BEA) divided by the average market value of owner-occupied real estate over the year (Federal Reserve Z.1), the construction behind Davis, Lehnert and Martin's series, here from the public sources directly. Your place keeps its premium or discount over the national level; the swings over time come from history (about 7% in the early 1970s, 4.6% at the 2006 peak in prices, 7.1% in 2012). After the purchase, rent and price follow their historical growth either way. The national ratio is an aggregate over all owner-occupied homes and land, so it describes the direction and size of swings better than any one home's level.</p>

  <h3>Checked against a published study</h3>
  <p>Beracha and Johnson (${linkTo('https://doi.org/10.1111/j.1540-6229.2011.00321.x','Real Estate Economics, 2012')}) replayed actual U.S. history for buyers who held 8 years, bought from 1978 to 2001: 20% down on a 30-year fixed loan at that year's average rate, 2% closing and 6% selling costs, property tax 1.5% and upkeep plus insurance 2% of value a year, a 25% tax bracket, refinancing allowed, and a renter who invests the down payment and every month's difference at the T-bill rate. Renting came out ahead in 64.6% of those holds, and the renter ended with 1.26× the buyer's sale proceeds on average.</p>
  <p>The same assumptions run through this model with its own national data (<code>tests/validate.js</code>, run with the tests): renting comes out ahead in about 67% of the holds when rent starts at 5% of the price a year (roughly where their rent-to-price data, from Davis, Lehnert and Martin, sat in those years), and the renter ends about 1.1× ahead on average. The model agrees on who wins and how often; it puts the renter's lead lower, likely because of differences in the home-price index (FHFA's all-transactions index there, Shiller and scaled FHFA purchase-only here), yearly instead of half-yearly purchases, and how yearly outlays are booked.</p>
  <p>The check also shows what drives the answer most: the rent-to-price ratio when you buy. At 4.5% renting wins 75% of the holds; at the ratios implied by rolling today's 7% U.S. gross rent ratio back through history, buying wins nearly always. The Backtest tab replays history with <em>your</em> price and rent, so it answers "how would my situation have fared in past markets", not "how did buyers fare then".</p>

  <h3>Limits</h3>
  <ul>
    <li>Rent indexes track existing leases and move more slowly than asking rents (see the Data tab). Pre-1940s rent data are sparse; three missing December values (1934, 1935, 1946) are interpolated.</li>
    <li>The national real-estate series is Shiller's reconstruction for 1928–1986 and Case-Shiller National for 1987–1991, as published by Damodaran. From 1992 it is FHFA's U.S. purchase-only index, December to December, with its swings scaled to Case-Shiller's size by one stored ratio (see volatility scaling). Metro and monthly national home prices are FHFA's purchase-only indexes from 1991.</li>
    <li>No rent control, and no value placed on stability, control over the home, or the flexibility of renting. Bond total returns are taxed as income in the year earned. Margin interest is not deducted. State income tax grows with income.</li>
  </ul>
  <p class="cap">Inputs marked "assumption" are conventional planning values with no single authoritative source.</p>

  <h3 id="notation">Notation</h3>
  <div class="tablewrap notewrap" style="max-height:none"><table class="kv notation">
  <thead><tr><th>Symbol</th><th>Meaning</th><th>Setting</th></tr></thead><tbody>
    <tr><td>\\(t, y, N\\)</td><td>month, year, horizon in years</td><td>Horizon</td></tr>
  <tr><td>\\(P, d, c, s\\)</td><td>price, down payment share, buyer closing-cost share, selling-cost share</td><td>Home price, Down payment, Closing costs, Selling costs, Transfer taxes</td></tr>
  <tr><td>\\(L, r, i, n, M\\)</td><td>loan, annual rate, monthly rate, number of payments, monthly payment</td><td>Mortgage rate, Term</td></tr>
  <tr><td>\\(B_t, I_t\\)</td><td>balance and interest in month t</td><td></td></tr>
  <tr><td>\\(m_t, \\bar m, \\Delta_R, c_R\\)</td><td>market rate, expected later rate, refinance trigger, refinance cost</td><td>Refinancing</td></tr>
  <tr><td>\\(u_F, \\pi_F, n_F\\)</td><td>FHA upfront premium, annual premium, months charged</td><td>Loan type</td></tr>
  <tr><td>\\(r_0, x, \\chi, c_k, c_L\\)</td><td>ARM start rate, index, margin, reset cap, lifetime cap</td><td>ARM fields</td></tr>
  <tr><td>\\(p_n, \\Delta_p\\)</td><td>points and rate cut per point</td><td>Discount points</td></tr>
  <tr><td>\\(H_y, A_y, a_{cap}\\)</td><td>home value, assessed value, assessment cap</td><td>Assessment growth cap</td></tr>
  <tr><td>\\(\\tau_p, \\psi, \\epsilon_y\\)</td><td>property tax rate, maintenance rate, upkeep shock</td><td>Property tax, Maintenance</td></tr>
  <tr><td>\\(\\text{Ins}_y, g_{ins}, U_y\\)</td><td>insurance, its extra growth, extra utilities</td><td>Home insurance, Insurance growth, Extra utilities</td></tr>
  <tr><td>\\(p_{mi}\\)</td><td>PMI rate</td><td>PMI</td></tr>
  <tr><td>\\(R_y, R^{mkt}_y, g^{rent}_y, \\delta\\)</td><td>lease rent, market rent, rent growth, renewal gap</td><td>Rent, Rent growth, Lease renewals</td></tr>
  <tr><td>\\(\\eta, c_{mv}, b\\)</td><td>renter move rate, cost per move, broker fee</td><td>Renter moves, Cost per move, Broker fee</td></tr>
  <tr><td>\\(\\Delta_t, a, C_0\\)</td><td>monthly cost difference, share invested, starting cash</td><td>Share of savings invested</td></tr>
  <tr><td>\\(\\mu_y, D^{std}_y, \\text{SALT}_y, T^{st}, I^{ded}_y, O\\)</td><td>marginal rate, standard deduction, SALT cap, state income tax, deductible interest, other deductions</td><td>Income &amp; taxes</td></tr>
  <tr><td>\\(t_s, \\mathbb{1}_{st}, \\nu_y, \\kappa_y\\)</td><td>state rate, state deduction flag, NIIT, tax rate on gains</td><td>State tax, Capital-gains rate</td></tr>
  <tr><td>\\(w_s, w_b, w_c, \\lambda, s_b, f, q\\)</td><td>portfolio weights, leverage, borrowing spread, fees, dividend yield</td><td>Investing &amp; leverage</td></tr>
  <tr><td>\\(V, \\text{basis}, W^{liq}\\)</td><td>portfolio value, tax basis, after-tax value</td><td></td></tr>
  <tr><td>\\(\\xi, \\sigma_h, \\varepsilon\\)</td><td>house price shock at sale, its volatility, normal draw</td><td>Own-home price risk</td></tr>
  <tr><td>\\(\\Phi, \\varphi, \\text{Excl}\\)</td><td>basis from improvements, improvement share, sale exclusion</td><td>Share of upkeep that is improvements</td></tr>
  <tr><td>\\(R^{hh}_y, v_h, z\\)</td><td>house-hack rent, vacancy, share rented</td><td>House-hack</td></tr>
  <tr><td>\\(P_R, d_R, v_R, f_m, \\ell\\)</td><td>rental price, down payment, vacancy, management fee, land share</td><td>Other ways to own</td></tr>
  <tr><td>\\(\\text{Inc}_y, g_I\\)</td><td>income and its growth</td><td>Household income, Income growth</td></tr>
  <tr><td>\\(T, h, k_s, \\phi_f\\)</td><td>holding period, move probability, bad-year multiplier, forced-sale discount</td><td>Life &amp; risk preferences</td></tr>
  <tr><td>\\(J, \\bar g, \\theta, \\beta_\\pi, e_y, \\pi_y\\)</td><td>block length, assumed growth, rate pull-back, inflation effect, residual, inflation</td><td>Monte Carlo settings</td></tr>
  <tr><td>\\(CE, \\gamma\\)</td><td>certainty equivalent, risk aversion</td><td>Risk aversion</td></tr>
  <tr><td>\\(k_v\\)</td><td>FHFA-to-Case-Shiller volatility ratio</td><td>Scale FHFA price swings</td></tr>
  </tbody></table></div>

  <h3>Equation index</h3>
  ${eqIndexHTML()}
  `;
  structureMethod();
  document.getElementById('srclist').innerHTML=Object.values(SRC).map(s=>`<li><a target="_blank" rel="noopener" href="${s.u}">${s.t}</a></li>`).join('')+
    METROS.filter(m=>m.slug!=='us'&&!m.county).map(m=>`<li>${m.name}: ${['price','rent','ptax','ins','hpi'].map(k=>m.src&&m.src[k]?`<a target="_blank" rel="noopener" href="${m.src[k].u}">${({price:'price',rent:'rent',ptax:'property tax',ins:'insurance',hpi:'home-price index'})[k]}</a>`:null).filter(Boolean).join(' · ')}</li>`).join('');
}
/* MathJax (2.3 MB) is loaded the first time a tab with formulas opens, not with the page */
/* a display equation wider than its box scrolls sideways; keyboard users reach it with Tab (and scroll with the arrows) */
function eqFocus(el){el.querySelectorAll('mjx-container[display="true"]').forEach(c=>{if(c.scrollWidth>c.clientWidth+1)c.tabIndex=0})}
// equations typeset inside a closed section have no width yet: check again when it opens
document.addEventListener('toggle',e=>{const t=/** @type {any} */(e.target);if(t&&t.open&&t.querySelector)eqFocus(t)},true);
function typeset(el,tries=0){if(window.MathJax&&MathJax.typesetPromise){MathJax.typesetPromise([el]).then(()=>eqFocus(el)).catch(()=>{});return}
  if(!document.getElementById('mathjax-lib')){const sc=document.createElement('script');sc.id='mathjax-lib';sc.src=MATHJAX_SRC;sc.async=true;document.head.appendChild(sc)}
  if(tries<120)setTimeout(()=>typeset(el,tries+1),250)}


/* Formula page layout: sections become collapsible cards with a one-line summary, a sticky contents bar and a filter. */
const MSEC={
 'Time and growth':['Basics','How yearly rates become monthly steps.'],
 'Mortgage':['Owning','Loan size, monthly payment and how the balance falls.'],
 'Refinancing':['Owning','When the buyer refinances and what it costs.'],
 'Loan types and points':['Owning','FHA premiums, ARM resets and buying down the rate.'],
 "Owner's monthly cost":['Owning','Everything the owner pays each month.'],
 "Renter's monthly cost":['Renting','Lease rent, renter\'s insurance and moving costs.'],
 'Equal budgets':['Basics','Both households spend the same; the cheaper one invests the difference.'],
 'Taxes':['Taxes','Every tax in the model, with links to its formula.'],
 'Federal and state tax saving':['Taxes','Itemizing vs. the standard deduction, SALT cap and the home-sale exclusion.'],
 'Investment returns, taxes and leverage':['Investing','Portfolio growth, yearly tax drag and borrowing to invest.'],
 "Buyer's net worth":['Basics','What each household would have if it sold everything.'],
 'Transfer taxes':['Taxes','State, county and city taxes when a home changes hands.'],
 'House-hacking':['Options','Renting out part of your home.'],
 'Rent + rental property':['Options','Renting your home and owning a rental instead.'],
 'Income growth and affordability':['Taxes','How income moves your bracket and the debt-to-income ratio.'],
 'Planned move':['Options','Selling at a set year, then buying again or renting.'],
 'Moving risk':['Risk','Having to sell early, likelier and at a discount in bad years.'],
 'Monte Carlo':['Risk','Simulated futures built from blocks of real history.'],
 'Risk adjustment':['Risk','Certainty equivalent: valuing uncertain outcomes.'],
 'Home-price volatility scaling':['Data','Making FHFA price swings match Case-Shiller\'s size.'],
 'Monthly bond returns':['Data','Bond returns from 10-year Treasury yields.'],
 'Backtest starting rent':['Data','Your rent-to-price ratio, or scaled by the national ratio in the purchase year.'],
 'Checked against a published study':['Basics','How close the model gets to a 30-year study of actual outcomes.'],
 'Limits':['Basics','What the model leaves out.'],
 'Notation':['Basics','Every symbol, with the setting it comes from.'],
 'Equation index':['Basics','Every equation the "How this was computed" panel shows.'],
};
/* Sources behind each section's numbers and rules (SRC keys), and a note for what is a planning assumption or comes
   from per-location files linked next to the setting. Sections that only define the arithmetic have none. */
const MREF={
 'Refinancing':{s:['fredMort'],n:'The refinance trigger and cost are planning assumptions.'},
 'Loan types and points':{s:['lr_fha_0','lr_fha_1','lr_arm_0','lr_sofr_1','lr_points_1','llpa']},
 "Owner's monthly cost":{s:['ptaxUS','acs5','ins','ppi_ins','fema','r_maintenance_19','pmiFM','fnmaMiCov','pmiFico','pmiEnd'],n:'Assessment caps and homestead exemptions come from each state\'s rules, linked next to those settings when you pick a location. The upkeep shock\'s spread (coefficient of variation 1.2) is an assumption.'},
 "Renter's monthly cost":{s:['r_tenure','rz_renewal_vs_new_lease_38','rz_renewal_vs_new_lease_40'],n:'Cost per move and the broker fee are planning assumptions.'},
 'Taxes':{s:['irs26','salt','irs936','irsNiit','irs121','rz_depreciation_tax_29','rz_depreciation_tax_32'],n:'State, county and city rules are linked next to their settings when you pick a location.'},
 'Federal and state tax saving':{s:['irs26','salt','irs936'],n:'State income tax rules, and whether a state lets you deduct mortgage interest, are linked next to the State income tax setting.'},
 'Investment returns, taxes and leverage':{s:['damo','mTb','mSp','r_div_yield','irs26','irsNiit','r_margin_rate']},
 "Buyer's net worth":{s:['irs121','rz_house_hacking_tax_34','r_sell_costs_15','r_sell_costs_16','fredCPI']},
 'Transfer taxes':{s:[],n:'Each state, county and city tax cites its statute or the tax office\'s page, linked next to the Transfer taxes setting when you pick a location.'},
 'House-hacking':{s:['rz_house_hacking_tax_34','rz_depreciation_tax_29']},
 'Rent + rental property':{s:['rz_depreciation_tax_29','rz_depreciation_tax_31','rz_depreciation_tax_32','rz_investment_rate_premium_23','rz_rental_vacancy','rz_mgmt_fee'],n:'The T-bill + 3 points borrowing rate is an assumption.'},
 'Income growth and affordability':{s:['rz_wage_growth','irs26','irsNiit','aff']},
 'Planned move':{s:[],n:'The T-bill + 3 points rate on a shortfall is an assumption.'},
 'Affordability':{s:['aff','lr_fha_0']},
 'Counties':{s:['acs5','hudFmr','zcta','fhfaCounty','bogin','zillow','cbsa']},
 'Rent estimated from the home price':{s:['acs5','acs','zillow'],n:'The 0.65 exponent is fitted by this app on the ACS county medians (3,206 counties: log contract rent on log home value); the tests refit it on the stored data and fail if it drifts.'},
 'Extra payments, PMI removal, gains tax and home-equity line':{s:['fnmaMiEnd','pmiEnd','irs26']},
 'Moving risk':{s:['r_tenure','rz_forced_sales_45']},
 'Monte Carlo':{s:['damo','shiller','fhfa','fredCPI','fredRent','fredMort','r_idio_vol_0','r_idio_vol_1','r_idio_vol_2']},
 'Home-price volatility scaling':{s:['caseShiller','fhfa']},
 'Monthly bond returns':{s:['mTb'],n:'The 7.5-year duration is an approximation for a 10-year Treasury.'},
 'Backtest starting rent':{s:['rp_bea','rp_z1','dlm']},
 'Checked against a published study':{s:['beracha','dlm']},
 'Limits':{s:['damo','shiller','caseShiller','fhfa','fredRent']}};
function mrefHTML(title){const r=MREF[title];if(!r)return '';const a=r.s.filter(k=>SRC[k]).map(k=>`<a target="_blank" rel="noopener" href="${SRC[k].u}">${escapeHtml(SRC[k].t)}</a>`);
  return `<p class="mref"><b>Sources:</b> ${a.join(' · ')}${r.n?(a.length?' — ':'')+r.n:''}</p>`}
function structureMethod(){
  const card=document.getElementById('methodCard');const nodes=[...card.childNodes];const h2=card.querySelector('h2');
  const intro=document.createElement('div');intro.className='mintro';const secs=[];let cur=null;
  nodes.forEach(n=>{if(n===h2)return;if(n.nodeType===1&&n.tagName==='H3'){cur={h:n,body:[]};secs.push(cur);return}if(cur)cur.body.push(n);else intro.appendChild(n)});
  const narrow=matchMedia('(max-width:700px)').matches;
  const groups=['Basics','Owning','Renting','Taxes','Investing','Options','Risk','Data'];
  const html=secs.map((sec,i)=>{const title=sec.h.textContent.trim();const id='m-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return {sec,title,id,meta:MSEC[title]||['Basics','']}});
  const toc=document.createElement('nav');toc.className='mtoc';toc.setAttribute('aria-label','Formula sections');
  toc.innerHTML=`<div class="mtools"><input type="search" id="mfind" placeholder="Filter: PMI, ARM, tax…" aria-label="Filter formula sections"><button type="button" id="mopen">Expand all</button><button type="button" id="mclose">Collapse all</button></div>`+
    `<div class="mchips">${groups.filter(g=>html.some(x=>x.meta[0]===g)).map(g=>`<span class="mg"><span class="mgl">${g}</span>${html.filter(x=>x.meta[0]===g).map(x=>`<a href="#${x.id}" data-sec="${x.id}">${x.title}</a>`).join('')}</span>`).join('')}</div>`;
  card.innerHTML='';card.appendChild(h2);card.appendChild(intro);card.appendChild(toc);
  html.forEach(({sec,title,id,meta},i)=>{const d=document.createElement('details');d.className='msec';d.id=id;if(!narrow||i===0)d.open=true;if(title==='Notation')d.id='notation';
    d.innerHTML=`<summary><span class="mst">${title}</span><span class="mtag">${meta[0]}</span><span class="msum">${meta[1]}</span></summary>`;
    const b=document.createElement('div');b.className='mbody';sec.body.forEach(n=>b.appendChild(n));b.insertAdjacentHTML('beforeend',mrefHTML(title)+`<a href="#methodCard" class="mtop">↑ Contents</a>`);d.appendChild(b);card.appendChild(d)});
  const all=()=>[...card.querySelectorAll('details.msec')];
  card.querySelector('#mopen').onclick=()=>all().forEach(d=>d.open=true);
  card.querySelector('#mclose').onclick=()=>all().forEach(d=>d.open=false);
  card.querySelector('.mchips').addEventListener('click',e=>{const a=e.target.closest('a[data-sec]');if(!a)return;e.preventDefault();const d=document.getElementById(a.dataset.sec)||document.getElementById('notation');d.hidden=false;d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})});
  card.addEventListener('click',e=>{const ml=e.target.closest('a.mlink');if(ml){e.preventDefault();const d=document.getElementById(ml.getAttribute('href').slice(1));if(d){d.hidden=false;d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}return}
    const a=e.target.closest('a[href="#notation"],a.mtop');if(!a)return;e.preventDefault();const t=a.classList.contains('mtop')?card:document.getElementById('notation');if(t.tagName==='DETAILS')t.open=true;t.scrollIntoView({behavior:'smooth',block:'start'})});
  const find=card.querySelector('#mfind');find.addEventListener('input',()=>{const q=find.value.trim().toLowerCase();all().forEach(d=>{const hit=!q||d.textContent.toLowerCase().includes(q);d.hidden=!hit;if(q&&hit)d.open=true});
    card.querySelectorAll('.mchips a').forEach(a=>{const d=document.getElementById(a.dataset.sec)||document.getElementById('notation');a.classList.toggle('dim',!!d&&d.hidden)})});
}
