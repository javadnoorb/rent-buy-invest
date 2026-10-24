/* ===================== Equations: one registry for the Method tab and the trace ===================== */
/* Every equation a trace node uses, in the Method tab's notation: t is the TeX, s the Method section it belongs to.
   The Method tab builds its main equation blocks from these entries (eqLines) and lists all of them in its Equation
   index, so the panel's equations and the Method tab's are the same text. tests/trace.js fails on a node whose
   equation is missing here, an entry no trace or Method block uses, or an entry whose section does not exist. */
const EQ={
  // time and growth
  perMonth:{t:String.raw`g^{m}_y = (1+g_y)^{1/12} - 1`,s:'time-and-growth'},
  compound12:{t:String.raw`g_y = \textstyle\prod_{m=1}^{12}(1+g_m) - 1`,s:'time-and-growth'},
  onePlus:{t:String.raw`1 + g_y`,s:'time-and-growth'},
  cpi:{t:String.raw`\Pi_t = \textstyle\prod_{k=0}^{t-1}(1+\pi_k)`,s:'time-and-growth'},
  cpiMid:{t:String.raw`\bar\Pi_y = \sqrt{\Pi_y\,\Pi_{y+1}}`,s:'time-and-growth'},
  real:{t:String.raw`W^{today} = W_t / \Pi_t`,s:'time-and-growth'},
  sumYears:{t:String.raw`X = \textstyle\sum_y X_y`,s:'time-and-growth'},
  moveAdd:{t:String.raw`V'_y = V_y + \text{cash from the move}`,s:'planned-move'},
  sum12:{t:String.raw`X_y = \textstyle\sum_{m=1}^{12} x_m`,s:'time-and-growth'},
  avg12:{t:String.raw`\bar x_y = \tfrac{1}{12}\textstyle\sum_{m=1}^{12} x_m`,s:'time-and-growth'},
  recenter:{t:String.raw`\tilde x_j = \exp\big(\ln(1+x_j) - \overline{\ln(1+x)} + \ln(1+\bar g)\big) - 1`,s:'monte-carlo'},
  rateGlide:{t:String.raw`m_y = r_{quote} + (\bar m - r_{quote})\,\min(1,\ y/T_g)`,s:'refinancing'},
  // mortgage
  loan:{t:String.raw`L = P(1-d)`,s:'mortgage'},
  monthlyRate:{t:String.raw`i = r/12`,s:'mortgage'},
  payment:{t:String.raw`M = \frac{L\,i}{1-(1+i)^{-n}}`,s:'mortgage'},
  interest:{t:String.raw`I_t = B_t\,i`,s:'mortgage'},
  principal:{t:String.raw`\text{Prin}_t = \min(M - I_t,\ B_t)`,s:'mortgage'},
  paySplit:{t:String.raw`M_t = I_t + \text{Prin}_t`,s:'mortgage'},
  balanceMonth:{t:String.raw`B_t = B_{t-1} - \text{Prin}_{t-1} - X_{t-1}, \quad B_0 = L`,s:'mortgage'},
  balanceYear:{t:String.raw`B_t = L - \textstyle\sum_y \text{Prin}_y - \sum_y X_y`,s:'mortgage'},
  prepay:{t:String.raw`X_t = \min(E,\ B_t - \text{Prin}_t)`,s:'extra-payments-pmi-removal-gains-tax-and-home-equity-line'},
  // refinancing and loan types
  refiRate:{t:String.raw`r \leftarrow m_t + a_c`,s:'refinancing'},
  refiCost:{t:String.raw`\text{Refi}_t = c_R\,B_t`,s:'refinancing'},
  loanFHA:{t:String.raw`L = P(1-d)(1+u_F)`,s:'loan-types-and-points'},
  mip:{t:String.raw`\text{MI}_t = \pi_F\,B_t/12 \quad \text{(FHA)}`,s:'loan-types-and-points'},
  armQuote:{t:String.raw`r_{quote} = r - (r_{30} - r_{ARM})`,s:'loan-types-and-points'},
  armReset:{t:String.raw`r_k = \min\big(r_0 + c_L,\ \max(\chi,\ \min(r_{k-1} + c_k,\ \max(r_{k-1} - c_k,\ \lfloor x + \chi \rceil_{1/8})))\big)`,s:'loan-types-and-points'},
  rate0:{t:String.raw`r_0 = \max(0,\ r_{quote} + a_c - p_n\,\Delta_p)`,s:'loan-types-and-points'},
  llpa:{t:String.raw`a_c = \big(\text{LLPA}(score, LTV) - \text{LLPA}(760\text{–}779, 80\%)\big)\,\Delta_p`,s:'loan-types-and-points'},
  ptsCost:{t:String.raw`\text{points cost} = \tfrac{p_n}{100}\,P(1-d)`,s:'loan-types-and-points'},
  // owner's costs
  ownCost:{t:String.raw`C^{own}_t = M_t + E + \tfrac{1}{12}\big(\tau_p A_y + \psi H_y \epsilon_y\big) + \tfrac{1}{12}\text{Ins}_y + \text{HOA}_y + U_y + \text{PMI}_t + \text{Refi}_t - R^{hh}_y - \mathbb{1}_{\text{Dec}}(S_y - T^{hh}_y)`,s:'owner-s-monthly-cost'},
  home:{t:String.raw`H_t = P\textstyle\prod_{k=0}^{t-1}(1+g^{home}_k)`,s:'owner-s-monthly-cost'},
  ptax:{t:String.raw`T^{prop}_y = \max\big(0,\ \tau_p \max(0,\ A_y - e_h) - k_h\big)`,s:'owner-s-monthly-cost'},
  assess:{t:String.raw`A_y = H_y`,s:'owner-s-monthly-cost'},
  assessBuy:{t:String.raw`A_y = \text{purchase price}`,s:'owner-s-monthly-cost'},
  assessCap:{t:String.raw`A_y = \min(H_y,\ F_y)`,s:'owner-s-monthly-cost'},
  assessBase:{t:String.raw`F_y = F_{y-1}\,\big(1 + \min(a,\ \pi_{y-1}^{+})\big)`,s:'owner-s-monthly-cost'},
  maint:{t:String.raw`\text{Upkeep}_y = \psi\,H_y\,\epsilon_y`,s:'owner-s-monthly-cost'},
  ins:{t:String.raw`\tfrac{1}{12}\text{Ins}_y = (\text{ins} + \text{flood})\,\iota_y / 12`,s:'owner-s-monthly-cost'},
  insIdx:{t:String.raw`\iota_y = \textstyle\prod_{k=0}^{y-1}(1 + \pi_k + g_{ins})`,s:'owner-s-monthly-cost'},
  byInfl:{t:String.raw`x_y = x_0\,\Pi_y`,s:'owner-s-monthly-cost'},
  perMo:{t:String.raw`x^{month} = x^{year}/12`,s:'owner-s-monthly-cost'},
  pmi:{t:String.raw`\text{MI}_t = \text{rate}_{PMI}\,L/12 \quad \text{while } d \lt 20\%,\ B_{t-1} \gt 0.78P`,s:'owner-s-monthly-cost'},
  pmiRate:{t:String.raw`\text{rate}_{PMI} = \text{pmi} \times k_{score} \times \text{coverage}/35`,s:'owner-s-monthly-cost'},
  // renter's costs
  rentCost:{t:String.raw`C^{rent}_t = R_y + \tfrac{1}{12}\text{Ins}^r_y + \tfrac{1}{12}\eta\,(c_{mv} + b\,R^{mkt}_y)`,s:'renter-s-monthly-cost'},
  lease:{t:String.raw`R_y = (1-\eta)\,R_{y-1}\,(1+g^{rent}_{y-1}-\delta) + \eta\,R^{mkt}_y`,s:'renter-s-monthly-cost'},
  marketRent:{t:String.raw`R^{mkt}_y = R_0\textstyle\prod_{k=0}^{y-1}(1+g^{rent}_k)`,s:'renter-s-monthly-cost'},
  rins:{t:String.raw`\tfrac{1}{12}\text{Ins}^r_y = \text{Ins}^r_0\,\Pi_y/12`,s:'renter-s-monthly-cost'},
  moves:{t:String.raw`\tfrac{1}{12}\eta\,(c_{mv}\Pi_y + b\,R^{mkt}_y)`,s:'renter-s-monthly-cost'},
  // equal budgets
  delta:{t:String.raw`\Delta_t = C^{own}_t - C^{rent}_t`,s:'equal-budgets'},
  investR:{t:String.raw`\text{added}_t = a\max(\Delta_t, 0)`,s:'equal-budgets'},
  investB:{t:String.raw`\text{added}_t = a\max(-\Delta_t, 0)`,s:'equal-budgets'},
  investBx:{t:String.raw`\text{added}_t = a\max(-\Delta_t, 0) + (E - X_t)`,s:'equal-budgets'},
  extraInvest:{t:String.raw`E - X_t`,s:'extra-payments-pmi-removal-gains-tax-and-home-equity-line'},
  cash0:{t:String.raw`C_0 = P(d + c) + \text{move-in} + \text{points cost}`,s:'equal-budgets'},
  budget:{t:String.raw`\text{budget}_y = \max\big(\bar C^{own}_y,\ C^{rent}_y\big)`,s:'equal-budgets'},
  // taxes
  taxSave:{t:String.raw`S_y = \mu_y\,(D^{1}_y - D^{0}_y) + \mathbb{1}_{st}\,t_s\,(f_{750}I_y + T^{prop}_y)(1-z)`,s:'federal-and-state-tax-saving'},
  dOwn:{t:String.raw`D^{1}_y = \max\big(D^{std}_y,\ \min(\text{SALT}_y,\ T^{st}_y + T^{prop}_y(1-z)) + (f_{750}I_y + f_{MI}\text{MI}_y + \text{pts}_y)(1-z) + O\big)`,s:'federal-and-state-tax-saving'},
  dRent:{t:String.raw`D^{0}_y = \max\big(D^{std}_y,\ \min(\text{SALT}_y,\ T^{st}_y) + O\big)`,s:'federal-and-state-tax-saving'},
  std:{t:String.raw`D^{std}_y = D^{std}_{2026}\,k_{y_0}\,\Pi_y`,s:'federal-and-state-tax-saving'},
  salt:{t:String.raw`\text{SALT}_y = \max\big(10{,}000,\ 40{,}400\,(1.01)^{y-2026} - 0.3\,(\text{Inc}_y - 505{,}000\,(1.01)^{y-2026})^{+}\big)`,s:'federal-and-state-tax-saving'},
  stTax:{t:String.raw`T^{st}_y = T^{st}_0\,\text{Inc}_y/\text{Inc}_0`,s:'federal-and-state-tax-saving'},
  f750:{t:String.raw`f_{750} = \min\big(1,\ 750{,}000 \times 12 / \textstyle\sum_{t \in y} B_t\big)`,s:'federal-and-state-tax-saving'},
  fMI:{t:String.raw`f_{MI} = \max\big(0,\ 1 - 0.1\,\lceil(\text{Inc}_y - 100{,}000)/1{,}000\rceil\big)`,s:'federal-and-state-tax-saving'},
  bracket:{t:String.raw`\mu_y = \text{bracket}\big(\text{Inc}_y/\Pi_y - D^{std}\big)`,s:'income-growth-and-affordability'},
  ltcgBracket:{t:String.raw`\tau_g = 0,\ 15\%\ \text{or}\ 20\%\ \text{by}\ \text{Inc}_y/\Pi_y - D^{std}`,s:'extra-payments-pmi-removal-gains-tax-and-home-equity-line'},
  niit:{t:String.raw`\nu_y = 3.8\%\ \text{if}\ \text{Inc}_y \gt 200{,}000\ (250{,}000\ \text{joint}),\ \text{else}\ 0`,s:'taxes'},
  ltcgE:{t:String.raw`\kappa_y = \tau_g + \nu_y + t_s`,s:'investment-returns-taxes-and-leverage'},
  muE:{t:String.raw`\mu_y + \nu_y + t_s`,s:'investment-returns-taxes-and-leverage'},
  incGrowth:{t:String.raw`\text{Inc}_y = \text{Inc}_0\,(1+g_I)^y`,s:'income-growth-and-affordability'},
  // investing
  mix:{t:String.raw`g_t = w_s r^{stk}_t + w_b r^{bond}_t + w_c r^{bill}_t`,s:'investment-returns-taxes-and-leverage'},
  rho:{t:String.raw`\rho_t = \lambda g_t - (\lambda-1)\,r^{bill}_t - \tfrac{f}{12} - \max(0,\lambda-1)\tfrac{s_b}{12}`,s:'investment-returns-taxes-and-leverage'},
  tau:{t:String.raw`\tau_t = \lambda\big(w_s\tfrac{q}{12}\kappa_y + (w_b r^{bond}_t + w_c r^{bill}_t)(\mu_y+\nu_y+t_s)\big) + (1-\lambda)^{+} r^{bill}_t(\mu_y+\nu_y+t_s)`,s:'investment-returns-taxes-and-leverage'},
  incPerDollar:{t:String.raw`j_t = \lambda\big(w_s\tfrac{q}{12} + w_b r^{bond}_t + w_c r^{bill}_t\big) + (1-\lambda)^{+} r^{bill}_t`,s:'investment-returns-taxes-and-leverage'},
  return:{t:String.raw`\text{return}_t = V_t\,\rho_t`,s:'investment-returns-taxes-and-leverage'},
  returnCash:{t:String.raw`\text{return}_t = V_t\,r^{bill}_t`,s:'investment-returns-taxes-and-leverage'},
  invTax:{t:String.raw`\text{tax}_t = V_t\,\tau_t`,s:'investment-returns-taxes-and-leverage'},
  taxCash:{t:String.raw`\text{tax}_t = V_t\,r^{bill}_t\,(\mu_y + \nu_y + t_s)`,s:'investment-returns-taxes-and-leverage'},
  ledgerMonth:{t:String.raw`V_t = V_{t-1} + \text{return}_{t-1} - \text{tax}_{t-1} + \text{added}_{t-1}`,s:'investment-returns-taxes-and-leverage'},
  ledger:{t:String.raw`V_t = V_0 + \textstyle\sum \text{returns} - \sum \text{taxes} + \sum \text{added}`,s:'investment-returns-taxes-and-leverage'},
  overdraft:{t:String.raw`\text{overdraft}_t = V_t\,(r^{bill}_t + 0.03/12) \quad \text{while } V_t \lt 0`,s:'planned-move'},
  liquid:{t:String.raw`W^{liq} = V - \kappa_y \max(0,\ V - \text{basis})`,s:'investment-returns-taxes-and-leverage'},
  basis:{t:String.raw`\text{basis}_t = \text{basis}_{t-1} + \text{taxed income}_y + \text{added}_y, \quad y = \text{year } t`,s:'investment-returns-taxes-and-leverage'},
  binc:{t:String.raw`\text{taxed income}_t = V_t\,(j_t - \tau_t)`,s:'investment-returns-taxes-and-leverage'},
  // net worth and the sale
  nwBuy:{t:String.raw`W^{buy}_t = \text{Eq}_t + W^{liq}_{buy,t}`,s:'buyer-s-net-worth'},
  homeNet:{t:String.raw`\text{Eq}_t = H_t(1-s)\,\xi - B_t - T^{sale}_t`,s:'buyer-s-net-worth'},
  saleNet:{t:String.raw`H_t\,\xi\,(1-s)`,s:'buyer-s-net-worth'},
  sell:{t:String.raw`s = s_0 + s_{tt}`,s:'transfer-taxes'},
  close:{t:String.raw`c = c_0 + c_{tt}`,s:'transfer-taxes'},
  gain:{t:String.raw`G_t = H_t(1-s)\,\xi - P(1+c) - \Phi - E`,s:'buyer-s-net-worth'},
  homeBasis:{t:String.raw`\text{basis} = P(1+c)`,s:'buyer-s-net-worth'},
  improve:{t:String.raw`\Phi_t = \varphi \textstyle\sum_y \text{Upkeep}_y`,s:'buyer-s-net-worth'},
  homeTax:{t:String.raw`T^{sale}_t = \kappa_t\,G_t^{+}`,s:'buyer-s-net-worth'},
  nwRent:{t:String.raw`W^{inv}_t = W^{liq}_{rent,t}`,s:'buyer-s-net-worth'},
  nwCash:{t:String.raw`W^{cash}_t = V^{cash}_t`,s:'investment-returns-taxes-and-leverage'},
  nwRental:{t:String.raw`W^{R}_t = \text{rental sale net}_t + W^{liq}_{R,t}`,s:'rent-rental-property'},
  heloc:{t:String.raw`\text{line}_t = \max(0,\ \ell H_t - B_t)`,s:'extra-payments-pmi-removal-gains-tax-and-home-equity-line'},
  // house-hacking and the planned move
  hh:{t:String.raw`R^{hh,net}_y = R^{hh}_0\,(R^{mkt}_y / R_0)\,(1-v_h)`,s:'house-hacking'},
  mktIdx:{t:String.raw`R^{mkt}_y / R_0`,s:'house-hacking'},
  hhTax:{t:String.raw`T^{hh}_y = (\mu_y + t_s)\,Q_y^{+}, \quad Q_y = 12R^{hh,net}_y - z\,K_y`,s:'house-hacking'},
  moveLoan:{t:String.raw`L' = P' - \min\big(P',\ \max(0,\ E_{move} - cP')\big)`,s:'planned-move'},
  moveCash:{t:String.raw`\text{cash} = E_{move} - cP' - \text{down payment}`,s:'planned-move'},
  // chart results built from the parts above
  months:{t:String.raw`\text{months} = W^{liq}_t / \text{budget}_y`,s:'equal-budgets'},
  unrec:{t:String.raw`U^{own}_y = I_y + T^{prop}_y + \text{Upkeep}_y + 12\big(\tfrac{1}{12}\text{Ins}_y + \text{HOA}_y + U_y\big) + \text{MI}_y + \text{Refi}_y - S_y - (12R^{hh,net}_y - T^{hh}_y)`,s:'owner-s-monthly-cost'},
  oppCost:{t:String.raw`\text{forgone return}_y = (H_y - B_y)\,\textstyle\sum_{t \in y}\rho_t`,s:'owner-s-monthly-cost'},
  torDelta:{t:String.raw`\Delta\text{gap} = \text{gap}_N(\text{setting changed}) - \text{gap}_N(\text{your settings})`,s:'where-the-gap-comes-from'},
  argmax:{t:String.raw`d^{*} = \arg\max_d\ \text{gap}_h(d)`,s:'affordability'},
  advPct:{t:String.raw`100\,(W^{buy}_k - W^{rent}_k)/(\Pi_k P)`,s:'backtest-starting-rent'},
  median:{t:String.raw`\text{median over purchase years}`,s:'checked-against-a-published-study'},
  pct:{t:String.raw`100\,r`,s:'mortgage'},
  quantile:{t:String.raw`Q_f = x_{(\lfloor k \rfloor)} + (k - \lfloor k \rfloor)(x_{(\lfloor k \rfloor + 1)} - x_{(\lfloor k \rfloor)}), \quad k = (n-1)f`,s:'monte-carlo'},
  share:{t:String.raw`\Pr(\text{buy wins}) = \#\{\text{futures where buying is ahead}\}/n`,s:'monte-carlo'},
  count:{t:String.raw`\#\{\text{futures in the bin}\}`,s:'monte-carlo'},
  idioYear:{t:String.raw`g^{home}_k = (1+\tilde g^{home}_k)\,e^{\sigma_h\varepsilon_k - \sigma_h^2/2} - 1`,s:'monte-carlo'},
  rhoYear:{t:String.raw`\rho_y = \lambda(w_s r^{stk}_y + w_b r^{bond}_y + w_c r^{bill}_y) - (\lambda-1)r^{bill}_y - \max(0,\lambda-1)s_b - f`,s:'monte-carlo'},
  annualize:{t:String.raw`\big(\exp\big(\tfrac{1}{h}\textstyle\sum_{y \lt h}\ln\max(0.01,\ 1+\rho_y)\big) - 1\big) \times 100`,s:'monte-carlo'},
  compoundData:{t:String.raw`\textstyle\prod_{y}(1 + r_y)`,s:'limits'},
  cpiRatio:{t:String.raw`\text{CPI}_y / \text{CPI}_{1927}`,s:'limits'},
  realOf1:{t:String.raw`\$1 \times \textstyle\prod_y(1+r_y) \,/\, (\text{CPI}_y/\text{CPI}_{1927})`,s:'limits'},
  roll10:{t:String.raw`\exp\big(\tfrac{1}{10}\textstyle\sum_{k=y-9}^{y}\ln\tfrac{1+r_k}{1+\pi_k}\big) - 1`,s:'limits'},
  corr:{t:String.raw`\rho_{ab} = \frac{\sum (a_y-\bar a)(b_y-\bar b)}{\sqrt{\sum (a_y-\bar a)^2 \sum (b_y-\bar b)^2}}`,s:'monte-carlo'},
  realIndex:{t:String.raw`100\,\textstyle\prod_y \tfrac{1+g_y}{1+\pi_y}`,s:'home-price-volatility-scaling'},
  inflation:{t:String.raw`\pi_y = \text{CPI}_y/\text{CPI}_{y-1} - 1`,s:'time-and-growth'},
  realRate:{t:String.raw`m_y - \pi_y`,s:'time-and-growth'},
  liqLine:{t:String.raw`W^{liq}_{buy,t} + \text{line}_t`,s:'extra-payments-pmi-removal-gains-tax-and-home-equity-line'},
  insEtc:{t:String.raw`X^{other}_y = 12\big(\tfrac{1}{12}\text{Ins}_y + \text{HOA}_y + U_y\big) + \text{MI}_y + \text{Refi}_y`,s:'where-the-gap-comes-from'},
  gapTotal:{t:String.raw`\text{gap}_N = W^{buy}_N - W^{inv}_N`,s:'where-the-gap-comes-from'},
  gapSum:{t:String.raw`\textstyle\sum_y x_y / \bar\Pi_y`,s:'where-the-gap-comes-from'},
  gapHome:{t:String.raw`H_N - P`,s:'where-the-gap-comes-from'},
  gapSell:{t:String.raw`-\,s\,H_N`,s:'where-the-gap-comes-from'},
  gapBuy:{t:String.raw`-(cP + \text{move-in} + \text{points})`,s:'where-the-gap-comes-from'},
  gapLoan:{t:String.raw`L - \textstyle\sum_y \text{Prin}_y - B_N`,s:'where-the-gap-comes-from'},
  gapInvTax:{t:String.raw`T^{inv}_R - T^{inv}_B`,s:'where-the-gap-comes-from'},
  gapRest:{t:String.raw`-(G^{R} - G^{B}) = \text{gap}_N - \text{all other parts}`,s:'where-the-gap-comes-from'}};
