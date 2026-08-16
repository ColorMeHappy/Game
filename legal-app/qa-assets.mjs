import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('legal-app');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const fixed=[...sw.matchAll(/['"](\.\/[^'"`$]+)['"]/g)].map(m=>m[1]);
const urls=[...new Set(fixed)].filter(x=>x!=='./');
const missing=[];
for(const url of urls){
  const clean=url.replace(/^\.\//,'').split('?')[0];
  if(!clean||clean.includes('*'))continue;
  if(!fs.existsSync(path.join(root,clean)))missing.push(`${url} -> ${clean}`);
}
console.log(JSON.stringify({checked:urls.length,missing},null,2));
if(missing.length){
  for(const x of missing)console.error(`::error file=legal-app/service-worker.js::Precache asset missing: ${x}`);
  process.exit(1);
}
console.log('LexiFrance PWA asset QA PASSED');
