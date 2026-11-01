// Lightweight structural checks; a full OpenAPI/schema linter remains a release gate.
import {readFile,readdir,access} from 'node:fs/promises';
import {join} from 'node:path';
const chapters=(await readdir(new URL('../docs/ru/',import.meta.url))).filter(n=>/^\d{2}-.*\.md$/.test(n)).sort();
if(chapters.length!==26)throw new Error('Expected 26 Markdown chapters; got '+chapters.length);
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const generator=await readFile(new URL('./build-site.mjs',import.meta.url),'utf8');
for(let i=0;i<chapters.length;i++){
  const expected=String(i+1).padStart(2,'0');
  if(!chapters[i].startsWith(expected+'-'))throw new Error('Chapter number gap: '+chapters[i]);
  const id='chapter-'+expected;
  if(!html.includes('id="'+id+'"'))throw new Error('Missing HTML section '+id);
  if(!generator.includes(chapters[i].slice(0,-3)))throw new Error('Missing generator manifest entry '+chapters[i]);
}
// Reader UX regression: the top controls must remain visible when scrolling
// and anchored sections must not sit underneath the pinned header.
if(!html.includes('.topbar{position:sticky;top:0;') ||
   !html.includes('scroll-padding-top:86px') ||
   !html.includes('scroll-margin-top:86px') ||
   !html.includes("topbar.classList.toggle('is-scrolled'") ||
   !html.includes("current.dataset.title"))
  throw new Error('Sticky reader header or active section context is missing');
const links=[...html.matchAll(/data-link="(chapter-\d{2})"/g)].map(m=>m[1]);
if(links.length!==26||new Set(links).size!==26)throw new Error('Navigation must have exactly 26 unique links');
const api=await readFile(new URL('../contracts/openapi.yaml',import.meta.url),'utf8');
if(!/^openapi: 3\.1\.0/m.test(api)||!api.includes('paths:')||!api.includes('components:'))
  throw new Error('Missing initial OpenAPI contract structure');
const required=['README.md','AGENTS.md','docs/adr/0001-runtime-boundaries.md'];
for(const path of required)await access(new URL('../'+path,import.meta.url));
console.log('Docs structure: 26 chapters, navigation, manifest, API draft, entry points OK.');
