/* ===================== Language (English / Spanish) ===================== */
/* The app is written in English. In Spanish mode a MutationObserver translates every text node, button label,
   placeholder and accessible name as it is rendered, from a dictionary of English fragments (I18N.es, loaded from
   i18n/es.json on the site or embedded in the single-file build). Numbers, dollar amounts and percentages inside a
   fragment are placeholders: "comes out ahead by {0} after {1} years" matches every amount and horizon. A text node
   keeps its English original in __en, so code that looks things up by English label (help buttons) uses enText().
   Untranslated fragments stay in English; the Method tab (formulas) is left in English on purpose. */
let LANG='en',I18N_DICT=null;const I18N_SKIP='#tab-method,.mjx,script,style,textarea,[translate="no"],.js-plotly-plot .modebar';
const I18N_NUM=/(?:(?<![A-Za-z0-9])[−+-])?\$?\d[\d,]*(?:\.\d+)?(?:\s?[kKMB](?![a-zA-Z]))?%?/g;
function i18nKey(s){const nums=[];const k=s.replace(/\s+/g,' ').trim().replace(I18N_NUM,m=>{nums.push(m);return `{${nums.length-1}}`});return [k,nums]}
/* Second form of a key: place names (metros, their Census areas, states, counties), state codes and month
   abbreviations become placeholders too, so "Estimated from the home price (Boston)" covers every location. Month
   placeholders are translated when filled in. */
let I18N_RE2=null;const I18N_MON={Jan:'ene.',Feb:'feb.',Mar:'mar.',Apr:'abr.',May:'may.',Jun:'jun.',Jul:'jul.',Aug:'ago.',Sep:'sep.',Oct:'oct.',Nov:'nov.',Dec:'dic.'};
function i18nRe2(){if(I18N_RE2)return I18N_RE2;const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const names=[...new Set([].concat(typeof METROS!=='undefined'?METROS.filter(m=>!m.county).flatMap(m=>[m.name,m.acs&&m.acs.name].filter(Boolean)):[],
    typeof STATE_RULES!=='undefined'?Object.keys(STATE_RULES.names||{}):[]))].sort((a,b)=>b.length-a.length).map(esc);
  const abbr=typeof STATE_RULES!=='undefined'?Object.values(STATE_RULES.names||{}).join('|'):'ZZ';
  const county="[A-Z][A-Za-z.'’-]*(?: [A-Z][A-Za-z.'’-]*)* (?:County|Parish|Borough|Census Area|Municipality|city)(?:, [A-Z][a-z]+(?: [A-Z][a-z]+)*)?";
  return I18N_RE2=new RegExp(`ZIP \\d{5} · ${county}|${county}|${names.length?names.join('|')+'|':''}\\b(?:${abbr})\\b(?=[:;,) ]|$)|\\b(?:${Object.keys(I18N_MON).join('|')})\\b(?= \\d)|${I18N_NUM.source}`,'g')}
function i18nKey2(s){const vals=[];const k=s.replace(/\s+/g,' ').trim().replace(i18nRe2(),m=>{vals.push(m);return `{${vals.length-1}}`});return [k,vals]}
function tr(s){if(LANG==='en'||!I18N_DICT||!s||!/[A-Za-z]/.test(s))return s;
  const lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0];let [k,nums]=i18nKey(s),t=I18N_DICT[k];
  if(t==null){[k,nums]=i18nKey2(s);t=I18N_DICT[k]}
  return t==null?s:lead+t.replace(/\{(\d+)\}/g,(_,i)=>{const v=nums[+i];return v==null?'':I18N_MON[v]||v})+trail}
function i18nText(n){const en=n.__en!=null&&n.nodeValue===n.__es?n.__en:n.nodeValue,es=tr(en);if(es!==en){n.__en=en;n.__es=es;if(n.nodeValue!==es)n.nodeValue=es}}
function i18nAttrs(el){for(const a of ['placeholder','aria-label','title']){const v=el.getAttribute(a);if(!v)continue;const k='__en_'+a,en=el[k]!=null&&v===el['__es_'+a]?el[k]:v,es=tr(en);if(es!==en){el[k]=en;el['__es_'+a]=es;if(v!==es)el.setAttribute(a,es)}}}
const I18N_FILTER={acceptNode:c=>c.nodeType===1&&c.matches(I18N_SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT};
function i18nNode(n){
  if(n.nodeType===3){const p=n.parentElement;if(p&&!p.closest(I18N_SKIP))i18nText(n);return}
  if(n.nodeType!==1||n.closest(I18N_SKIP))return;i18nAttrs(n);
  const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,I18N_FILTER);let c;while((c=w.nextNode())){if(c.nodeType===1)i18nAttrs(c);else i18nText(c)}}
let I18N_OBS=null;
function i18nStart(){document.documentElement.lang=LANG;if(LANG==='en'||!I18N_DICT)return;i18nNode(document.body);document.title=tr(document.title);
  if(!I18N_OBS){I18N_OBS=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')i18nNode(m.target);else if(m.type==='attributes'){if(!m.target.closest(I18N_SKIP))i18nAttrs(m.target)}else m.addedNodes.forEach(i18nNode)}});
    I18N_OBS.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']})}}
/* English text of an element, whatever language it is shown in */
function enText(el){let s='';const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let c;while((c=w.nextNode()))s+=c.__en!=null&&c.nodeValue===c.__es?c.__en:c.nodeValue;return s}
function i18nLoad(lang){if(lang!=='es')return Promise.resolve(null);if(typeof I18N_ES!=='undefined'&&I18N_ES)return Promise.resolve(I18N_ES);
  return fetch('i18n/es.json').then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})}
function i18nInit(){let l=null;try{const q=new URLSearchParams(location.search).get('lang');if(q)localStorage.setItem('rbi-lang',q);l=q||localStorage.getItem('rbi-lang')}catch(e){}
  if(!l&&navigator.language&&/^es\b/i.test(navigator.language))l='es';LANG=l==='es'?'es':'en';
  return i18nLoad(LANG).then(d=>{I18N_DICT=d;if(!d)LANG='en'}).catch(()=>{LANG='en'})}
function setLang(l){try{localStorage.setItem('rbi-lang',l)}catch(e){}const u=new URL(location.href);u.searchParams.delete('lang');location.href=u.toString()}
