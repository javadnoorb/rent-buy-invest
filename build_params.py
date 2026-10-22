# Sets D0_EXTRA (defaults) and RES_EXTRA (hints with sources) from data/realism.json. Executed by build.py.
def _url(e, want=None):
    if not e: return None
    if want:
        for s in e.get('sources') or []:
            if want.lower() in (s.get('source_title', '') + s.get('source_url', '') + s.get('url', '')).lower():
                return s.get('source_url') or s.get('url')
    if e.get('source_url'): return e['source_url']
    for s in e.get('sources') or []:
        if s.get('source_url') or s.get('url'): return s.get('source_url') or s.get('url')
    return None
def _v(k): return (REAL.get(k) or {}).get('value') or {}
ip, vac, mg, dep, hh, rn, wg, fs = (_v(k) for k in ('investment_rate_premium', 'rental_vacancy', 'mgmt_fee', 'depreciation_tax', 'house_hacking_tax', 'renewal_vs_new_lease', 'wage_growth', 'forced_sales'))
prem = round(((ip.get('rate_premium_pp_low') or 0.5) + (ip.get('rate_premium_pp_high') or 1.0)) / 2, 2)
D0_EXTRA = {
    'renewGap': 0,
    'incGrowth': wg.get('atlanta_fed_wgt_overall_pct') or 3.0,
    'stressMult': 2,
    'forcedDisc': fs.get('death_related_discount_pct_low') or 5,
    'vacR': vac.get('rental_vacancy_rate_pct') or 7,
    'dpR': ip.get('min_down_payment_2_4unit_pct') or 25,
    'ratePrem': prem,
    'mgmt': mg.get('most_cited_pct') or 10,
}
RES_EXTRA = {
    'renew': {'u': _url(REAL.get('renewal_vs_new_lease'), 'realpage') or _url(REAL.get('renewal_vs_new_lease')),
              'h': f"0 = renewals track market. RealPage 2026: renewals +{rn.get('renewal_rent_growth_2026_ytd_pct')}% vs move-ins +{rn.get('move_in_rent_growth_latest_pct')}% (renewals above market lately; no long-run average published)"},
    'wage': {'u': _url(REAL.get('wage_growth')), 'h': f"Atlanta Fed Wage Growth Tracker {wg.get('atlanta_fed_wgt_overall_pct')}% ({wg.get('month')}); job stayers {wg.get('job_stayers_pct')}%"},
    'stress': {'u': _url(REAL.get('forced_sales'), 'nar') or _url(REAL.get('forced_sales')),
               'h': f"<span class=\"tag\">assumption</span> distressed sales were {fs.get('nar_distressed_share_2009_03_pct')}% of sales in March 2009 vs {fs.get('nar_distressed_share_late2014_pct')}% in late 2014 (NAR)"},
    'forced': {'u': _url(REAL.get('forced_sales'), 'campbell') or _url(REAL.get('forced_sales')),
               'h': f"Campbell, Giglio &amp; Pathak (AER 2011): {fs.get('death_related_discount_pct_low')}–{fs.get('death_related_discount_pct_high')}% after a death, {fs.get('bankruptcy_related_discount_pct')}% after bankruptcy, {fs.get('foreclosure_discount_pct')}% for foreclosures"},
    'vac': {'u': _url(REAL.get('rental_vacancy')), 'h': f"Census U.S. rental vacancy {vac.get('rental_vacancy_rate_pct')}% ({vac.get('quarter')})"},
    'dpR': {'u': _url(REAL.get('investment_rate_premium'), 'fannie'), 'h': f"Fannie Mae minimum {ip.get('min_down_payment_1unit_pct')}% for 1 unit, {ip.get('min_down_payment_2_4unit_pct')}% for 2–4 units; mortgage insurance not modeled, so 20%+ is realistic"},
    'ratePrem': {'u': _url(REAL.get('investment_rate_premium'), 'mortgage reports') or _url(REAL.get('investment_rate_premium'), 'lendingtree'),
                 'h': f"lenders quote {ip.get('rate_premium_pp_low')}–{ip.get('rate_premium_pp_high')} points above owner-occupied rates"},
    'mgmt': {'u': _url(REAL.get('mgmt_fee')), 'h': f"typically {mg.get('typical_low_pct_of_rent')}–{mg.get('typical_high_pct_of_rent')}% of rent, {mg.get('most_cited_pct')}% most cited; 0 if self-managed"},
    'dep': {'u': _url(REAL.get('depreciation_tax'), '527'), 'h': ''},
    'hhTax': {'u': _url(REAL.get('house_hacking_tax'), '523'), 'h': 'IRS Pub 523: no gain split if the rented space is inside your home'},
}
for k, e in REAL.items():
    if k.startswith('_'): continue
    for s in (e.get('sources') or []):
        u = s.get('source_url') or s.get('url'); t = s.get('source_title') or s.get('title')
        if u and t: RES['sources'][f'rz_{k}_{len(RES["sources"])}'] = {'t': t, 'u': u}
    if e.get('source_url') and e.get('source_title'): RES['sources'][f'rz_{k}'] = {'t': e['source_title'], 'u': e['source_url']}