const eqTex=id=>EQ[id]?EQ[id].t:'';
/* equation entries as one aligned block for the Method tab: "a = b" lines aligned on their first "=" */
const EQ_METHOD=new Set();  // entries the Method tab's blocks use (the registry test counts them as used)
const eqLines=ids=>{ids.forEach(id=>EQ_METHOD.add(id));return `\\[ \\begin{aligned} ${ids.map(id=>eqTex(id).replace(/^([^=]*?)=/,'$1&=').replace(/\\leftarrow/,'&\\leftarrow')).join(' \\\\ ')} \\end{aligned} \\]`};
/* the Equation index section at the end of the Method tab: every entry, by section */
function eqIndexHTML(){const by={};Object.entries(EQ).forEach(([id,e])=>(by[e.s]=by[e.s]||[]).push(id));
  return `<p>Every equation the "How this was computed" panel can show, grouped by the section that explains it.</p>`+Object.entries(by).map(([s,ids])=>`<h4><a href="#m-${s}" class="mlink">${s.replace(/-/g,' ').replace(/\bs\b/g,"'s").replace(/^./,c=>c.toUpperCase())}</a></h4>${ids.map(id=>`<div class="eqi" data-eq="${id}">\\[ ${eqTex(id)} \\]</div>`).join('')}`).join('')}
