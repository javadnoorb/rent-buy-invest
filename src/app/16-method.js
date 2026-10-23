/* ===================== Method ===================== */
function buildMethod(){
  document.getElementById('methodCard').innerHTML=`
  <h2>How the model works</h2>
  <p>The model runs month by month for each of the three households (and the optional fourth). Both main households spend the same amount each month: the larger of the owner's cost and the renter's cost. Whichever is cheaper that month invests the difference. Every symbol is defined under the equation where it first appears; the full list is in <a href="#notation" class="src">Notation</a> at the end.</p>

  <h3>Time and growth</h3>
  <p>Months are indexed by \\(t = 1, 2, \\dots\\) and years by \\(y = 0, 1, \\dots, N-1\\). Within year \\(y\\), a yearly growth rate \\(g_y\\) becomes a monthly factor \\((1+g_y)^{1/12}\\); with monthly historical data the actual monthly changes are used instead.</p>
  <dl class="sym"><dt>\\(N\\)</dt><dd>horizon in years (the slider)</dd><dt>\\(g_y\\)</dt><dd>growth rate of a series (home price, rent, stocks, inflation…) in year \\(y\\), as a decimal</dd></dl>

  <h3>Mortgage</h3>
  \\[ \\begin{aligned} L &= P(1-d), \\qquad i = r/12 \\\\ M &= \\frac{L\\,i}{1-(1+i)^{-n}} \\\\ I_t &= B_{t-1}\\,i \\\\ B_t &= B_{t-1} - (M - I_t), \\quad B_0 = L \\end{aligned} \\]
  <dl class="sym"><dt>\\(P\\)</dt><dd>purchase price</dd><dt>\\(d\\)</dt><dd>down payment as a share of the price</dd><dt>\\(L\\)</dt><dd>loan amount</dd><dt>\\(r\\)</dt><dd>annual note rate (after any points)</dd><dt>\\(i\\)</dt><dd>monthly rate</dd><dt>\\(n\\)</dt><dd>number of monthly payments (12 × loan term in years)</dd><dt>\\(M\\)</dt><dd>monthly principal-and-interest payment</dd><dt>\\(I_t\\)</dt><dd>interest paid in month \\(t\\)</dd><dt>\\(B_t\\)</dt><dd>loan balance after month \\(t\\)</dd></dl>

  <h3>Refinancing</h3>
  <p>If the market rate falls far enough below the loan rate, and at least 12 months have passed since the last refinance, the loan is refinanced over its remaining months:</p>
  \\[ \\begin{aligned} &\\text{if } r - m_t \\ge \\Delta_R: \\\\ &\\quad r \\leftarrow m_t, \\quad \\text{cost} = c_R\\,B_t \\\\ &\\quad M \\leftarrow \\frac{B_t\\,m_t/12}{1-(1+m_t/12)^{-(n-t)}} \\end{aligned} \\]
  <dl class="sym"><dt>\\(m_t\\)</dt><dd>market 30-year fixed rate in month \\(t\\): moves linearly from today's rate to your expected later rate \\(\\bar m\\) in the projection, is the actual Freddie Mac rate in the backtest, and is simulated in the Monte Carlo (below)</dd><dt>\\(\\Delta_R\\)</dt><dd>rate drop that triggers a refinance</dd><dt>\\(c_R\\)</dt><dd>refinance cost as a share of the balance, paid in cash</dd></dl>

  <h3>Loan types and points</h3>
  <p>FHA loans:</p>\\[ \\begin{aligned} L &= P(1-d)(1+u_F) \\\\ \\text{MIP}_t &= \\pi_F\\,B_{t-1}/12, \\quad t \\le n_F \\end{aligned} \\]
  <p>ARM resets: the target rate, then the per-reset cap, then the floor and lifetime cap:</p>\\[ \\begin{aligned} \\hat r_k &= \\lfloor x + \\chi \\rceil_{1/8} \\\\ \\bar r_k &= \\min\\big(r_{k-1} + c_k, \\\\ &\\qquad \\max(r_{k-1} - c_k,\\ \\hat r_k)\\big) \\\\ r_k &= \\min\\big(r_0 + c_L,\\ \\max(\\chi,\\ \\bar r_k)\\big) \\end{aligned} \\]
  <p>Points:</p>\\[ \\begin{aligned} r &= r_{quote} - p_n\\,\\Delta_p \\\\ \\text{cash cost} &= \\tfrac{p_n}{100}\\,P(1-d) \\end{aligned} \\]
  <dl class="sym"><dt>\\(u_F\\)</dt><dd>FHA upfront premium, 1.75%, added to the loan</dd><dt>\\(\\pi_F\\)</dt><dd>FHA annual premium: 0.50–0.75% for 30-year loans (by loan size and LTV), 0.15–0.65% for 15-year</dd><dt>\\(n_F\\)</dt><dd>months the premium is charged: 132 (11 years) with at least 10% down, otherwise the whole term</dd><dt>\\(r_0\\)</dt><dd>ARM starting rate, fixed for 5 or 7 years; resets then happen every 6 months</dd><dt>\\(x\\)</dt><dd>ARM index (30-day SOFR in practice; the model uses the T-bill rate in each scenario)</dd><dt>\\(\\chi\\)</dt><dd>ARM margin over the index (also the rate floor)</dd><dt>\\(c_k\\)</dt><dd>cap on the change at reset \\(k\\): 2 points at the first reset of a 5/6 ARM (5 points for 7/6), then 1 point</dd><dt>\\(c_L\\)</dt><dd>lifetime cap over the starting rate, 5 points</dd><dt>\\(\\lfloor\\cdot\\rceil_{1/8}\\)</dt><dd>rounding to the nearest 1/8 point</dd><dt>\\(r_{quote}\\)</dt><dd>rate before points</dd><dt>\\(p_n\\)</dt><dd>number of discount points</dd><dt>\\(\\Delta_p\\)</dt><dd>rate reduction per point</dd></dl>
  <p>Refinancing an ARM switches it to a fixed rate. A planned move to a new home uses a conventional fixed loan. Points are deducted in the purchase year if you itemize; the renter invests the same cash.</p>

  <h3>Owner's monthly cost</h3>
  \\[ \\begin{aligned} C^{own}_t = {}& M + \\text{MIP}_t + \\text{PMI}_t \\\\ &+ \\tfrac{1}{12}\\big(\\tau_p A_y + \\psi H_y \\epsilon_y + \\text{Ins}_y\\big) \\\\ &+ \\text{HOA}_y + U_y + \\text{Refi}_t \\\\ &- R^{hh,net}_t - \\mathbb{1}_{\\text{Dec}}\\,S_y \\end{aligned} \\]
  <dl class="sym"><dt>\\(H_y\\)</dt><dd>home market value at the start of year \\(y\\)</dd><dt>\\(A_y\\)</dt><dd>assessed value for property tax: equal to \\(H_y\\), or with an assessment cap \\(a\\), \\(A_y = \\min\\big(H_y,\\ A_{y-1}(1+\\min(g^{home}_{y-1}, a))\\big)\\)</dd><dt>\\(\\tau_p\\)</dt><dd>effective property tax rate</dd><dt>\\(\\psi\\)</dt><dd>maintenance as a share of home value per year</dd><dt>\\(\\epsilon_y\\)</dt><dd>upkeep shock: 1 in the projection; in the Monte Carlo a gamma draw with mean 1 and coefficient of variation ${MAINT_CV}, so repairs arrive in lumps</dd><dt>\\(\\text{Ins}_y\\)</dt><dd>homeowners plus flood/earthquake insurance, growing at inflation plus \\(g_{ins}\\) per year</dd><dt>\\(\\text{HOA}_y,\\ U_y\\)</dt><dd>HOA dues and extra owner utilities per month, growing with inflation</dd><dt>\\(\\text{PMI}_t\\)</dt><dd>\\(p_{mi}L/12\\) while \\(B_t > 0.78P\\) and \\(d \\lt 20\\%\\) (conventional loans; \\(p_{mi}\\) is the PMI rate)</dd><dt>\\(\\text{Refi}_t\\)</dt><dd>refinance cost in the month it happens</dd><dt>\\(R^{hh,net}_t\\)</dt><dd>house-hacking rent after vacancy and its tax (below); 0 if none</dd><dt>\\(\\mathbb{1}_{\\text{Dec}}\\)</dt><dd>1 in December, else 0: the year's tax saving is credited once</dd><dt>\\(S_y\\)</dt><dd>tax saving from owning in year \\(y\\) (below)</dd></dl>

  <h3>Renter's monthly cost</h3>
  \\[ \\begin{aligned} C^{rent}_t = {}& R_y + \\tfrac{1}{12}\\,\\text{Ins}^{r}_y \\\\ &+ \\tfrac{1}{12}\\,\\eta\\,(c_{mv} + b\\,R^{mkt}_y) \\end{aligned} \\]
  \\[ \\begin{aligned} R^{mkt}_{y+1} &= R^{mkt}_y(1+g^{rent}_y) \\\\ R_0 &= R^{mkt}_0 \\\\ R_{y+1} &= (1-\\eta)\\,R_y\\,(1+g^{rent}_y-\\delta) \\\\ &\\quad + \\eta\\,R^{mkt}_{y+1} \\end{aligned} \\]
  <dl class="sym"><dt>\\(R_y\\)</dt><dd>the renter's lease rent per month in year \\(y\\)</dd><dt>\\(R^{mkt}_y\\)</dt><dd>market rent for a comparable home (starts at your comparable rent)</dd><dt>\\(g^{rent}_y\\)</dt><dd>market rent growth</dd><dt>\\(\\delta\\)</dt><dd>how much slower renewals grow than market rent (0 = lease tracks market)</dd><dt>\\(\\eta\\)</dt><dd>share of renters who move each year; a move resets the lease to market rent</dd><dt>\\(c_{mv}\\)</dt><dd>cost per move (grows with inflation)</dd><dt>\\(b\\)</dt><dd>broker fee per move, in months of rent</dd><dt>\\(\\text{Ins}^{r}_y\\)</dt><dd>renter's insurance per year</dd></dl>

  <h3>Equal budgets</h3>
  \\[ \\begin{aligned} \\Delta_t &= C^{own}_t - C^{rent}_t \\\\ \\text{renter invests } & a\\max(\\Delta_t,0) \\\\ \\text{buyer invests } & a\\max(-\\Delta_t,0) \\end{aligned} \\]
  <dl class="sym"><dt>\\(\\Delta_t\\)</dt><dd>how much more owning costs than renting in month \\(t\\)</dd><dt>\\(a\\)</dt><dd>share of the monthly difference actually invested (1 = all of it; the rest is spent)</dd></dl>
  <p>At the start the renter invests the cash the buyer spends: \\(C_0 = P(d + c) + \\text{move-in costs} + \\text{points cost}\\).</p>

  <h3>Federal and state tax saving</h3>
  \\[ \\begin{aligned} S_y &= \\mu_y\\,\\big(D^{1}_y - D^{0}_y\\big) \\\\ &\\quad + \\mathbb{1}_{st}\\,t_s\\,(I^{ded}_y + \\tau_pA_y) \\\\ D^{1}_y &= \\max\\big(D^{std}_y,\\ \\min(\\text{SALT}_y,\\ T^{st}+\\tau_pA_y) \\\\ &\\qquad\\quad + I^{ded}_y + O\\big) \\\\ D^{0}_y &= \\max\\big(D^{std}_y,\\ \\min(\\text{SALT}_y,\\ T^{st}) \\\\ &\\qquad\\quad + O\\big) \\end{aligned} \\]
  <dl class="sym"><dt>\\(D^{1}_y,\\ D^{0}_y\\)</dt><dd>deductions with and without owning: itemized or standard, whichever is larger</dd><dt>\\(\\mu_y\\)</dt><dd>federal marginal tax rate (from income and 2026 brackets in automatic mode)</dd><dt>\\(D^{std}_y\\)</dt><dd>standard deduction ($16,100 single, $32,200 joint in 2026), indexed to inflation</dd><dt>\\(\\text{SALT}_y\\)</dt><dd>state-and-local-tax deduction cap: $40,400 in 2026, +1% a year through 2029, $10,000 from 2030; above $505,000 of income it shrinks by 30% of the excess, to a $10,000 floor</dd><dt>\\(T^{st}\\)</dt><dd>your state and local income tax per year</dd><dt>\\(I^{ded}_y\\)</dt><dd>deductible mortgage interest: interest paid in year \\(y\\) times \\(\\min(1, \\$750{,}000/L)\\), plus points in the purchase year</dd><dt>\\(O\\)</dt><dd>other itemized deductions</dd><dt>\\(t_s\\)</dt><dd>your state tax rate on investment income</dd><dt>\\(\\mathbb{1}_{st}\\)</dt><dd>1 if your state lets you deduct mortgage interest and property tax, else 0</dd></dl>
  <p>With house-hacking, only the share \\((1-z)\\) of interest and property tax enters the itemized deductions.</p>

  <h3>Investment returns, taxes and leverage</h3>
  \\[ \\begin{aligned} g_t &= w_s r^{stk}_t + w_b r^{bond}_t + w_c r^{bill}_t \\\\ \\rho_t &= \\lambda g_t - \\tfrac{f}{12} \\\\ &\\quad - (\\lambda-1)\\big(r^{bill}_t + \\tfrac{s_b}{12}\\big) \\end{aligned} \\]
  \\[ W^{liq} = V - \\kappa_y \\max(0,\\ V - \\text{basis}) \\]
  <dl class="sym"><dt>\\(w_s, w_b, w_c\\)</dt><dd>portfolio weights in stocks, bonds and T-bills (sum to 1)</dd><dt>\\(r^{stk}_t, r^{bond}_t, r^{bill}_t\\)</dt><dd>monthly total returns of stocks, bonds and T-bills</dd><dt>\\(g_t\\)</dt><dd>unlevered portfolio return in month \\(t\\)</dd><dt>\\(\\lambda\\)</dt><dd>leverage on the portfolio (1 = none)</dd><dt>\\(s_b\\)</dt><dd>borrowing spread over the T-bill rate, per year</dd><dt>\\(f\\)</dt><dd>fund fees per year</dd><dt>\\(\\rho_t\\)</dt><dd>net portfolio return in month \\(t\\), before tax</dd><dt>\\(V\\)</dt><dd>portfolio value</dd><dt>\\(\\text{basis}\\)</dt><dd>money put in plus income already taxed</dd><dt>\\(\\kappa_y\\)</dt><dd>tax rate on gains and dividends: capital-gains rate + NIIT \\(\\nu_y\\) + state rate \\(t_s\\)</dd><dt>\\(\\nu_y\\)</dt><dd>net investment income tax: 3.8% when income exceeds $200,000 single / $250,000 joint, else 0</dd><dt>\\(W^{liq}\\)</dt><dd>what the portfolio is worth after paying tax on a sale</dd></dl>
  <p>In a taxable account, dividends (yield \\(q\\)) are taxed each year at \\(\\kappa_y\\) and bond and T-bill income at \\(\\mu_y + \\nu_y + t_s\\); taxed income is added to the basis. A sheltered account pays no tax. The T-bill-only path earns \\(r^{bill}_t\\) after ordinary-income tax.</p>

  <h3>Buyer's net worth</h3>
  \\[ \\begin{aligned} W^{buy}_t &= H_t(1-s)\\,\\xi - B_t \\\\ &\\quad + W^{liq}_{buy,t} - \\kappa_y\\,G_t \\\\ G_t &= \\big(H_t(1-s)\\,\\xi - P(1+c) \\\\ &\\qquad - \\Phi - E\\big)^{+} \\end{aligned} \\]
  <dl class="sym"><dt>\\(G_t\\)</dt><dd>taxable gain on the home at sale; \\((z)^{+} = \\max(0, z)\\)</dd><dt>\\(s\\)</dt><dd>selling costs as a share of the price (commissions, fees and seller transfer taxes)</dd><dt>\\(c\\)</dt><dd>buyer closing costs as a share of the price (including buyer transfer taxes)</dd><dt>\\(\\xi\\)</dt><dd>single-house price shock at sale: 1 in the projection; in the Monte Carlo \\(\\exp(\\sigma_h\\varepsilon - \\sigma_h^2/2)\\)</dd><dt>\\(\\Phi\\)</dt><dd>improvements added to the tax basis: a share \\(\\varphi\\) of each year's upkeep</dd><dt>\\(E\\)</dt><dd>home-sale exclusion: $250,000 single, $500,000 joint, if owned at least 2 years</dd><dt>\\(W^{liq}_{buy,t}\\)</dt><dd>the buyer's own portfolio after tax</dd></dl>
  <p>The renter's net worth is \\(W^{inv}_t = W^{liq}_{rent,t}\\). Values in today's dollars divide by cumulative inflation \\(\\prod(1+\\pi_y)\\), where \\(\\pi_y\\) is CPI inflation.</p>

  <h3>Transfer taxes</h3>
  \\[ \\begin{aligned} \\text{flat: } & \\tau\\,X \\\\ \\text{whole-amount: } & \\tau_j\\,X, \\quad a_j \\le X \\lt b_j \\\\ \\text{marginal: } & \\textstyle\\sum_j \\tau_j\\,\\big(\\min(X, b_j) - a_j\\big)^{+} \\end{aligned} \\]
  <dl class="sym"><dt>\\(X\\)</dt><dd>the amount taxed: the price \\(P\\), or the loan \\(L\\) for mortgage-recording taxes</dd><dt>\\(\\tau,\\ \\tau_j\\)</dt><dd>tax rate, or the rate for bracket \\(j\\)</dd><dt>\\(a_j, b_j\\)</dt><dd>lower and upper bounds of bracket \\(j\\)</dd></dl>
  <p>Buyer-paid taxes are added to \\(c\\), seller-paid taxes to \\(s\\); split taxes are divided evenly. First-time-buyer reliefs are not applied.</p>

  <h3>House-hacking</h3>
  \\[ \\begin{aligned} R^{hh,net}_t &= R^{hh}_y(1-v_h) \\\\ &\\quad - \\tfrac{1}{12}(\\mu_y + t_s)\\,Q_y^{+} \\\\ Q_y &= 12R^{hh}_y(1-v_h) - z\\,K_y \\\\ K_y &= I_y + \\tau_pA_y + \\text{Ins}_y \\\\ &\\quad + (1-\\varphi)\\psi H_y + 12U_y \\end{aligned} \\]
  <dl class="sym"><dt>\\(Q_y,\\ K_y\\)</dt><dd>yearly taxable rental income; yearly owner costs before the rented share \\(z\\) is taken</dd><dt>\\(R^{hh}_y\\)</dt><dd>monthly rent from the rented part of the home, growing with market rent</dd><dt>\\(v_h\\)</dt><dd>vacancy rate</dd><dt>\\(z\\)</dt><dd>share of the home rented out</dd><dt>\\(I_y\\)</dt><dd>mortgage interest paid in year \\(y\\)</dd></dl>
  <p>Depreciation is not claimed, so no recapture applies at sale ${RES.hhTax&&RES.hhTax.u?linkTo(RES.hhTax.u,'(IRS Pub 523)'):''}.</p>

  <h3>Rent + rental property</h3>
  \\[ \\begin{aligned} P_R &= C_0/(d_R + c) \\\\ R^{R}_y &= \\frac{P_R}{P}\\,R_0\\,\\frac{R^{mkt}_y}{R^{mkt}_0} \\\\ \\text{collected}_y &= R^{R}_y(1-v_R)(1-f_m) \\end{aligned} \\]
  \\[ \\begin{aligned} \\text{taxable}_y = {}& 12\\,\\text{collected}_y - I^{R}_y \\\\ & - \\tau_p H^R_y - \\text{Ins}^R_y \\\\ & - 12\\,\\text{HOA}^R_y - (1-\\varphi)\\psi H^R_y \\\\ & - P_R(1+c)(1-\\ell)/27.5 \\end{aligned} \\]
  <dl class="sym"><dt>\\(C_0\\)</dt><dd>the same starting cash the renter invests</dd><dt>\\(d_R\\)</dt><dd>down payment on the rental</dd><dt>\\(P_R,\\ H^R_y\\)</dt><dd>rental purchase price and its value in year \\(y\\) (grows like your home)</dd><dt>\\(R^{R}_y\\)</dt><dd>its gross monthly rent, at your price-to-rent ratio</dd><dt>\\(v_R,\\ f_m\\)</dt><dd>rental vacancy and management fee</dd><dt>\\(I^R_y\\)</dt><dd>interest on the rental's 30-year loan at your rate plus the investment-property premium</dd><dt>\\(\\text{Ins}^R_y,\\ \\text{HOA}^R_y\\)</dt><dd>your insurance and HOA scaled by \\(P_R/P\\)</dd><dt>\\(\\ell\\)</dt><dd>land share of the price (not depreciable); buildings depreciate over 27.5 years</dd></dl>
  <p>Losses offset up to $25,000 of other income, phasing out between $100,000 and $150,000 of income; the rest is suspended and released at sale. At sale, gain up to accumulated depreciation is taxed at \\(\\min(25\\%, \\mu_y) + \\nu_y + t_s\\), the rest at \\(\\kappa_y\\) ${RES.dep&&RES.dep.u?linkTo(RES.dep.u,'(IRS Pub 527)'):''}. This household invests the same monthly surplus as the renter plus the rental's cash flow, borrowing at the T-bill rate + 3 points if its portfolio runs negative.</p>

  <h3>Income growth and affordability</h3>
  \\[ \\text{Inc}_y = \\text{Inc}_0\\,(1+g_I)^y \\]
  <dl class="sym"><dt>\\(\\text{Inc}_y\\)</dt><dd>household income in year \\(y\\)</dd><dt>\\(g_I\\)</dt><dd>income growth per year</dd></dl>
  <p>In automatic mode \\(\\mu_y\\) is the bracket for \\(\\text{Inc}_y / \\prod(1+\\pi)\\) (brackets are inflation-indexed); the SALT phase-out and NIIT threshold use \\(\\text{Inc}_y\\). Affordability: front-end ratio = month-1 owning cost ÷ monthly gross income; back-end adds other debt payments. Guidelines are at most 28% and 36%, with most lenders capping total debt near 43% (${linkTo(AFF_URL,'Bankrate')}).</p>

  <h3>Planned move</h3>
  <p>At the start of the move year the buyer sells as in the net-worth formula. <em>Sell and buy again:</em> the next home costs what the old one sold for, closing costs are paid again, all remaining equity becomes the down payment, and a new 30-year fixed loan is taken at \\(m_t\\) then (PMI if under 20% down; the 2-year exclusion clock restarts). <em>Sell and rent:</em> proceeds go into the buyer's portfolio and the household pays market rent from then on. Both households move, so moving costs common to both are left out; the renter's lease resets to market.</p>

  <p>A sale that brings in less than the mortgage leaves a shortfall. It is held as a negative balance that grows at the T-bill rate plus 3 points a year, \\(V_{t+1} = V_t\\,(1 + r^{bill}_t + 0.03/12)\\) while \\(V_t \\lt 0\\), and later savings pay it down before anything is invested.</p>

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
  <dl class="sym"><dt>\\(J\\)</dt><dd>block length: blocks of \\(J\\) consecutive historical years are drawn with replacement, keeping all series from the same years together</dd><dt>\\(x_j\\)</dt><dd>a series' historical value in sampled year \\(j\\)</dd><dt>\\(\\overline{\\ln(1+x)}\\)</dt><dd>its historical average log growth</dd><dt>\\(\\bar g\\)</dt><dd>your assumption for that series; with re-centering the simulated geometric mean equals it</dd><dt>\\(\\sigma_h,\\ \\varepsilon\\)</dt><dd>single-house price volatility and a standard normal draw (used in \\(\\xi\\), or compounded yearly if you choose that model)</dd><dt>\\(m_y\\)</dt><dd>simulated market mortgage rate, in percentage points, kept within 2–20</dd><dt>\\(\\bar m\\)</dt><dd>your expected later rate</dd><dt>\\(\\theta\\)</dt><dd>pull-back speed toward \\(\\bar m\\), fitted on 1973–2025: ${RATE_AR.theta}</dd><dt>\\(\\beta_\\pi\\)</dt><dd>effect of a change in inflation on the rate: ${RATE_AR.beta}</dd><dt>\\(e_y\\)</dt><dd>residual from the same sampled year (normal with s.d. ${RATE_AR.sd} points for years before 1973)</dd><dt>\\(\\pi_y\\)</dt><dd>CPI inflation in year \\(y\\)</dd></dl>

  <h3>Risk adjustment</h3>
  \\[ \\begin{aligned} CE &= \\big(\\mathbb{E}[W^{1-\\gamma}]\\big)^{1/(1-\\gamma)}, \\quad \\gamma \\ne 1 \\\\ CE &= \\exp\\big(\\mathbb{E}[\\ln W]\\big), \\quad \\gamma = 1 \\end{aligned} \\]
  <dl class="sym"><dt>\\(CE\\)</dt><dd>certainty equivalent: the sure amount worth as much to you as the uncertain outcome</dd><dt>\\(W\\)</dt><dd>simulated net worth at the horizon, floored at 1% of the starting cash</dd><dt>\\(\\gamma\\)</dt><dd>relative risk aversion (0 = risk-neutral)</dd><dt>\\(\\mathbb{E}\\)</dt><dd>average across simulated futures</dd></dl>

  <h3>Home-price volatility scaling</h3>
  \\[ \\begin{aligned} g'_y &= \\bar g_{loc} + k_v\\,(g_y - \\bar g_{loc}) \\\\ k_v &= \\sigma_{CS}/\\sigma_{FHFA} \\end{aligned} \\]
  <dl class="sym"><dt>\\(g_y,\\ g'_y\\)</dt><dd>a location's FHFA yearly price change, before and after scaling</dd><dt>\\(\\bar g_{loc}\\)</dt><dd>its average yearly change</dd><dt>\\(\\sigma_{CS},\\ \\sigma_{FHFA}\\)</dt><dd>standard deviations of yearly changes in the Case-Shiller and FHFA indexes, 1992–2025</dd><dt>\\(k_v\\)</dt><dd>ratio stored per location (median 1.09; San Francisco and Atlanta 1.37)</dd></dl>
  ${MONTHLY?`<h3>Monthly bond returns</h3>
  \\[ r^{bond}_t \\approx \\frac{Y_{t-1}}{12} - D_b\\,(Y_t - Y_{t-1}) \\]
  <dl class="sym"><dt>\\(Y_t\\)</dt><dd>10-year Treasury yield in month \\(t\\) (decimal)</dd><dt>\\(D_b\\)</dt><dd>bond duration, 7.5 years</dd></dl>`:''}

  <h3>Limits</h3>
  <ul>
    <li>Rent indexes track existing leases and move more slowly than asking rents (see the Data tab). Pre-1940s rent data are sparse; three missing December values (1934, 1935, 1946) are interpolated.</li>
    <li>The national real-estate series is Shiller's reconstruction for 1928–1986 and Case-Shiller National for 1987–1991, as published by Damodaran. From 1992 it is FHFA's U.S. purchase-only index, December to December, with its swings scaled to Case-Shiller's size by one stored ratio (see volatility scaling). Metro and monthly national home prices are FHFA's purchase-only indexes from 1991.</li>
    <li>No rent control, and no value placed on stability, control over the home, or the flexibility of renting. Bond total returns are taxed as income in the year earned. Margin interest and mortgage-insurance premiums are not deducted.</li>
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
  <tr><td>\\(H_y, A_y, a\\)</td><td>home value, assessed value, assessment cap</td><td>Assessment growth cap</td></tr>
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
  <tr><td>\\(\\Phi, \\varphi, E\\)</td><td>basis from improvements, improvement share, sale exclusion</td><td>Share of upkeep that is improvements</td></tr>
  <tr><td>\\(R^{hh}_y, v_h, z\\)</td><td>house-hack rent, vacancy, share rented</td><td>House-hack</td></tr>
  <tr><td>\\(P_R, d_R, v_R, f_m, \\ell\\)</td><td>rental price, down payment, vacancy, management fee, land share</td><td>Other ways to own</td></tr>
  <tr><td>\\(\\text{Inc}_y, g_I\\)</td><td>income and its growth</td><td>Household income, Income growth</td></tr>
  <tr><td>\\(T, h, k_s, \\phi_f\\)</td><td>holding period, move probability, bad-year multiplier, forced-sale discount</td><td>Life &amp; risk preferences</td></tr>
  <tr><td>\\(J, \\bar g, \\theta, \\beta_\\pi, e_y, \\pi_y\\)</td><td>block length, assumed growth, rate pull-back, inflation effect, residual, inflation</td><td>Monte Carlo settings</td></tr>
  <tr><td>\\(CE, \\gamma\\)</td><td>certainty equivalent, risk aversion</td><td>Risk aversion</td></tr>
  <tr><td>\\(k_v\\)</td><td>FHFA-to-Case-Shiller volatility ratio</td><td>Scale FHFA price swings</td></tr>
  </tbody></table></div>

  `;
  structureMethod();
  document.getElementById('srclist').innerHTML=Object.values(SRC).map(s=>`<li><a target="_blank" rel="noopener" href="${s.u}">${s.t}</a></li>`).join('')+
    METROS.filter(m=>m.slug!=='us'&&!m.county).map(m=>`<li>${m.name}: ${['price','rent','ptax','ins','hpi'].map(k=>m.src&&m.src[k]?`<a target="_blank" rel="noopener" href="${m.src[k].u}">${({price:'price',rent:'rent',ptax:'property tax',ins:'insurance',hpi:'home-price index'})[k]}</a>`:null).filter(Boolean).join(' · ')}</li>`).join('');
}
function typeset(el,tries=0){if(window.MathJax&&MathJax.typesetPromise){MathJax.typesetPromise([el]).catch(()=>{})}else if(tries<40)setTimeout(()=>typeset(el,tries+1),250)}


