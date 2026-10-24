// Globals the page gets from outside src/: the data block build.py writes, and the libraries loaded at runtime.
declare const LOCAL_LIBS: string[];
declare const SNAP: any, RES: any, D0: any, FCST: any, COUNTIES: any, CREDIT: any, STATE_RULES: any, METROS: any[], MONTHLY: any;
declare const MATHJAX_SRC: string;
declare const Plotly: any;
interface Window { Plotly: any; MathJax: any; _summaryText: string }
declare const MORT_OVERRIDE: number[] | null, HOME_OVERRIDE: Record<string, number> | null;
declare const MathJax: any;
// Page elements and events are used loosely (el.value, e.target.closest(...)); the check is aimed at the app's own
// names, objects and function calls, so DOM lookups are left untyped.
interface Document { getElementById(elementId: string): any; querySelector(selectors: string): any }
interface ParentNode { querySelector(selectors: string): any }
interface Element { [key: string]: any }
interface EventTarget { [key: string]: any }
interface Event { [key: string]: any }
interface ChildNode { [key: string]: any }