/* ---- the symbol each part plays in its equation, shown beside the part's row in the panel ----
   EQP[id]: the parts' symbols in the order a node with that equation lists them (an array, or a function of the
   part's position for repeated terms). Parts not covered here use their own equation's left-hand side, or the
   setting's symbol (SETSYM); a sum may also name each part where it is built. tests/trace.js fails on a part with
   no symbol. */
const EQP={cpi:()=>'1+\\pi_k',cpiMid:['\\Pi_y','\\Pi_{y+1}'],avg12:()=>'x_m',
  moveAdd:['V_y','\\text{cash from the move}'],recenter:['x_j','\\ln(1+\\bar g) - \\overline{\\ln(1+x)}'],rateGlide:['r_{quote}','\\bar m','T_g'],
  loan:['P','d'],loanFHA:['P','d','u_F'],monthlyRate:['r'],payment:['L','r','n'],interest:['B_t','i'],principal:['M','I_t','B_t'],paySplit:['I_t','\\text{Prin}_t'],
  balanceMonth:['B_{t-1}','\\text{Prin}_{t-1}','X_{t-1}'],prepay:['E','B_t','\\text{Prin}_t'],refiRate:['m_t','a_c'],refiCost:['c_R','B_t'],
  mip:['\\pi_F','B_t'],armQuote:['r','r_{30}','r_{ARM}'],armReset:['x','\\chi','r_{k-1}','c_k','r_0','c_L'],rate0:['r_{quote}','a_c','p_n','\\Delta_p'],
  llpa:['\\text{LLPA}(score, LTV)','\\text{LLPA}(760\\text{–}779, 80\\%)','\\Delta_p'],ptsCost:['p_n','P(1-d)'],
  home:j=>j?'1+g^{home}_k':'P',ptax:['\\tau_p','A_y','e_h','k_h'],assess:['H_y'],assessBuy:['P'],assessCap:['H_y','F_y'],assessBase:['F_{y-1}','a','\\text{inflation cap on}','\\pi_{y-1}'],
  maint:['\\psi','H_y','\\epsilon_y'],ins:['\\text{ins}','\\text{flood}','\\iota_y'],insIdx:j=>j?'\\pi_k':'g_{ins}',perMo:()=>'x^{year}',
  pmi:['\\text{rate}_{PMI}','L'],pmiRate:['\\text{pmi}','k_{score}','\\text{coverage}'],
  rentCost:['R_y','\\tfrac{1}{12}\\text{Ins}^r_y','\\tfrac{1}{12}\\eta\\,(c_{mv} + b\\,R^{mkt}_y)'],lease:['R_{y-1}','g^{rent}_{y-1}','\\delta','\\eta','R^{mkt}_y'],marketRent:j=>j?'1+g^{rent}_k':'R_0',
  rins:['\\text{Ins}^r_0','\\Pi_y'],moves:['\\eta','c_{mv}','\\Pi_y','b','R^{mkt}_y'],delta:['C^{own}_t','C^{rent}_t'],investR:['a','\\Delta_t'],investB:['a','\\Delta_t'],
  investBx:['a\\max(-\\Delta_t, 0)','E - X_t'],extraInvest:['E','X_t','\\text{payment kept after payoff}'],cash0:['P','d','c','\\text{move-in}','\\text{points cost}'],budget:['\\bar C^{own}_y','C^{rent}_y'],
  taxSave:['\\mu_y','D^{1}_y','D^{0}_y','\\mathbb{1}_{st}','t_s','I_y','f_{750}','T^{prop}_y','(1-z)'],
  dOwn:['D^{std}_y','\\text{SALT}_y','T^{st}_y','T^{prop}_y','(1-z)','I_y','f_{750}','\\text{MI}_y','f_{MI}','\\text{pts}_y','O'],dRent:['D^{std}_y','\\text{SALT}_y','T^{st}_y','O'],
  std:['D^{std}_{2026}','k_{y_0}','\\Pi_y'],salt:['\\text{Inc}_y'],stTax:['T^{st}_0','\\text{Inc}_y','\\text{Inc}_0'],f750:['\\textstyle\\sum_{t \\in y} B_t'],fMI:['\\text{Inc}_y'],bracket:['\\text{Inc}_y','\\Pi_y'],
  ltcgBracket:['\\text{Inc}_y','\\Pi_y'],niit:['\\text{Inc}_y'],ltcgE:['\\tau_g','\\nu_y','t_s'],muE:['\\mu_y','\\nu_y','t_s'],incGrowth:['\\text{Inc}_0','g_I'],
  mix:['w_s','r^{stk}_t','w_b','r^{bond}_t','r^{bill}_t'],rho:['g_t','\\lambda','r^{bill}_t','s_b','f'],tau:['\\lambda','w_s','q','\\kappa_y','w_b','r^{bond}_t','r^{bill}_t','\\mu_y+\\nu_y+t_s'],
  incPerDollar:['\\lambda','w_s','q','w_b','r^{bond}_t','r^{bill}_t'],return:['V_t','\\rho_t'],returnCash:['V_t','r^{bill}_t'],invTax:['V_t','\\tau_t'],taxCash:['V_t','r^{bill}_t','\\mu_y+\\nu_y+t_s'],
  overdraft:['V_t','r^{bill}_t','0.03'],liquid:['V','\\kappa_y','\\text{basis}'],binc:['V_t','j_t','\\tau_t'],
  nwBuy:['\\text{Eq}_t','W^{liq}_{buy,t}'],homeNet:['H_t(1-s)\\,\\xi','B_t','T^{sale}_t'],saleNet:['H_t','\\xi','s'],sell:['s_0','s_{tt}'],close:['c_0','c_{tt}'],
  gain:['H_t(1-s)\\,\\xi','P(1+c)','\\Phi','E'],homeBasis:['P','c'],improve:j=>j?'\\text{Upkeep}_y':'\\varphi',homeTax:['\\kappa_t','G_t'],nwRent:['W^{liq}_{rent,t}'],nwCash:['V^{cash}_t'],
  nwRental:['\\text{rental sale net}_t','W^{liq}_{R,t}'],heloc:['\\ell','H_t','B_t'],liqLine:['W^{liq}_{buy,t}','\\text{line}_t'],hh:['R^{hh}_0','R^{mkt}_y/R_0','v_h'],mktIdx:['R^{mkt}_y','R_0'],
  hhTax:['R^{hh,net}_y','z','I_y','T^{prop}_y','\\tfrac{1}{12}\\text{Ins}_y','\\text{Upkeep}_y','\\varphi','U_y','\\mu_y','t_s'],moveLoan:["P'",'E_{move}','c'],moveCash:['E_{move}',"P'",'c'],
  months:['W^{liq}_t','\\text{budget}_y'],unrec:['I_y','T^{prop}_y','\\text{Upkeep}_y','\\tfrac{1}{12}\\text{Ins}_y','\\text{HOA}_y','U_y','\\text{MI}_y','\\text{Refi}_y','S_y','R^{hh,net}_y','T^{hh}_y'],
  insEtc:['\\tfrac{1}{12}\\text{Ins}_y','\\text{HOA}_y','U_y','\\text{MI}_y','\\text{Refi}_y'],oppCost:['H_y - B_y','\\textstyle\\sum_{t \\in y}\\rho_t'],
  torDelta:['\\text{gap}_N(\\text{setting changed})','\\text{gap}_N(\\text{your settings})'],argmax:()=>'\\text{gap}_h(d)',advPct:['W^{buy}_k/\\Pi_k','W^{rent}_k/\\Pi_k','P'],median:()=>'x_i',pct:['r'],
  quantile:['x_{(\\lfloor k \\rfloor)}','x_{(\\lfloor k \\rfloor + 1)}','k - \\lfloor k \\rfloor'],share:['\\#\\{\\text{ahead}\\}','n'],count:['\\#\\{\\text{in the bin}\\}'],
  idioYear:['\\tilde g^{home}_k','e^{\\sigma_h\\varepsilon_k - \\sigma_h^2/2}'],rhoYear:['w_s','r^{stk}_y','w_b','r^{bond}_y','r^{bill}_y','\\lambda','s_b','f'],annualize:()=>'\\rho_y',
  compoundData:()=>'r_y',cpiRatio:['\\text{CPI}_y','\\text{CPI}_{1927}'],realOf1:['\\prod_y(1+r_y)','\\text{CPI}_y/\\text{CPI}_{1927}'],roll10:j=>j%2?'\\pi_k':'r_k',corr:j=>j%2?'b_y':'a_y',
  realIndex:j=>j%2?'\\pi_y':'g_y',inflation:['\\text{CPI}_y','\\text{CPI}_{y-1}'],realRate:['m_y','\\pi_y'],gapTotal:['W^{buy}_N','W^{inv}_N'],gapSum:()=>'x_y/\\bar\\Pi_y',gapHome:['H_N','P'],
  gapSell:['H_N','s'],gapBuy:['cP','\\text{move-in}','\\text{points}'],gapLoan:['L','\\sum_y \\text{Prin}_y','B_N'],gapInvTax:['\\text{yearly taxes}','\\text{tax on selling}'],gapRest:['\\text{gap}_N','\\text{all other parts}']};