/* Formula page layout: sections become collapsible cards with a one-line summary, a sticky contents bar and a filter. */
const MSEC={
 'Time and growth':['Basics','How yearly rates become monthly steps.'],
 'Mortgage':['Owning','Loan size, monthly payment and how the balance falls.'],
 'Refinancing':['Owning','When the buyer refinances and what it costs.'],
 'Loan types and points':['Owning','FHA premiums, ARM resets and buying down the rate.'],
 "Owner's monthly cost":['Owning','Everything the owner pays each month.'],
 "Renter's monthly cost":['Renting','Lease rent, renter\'s insurance and moving costs.'],
 'Equal budgets':['Basics','Both households spend the same; the cheaper one invests the difference.'],
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
 'Limits':['Basics','What the model leaves out.'],
 'Notation':['Basics','Every symbol, with the setting it comes from.'],
};
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
    const b=document.createElement('div');b.className='mbody';sec.body.forEach(n=>b.appendChild(n));b.insertAdjacentHTML('beforeend',`<a href="#methodCard" class="mtop">↑ Contents</a>`);d.appendChild(b);card.appendChild(d)});
  const all=()=>[...card.querySelectorAll('details.msec')];
  card.querySelector('#mopen').onclick=()=>all().forEach(d=>d.open=true);
  card.querySelector('#mclose').onclick=()=>all().forEach(d=>d.open=false);
  card.querySelector('.mchips').addEventListener('click',e=>{const a=e.target.closest('a[data-sec]');if(!a)return;e.preventDefault();const d=document.getElementById(a.dataset.sec)||document.getElementById('notation');d.hidden=false;d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})});
  card.addEventListener('click',e=>{const a=e.target.closest('a[href="#notation"],a.mtop');if(!a)return;e.preventDefault();const t=a.classList.contains('mtop')?card:document.getElementById('notation');if(t.tagName==='DETAILS')t.open=true;t.scrollIntoView({behavior:'smooth',block:'start'})});
  const find=card.querySelector('#mfind');find.addEventListener('input',()=>{const q=find.value.trim().toLowerCase();all().forEach(d=>{const hit=!q||d.textContent.toLowerCase().includes(q);d.hidden=!hit;if(q&&hit)d.open=true});
    card.querySelectorAll('.mchips a').forEach(a=>{const d=document.getElementById(a.dataset.sec)||document.getElementById('notation');a.classList.toggle('dim',!!d&&d.hidden)})});
}
