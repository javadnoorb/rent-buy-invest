#!/usr/bin/env node
/* Static checks for the concatenated app (no dependencies). Run: node tests/lint.js
   1. the model and app scripts compile;
   2. no top-level name is declared twice across src/ files (they share one scope once concatenated);
   3. every element id the code looks up with a literal getElementById exists in body.html or is created by the code;
   4. every setting in the inputs table has pop-up help. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
const appFiles = fs.readdirSync(path.join(SRC, 'app')).filter(f => f.endsWith('.js')).sort().map(f => path.join(SRC, 'app', f));
const files = [path.join(SRC, 'model.js'), ...appFiles];
const text = Object.fromEntries(files.map(f => [path.relative(ROOT, f), fs.readFileSync(f, 'utf8')]));
const body = fs.readFileSync(path.join(SRC, 'body.html'), 'utf8');
const problems = [];

// 1. syntax
try { new vm.Script(Object.values(text).join('\n;\n'), { filename: 'bundle.js' }); }
catch (e) { problems.push('syntax error: ' + e.message); }

// 2. duplicate top-level declarations
const seen = {};
for (const [f, src] of Object.entries(text)) {
  for (const m of src.matchAll(/^(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:const|let|var|class)\s+([A-Za-z_$][\w$]*))/gm)) {
    const name = m[1] || m[2]; (seen[name] = seen[name] || []).push(f);
  }
}
for (const [n, fs_] of Object.entries(seen)) if (fs_.length > 1) problems.push(`"${n}" is declared at top level in ${fs_.join(' and ')}`);

// 3. ids
const ids = new Set([...body.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]).concat(['model-script', 'snapshot-data'])); // the last two are added by build.py
const all = Object.values(text).join('\n');
for (const m of all.matchAll(/id=\\?["'`]([\w-]+)\\?["'`]/g)) ids.add(m[1]);          // ids written into generated HTML
for (const m of all.matchAll(/\.id\s*=\s*['"]([\w-]+)['"]/g)) ids.add(m[1]);          // el.id = '...'
const F = all.match(/const F=\[([\s\S]*?)\n\];/);
const fids = F ? [...F[1].matchAll(/^\s*\['\w+'\s*,\s*'([\w-]+)'/gm)].map(m => m[1]) : [];
fids.forEach(i => ids.add(i));
const missing = new Set();
for (const m of all.matchAll(/getElementById\(\s*['"]([\w-]+)['"]\s*\)/g)) if (!ids.has(m[1])) missing.add(m[1]);
missing.forEach(i => problems.push(`getElementById('${i}') has no matching element`));

// 4. help for every setting
const help = text['src/app/186-help.js'] || '';
const noHelp = fids.filter(i => !new RegExp(`^\\s*'?${i}'?:\\[`, 'm').test(help));
if (!fids.length) problems.push('could not read the settings table (const F=[...])');
if (noHelp.length) problems.push('settings without pop-up help: ' + noHelp.join(', '));

if (problems.length) { console.log('LINT FAILED\n' + problems.map(p => '  ' + p).join('\n')); process.exit(1); }
console.log(`lint passed: ${files.length} files, ${Object.keys(seen).length} top-level names, ${fids.length} settings with help`);