/* the Method tab's symbol for each setting (by the model's name for it) */
const SETSYM={P:'P',dp:'d',rate:'r_{quote}',rate15:'r_{quote}',armRate:'r_{ARM}',armMargin:'\\chi',pts:'p_n',ptsCut:'\\Delta_p',closeBase:'c_0',close:'c_0',ttBuy:'c_{tt}',pmi:'\\text{pmi}',
  extraPay:'E',refiCost:'c_R',rateLR:'\\bar m',glide:'T_g',ptax:'\\tau_p',hsEx:'e_h',hsCredit:'k_h',ptaxCap:'a',ins:'\\text{ins}',floodIns:'\\text{flood}',maint:'\\psi',hoa:'\\text{HOA}_0',
  sellBase:'s_0',sell:'s_0',ttSell:'s_{tt}',insG:'g_{ins}',utilDiff:'U_0',moveIn:'\\text{move-in}',impShare:'\\varphi',rMove:'\\eta',rMoveCost:'c_{mv}',broker:'b',rent0:'R_0',renewGap:'\\delta',
  rins:'\\text{Ins}^r_0',gh:'g^{home}_k',gr:'g^{rent}_k',inf:'\\pi_k',rs:'r^{stk}_k',rb:'r^{bond}_k',rc:'r^{bill}_k',ws:'w_s',wb:'w_b',dy:'q',fee:'f',lev:'\\lambda',spread:'s_b',
  incGrowth:'g_I',income:'\\text{Inc}_0',mu:'\\mu',stTax:'T^{st}_0',oth:'O',stRate:'t_s',stDed:'\\mathbb{1}_{st}',ltcg:'\\tau_g',hhRent:'R^{hh}_0',hhShare:'z',hhVac:'v_h',
  investShare:'a',heloc:'\\ell',ptaxCapCPI:'\\text{inflation cap on}'};
/* a part's symbol: its role in the parent's equation, else its own equation's left-hand side, else the setting's */
function eqLhs(id){const e=EQ[id];if(!e)return null;const t=e.t.split('\\quad')[0],i=t.indexOf('=');const l=(i>0?t.slice(0,i):t).replace(/\\leftarrow.*/,'').trim();return l.length&&l.length<=48?l:null}
/* Generic equations are written with their parts' own symbols, so a part is called the same in the equation above it
   and on its own card: W^today = W_t / Π_t over a buyer's net worth reads \widetilde{W^{buy}_t} = W^{buy}_t / \Pi_t.
   l: the node's symbol from its parts' symbols; t: the equation from that symbol and the parts' symbols. */
const toYear=s=>s&&s.replace(/_\{?[tm]\}?$/,'_y').replace(/_\{([^{}]*),[tm]\}$/,'_{$1,y}');
const EQT={
  real:{l:k=>`\\widetilde{${k[0]}}`,t:(l,k)=>`${l} = ${k[0]} / ${k[1]}`},
  onePlus:{l:k=>`1+${k[0]}`,t:l=>l},
  perMonth:{l:k=>k[0].replace(/_\{?[ky]\}?$/,'_t'),t:(l,k)=>`${l} = (1+${k[0]})^{1/12} - 1`},
  compound12:{l:k=>k[0].replace(/_\{?m\}?$/,'_k'),t:(l,k)=>`${l} = \\textstyle\\prod_{m \\in y}(1+${k[0]}) - 1`},
  sum12:{l:k=>toYear(k.find(x=>x!=='x')||'x_t'),t:(l,k)=>`${l} = \\textstyle\\sum_{t \\in y} ${k.find(x=>x!=='x')||'x_t'}`},
  avg12:{l:k=>`\\bar ${toYear(k.find(x=>x!=='x')||'x_t')}`,t:(l,k)=>`${l} = \\tfrac{1}{12}\\textstyle\\sum_{t \\in y} ${k.find(x=>x!=='x')||'x_t'}`},
  sumYears:{l:k=>`\\textstyle\\sum_y ${k[0]}`,t:l=>l},
  perMo:{l:k=>`\\tfrac{1}{12}${k.length>1?'('+k.join(' + ')+')':k[0]}`,t:(l,k)=>`${l} = ${k.length>1?'('+k.join(' + ')+')':k[0]} / 12`},
  byInfl:{l:k=>k[0].replace(/_0$/,'_y'),t:(l,k)=>`${l} = ${k[0]}\\,${k[1]}`},
  payment:{l:()=>'M',t:(l,k)=>`M = \\frac{${k[0]}\\,i}{1-(1+i)^{-${k[2]}}}, \\quad i = ${k[1]}/12`},
  monthlyRate:{l:()=>'i',t:(l,k)=>`i = ${k[0]}/12`},
  liquid:{l:()=>'W^{liq}',t:(l,k)=>`${l} = ${k[0]} - ${k[1]}\\max(0,\\ ${k[0]} - ${k[2]})`},
  months:{l:()=>'\\text{months}',t:(l,k)=>`${l} = ${k[0]} / ${k[1]}`},
  gapSell:{l:k=>`-${k[1]}\\,${k[0]}`,t:l=>l},
  gapSum:{l:k=>`\\textstyle\\sum_y ${k[0]}`,t:l=>l},
  advPct:{l:()=>'\\text{adv}',t:(l,k)=>`${l} = 100\\,(${k[0]} - ${k[1]}) / ${k[2]}`},
  median:{l:()=>'\\text{median}',t:(l,k)=>`${l} = \\operatorname{median}(${k[0]},\\ \\dots)`},
  pct:{l:k=>`100\\,${k[0]}`,t:l=>l},
  investR:{l:()=>'\\text{added}_t',t:(l,k)=>`${l} = ${k[0]}\\max(${k[1]}, 0)`},
  investB:{l:()=>'\\text{added}_t',t:(l,k)=>`${l} = ${k[0]}\\max(-${k[1]}, 0)`},
  argmax:{l:()=>'d^{*}',t:(l,k)=>`${l} = \\arg\\max_d\\ \\text{gap}_h(d)`},
  quantile:{l:()=>'Q',t:(l,k)=>`${l} = ${k[0]} + (${k[1]} - ${k[0]})\\,${k[2]}`}};
/* where a part is, by design, another quantity's value (the loan is the balance before the first payment; a home
   bought at a move costs its value then): the row shows both, "B_t = L". [eq]: positions. */
const EQID={balanceMonth:[0],ledgerMonth:[0],basis:[0],saleNet:[0],interest:[0],principal:[2],prepay:[1],mip:[1],return:[0],returnCash:[0],invTax:[0],taxCash:[0],binc:[0],overdraft:[0],refiCost:[1],
  assess:[0],assessCap:[0],assessBase:[0],assessBuy:[0],maint:[1],heloc:[1],homeBasis:[0],lease:[0,4],moves:[4],mktIdx:[0],
  bracket:[0],ltcgBracket:[0],niit:[0],salt:[0],fMI:[0],stTax:[1],armReset:[2],moveLoan:[0,1],moveCash:[0,1]};
/* a node's own symbol: set on it, its setting's or series' symbol, a generic equation's from its parts, or its
   equation's left-hand side */
function ownSym(nd){if(!nd)return null;if(nd._sym!==undefined)return nd._sym;let s=null;
  if(nd.sym)s=nd.sym;else if(nd.leaf==='set')s=SETSYM[nd.pk]||null;else if(nd.ser)s=SETSYM[nd.ser]||null;
  else if(nd.build&&nd.eq){const g=EQT[nd.eq];if(g){const b=nd.built||(nd.built=nd.build());s=g.l(b.kids.map(k=>ownSym(k)||'x'))}else s=eqLhs(nd.eq)}
  return nd._sym=s}
/* the equation as a node shows it: generic ones filled in with the parts' symbols; a sum of up to 8 parts written out
   from its parts' own symbols (so a part is always called what its own card calls it) */
const wfmt=w=>w===1?'':Number.isInteger(w)?w+'\\,':Math.abs(1/w-Math.round(1/w))<1e-9?`\\tfrac{1}{${Math.round(1/w)}}`:w.toFixed(2)+'\\,';
function eqTexFor(nd){const g=EQT[nd.eq];const b0=nd.build&&(nd.built||(nd.built=nd.build()));
  if(!g&&b0&&b0.op==='sum'&&!EQREC.has(nd.eq)&&b0.kids.length<=12&&b0.kids.every(k=>ownSym(k)||(b0.syms&&b0.syms[b0.kids.indexOf(k)]))){const l=ownSym(nd);if(l)return `${l} = `+b0.kids.map((k,j)=>{const s=b0.sg[j],w=Math.abs(s),y=ownSym(k)||b0.syms[j],t=/[+-]/.test(y.replace(/^[-]/,''))&&w!==1?`(${y})`:y;return (j?(s<0?' - ':' + '):(s<0?'-':''))+wfmt(w)+t}).join('')}
  if(!g)return EQ[nd.eq]?EQ[nd.eq].t:'';const b=nd.built||(nd.built=nd.build());return g.t(ownSym(nd),b.kids.map(k=>ownSym(k)||'x'))}
/* a part's symbol in its parent's equation: named where the sum is built, by position (EQP), or its own */
/* recursive sums (this month's balance from last month's): their parts are named one period back, from the equation */
const EQREC=new Set(['balanceMonth','ledgerMonth','basis']);
function symFor(parent,b,j){const k=b.kids[j];if(EQT[parent.eq]||(b.op==='sum'&&!EQREC.has(parent.eq)&&b.kids.length<=12))return ownSym(k)||(b.syms&&b.syms[j])||null;const own=b.syms&&b.syms[j];if(own)return own;const p=parent.eq&&EQP[parent.eq];
  if(p){const s=typeof p==='function'?p(j,k):p[j];if(s)return s}return ownSym(k)}
/* The same quantity at another time or under another index letter: a part the parent calls B_{t-1} is the balance
   card's B_t one month earlier; one it calls \Pi_y is \Pi_t at t = y. reIdx renames the index letter o.from to o.to
   (moving a bound variable out of the way) and shifts it by o.d, in every sub- and superscript; symMatch finds the
   change that turns a part's own symbol into its name in the parent, so its card can show its equation that way. */
const IDX=/([_^])(\{([^{}]*)\}|([a-zA-Z0-9]))/g,LET=/(?<![A-Za-z\\])([a-z])(?![A-Za-z])((?:[+-]\d+)?)/g;
function reIdx(tex,o){if(!tex||!o||(o.from===o.to&&!o.d))return tex;const used=new Set();tex.replace(IDX,(a,op,g,inner,one)=>{(inner!=null?inner:one).replace(LET,(m,l)=>{used.add(l);return m});return a});
  const map={};if(o.from!==o.to){map[o.from]=o.to;if(used.has(o.to))map[o.to]=['k','j','q','r','u'].find(l=>!used.has(l)&&l!==o.from&&l!==o.to)}
  return tex.replace(IDX,(a,op,g,inner,one)=>{const c=(inner!=null?inner:one).replace(LET,(m,l,off)=>{const L=map[l]||l;if(l===o.from&&o.d){const k=(off?+off:0)+o.d;return L+(k?(k>0?'+':'')+k:'')}return L+off});
    return op+(c.length===1?c:'{'+c+'}')})}
const symNorm=s=>(s||'').replace(/\\[,;: ]|\s+/g,'').replace(/\\textstyle/g,'').replace(/([_^])\{(\w)\}/g,'$1$2');
function symMatch(role,own){if(!role||!own)return null;if(symNorm(role)===symNorm(own))return {from:'t',to:'t',d:0};
  for(const from of ['t','y','k','m'])for(const to of ['t','y','k','m'])for(const d of [0,-1,1,-2,2,-3,3]){if(from===to&&!d)continue;if(symNorm(reIdx(own,{from,to,d}))===symNorm(role))return {from,to,d}}
  // the first period's value: \Pi_y at y = 0 is \Pi_0
  for(const v of ['t','y','k','m'])for(const n of [0,1])if(symNorm(role.replace(IDX,(a,op,g,inner,one)=>{const c=(inner!=null?inner:one).replace(LET,(m,l,off)=>l===v?String(n+(off?+off:0)):m);return op+(c.length===1?c:'{'+c+'}')}))===symNorm(own))return {from:'t',to:'t',d:0,at:n};
  return null}
