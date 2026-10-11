import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes:true});
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(join(dir,e.name)) : join(dir,e.name)))).flat();
}
const catalogue=JSON.parse(await readFile('data/catalogue.json','utf8'));
assert.equal(catalogue.products.length,24);
assert.equal(catalogue.products.filter(p=>p.type==='Framed print').length,4);
assert.equal(catalogue.products.filter(p=>!p.inStock).length,3);
assert.equal(new Set(catalogue.products.map(p=>p.slug)).size,24);
const files=await walk('dist');
assert.equal(files.filter(f=>/^dist\/produit\/.+\/index\.html$/.test(f)).length, catalogue.products.length, 'Stale generated product pages');
let links=0;
for(const file of files.filter(f=>f.endsWith('.html'))) {
  const html=await readFile(file,'utf8');
  assert(!/lorem ipsum|Mauris blandit|Quisque volutpat/i.test(html),`Placeholder text in ${file}`);
  assert(html.includes('<title>'),`Missing title ${file}`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs ${file}`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"#]+)"/g)) {
    const url=match[1];
    if(!url.startsWith('/') || url.startsWith('//')) continue;
    const path=url.split(/[?#]/)[0];
    const local=resolve('dist','.'+path+(path.endsWith('/')?'index.html':''));
    await access(local).catch(()=>assert.fail(`Broken local link ${url} in ${file}`));
    links++;
  }
  for (const img of html.matchAll(/<img\b([^>]+)>/g)) assert(/\balt="/.test(img[1]),`Missing image alt ${file}`);
  const schema=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if(schema) JSON.parse(schema[1]);
}
for(const p of catalogue.products) {
  assert(p.price>0 && p.currency==='EUR',`Invalid price ${p.slug}`);
  assert.equal(new URL(p.shopUrl).origin,'https://art-fadist.com');
  const html=await readFile(`dist/produit/${p.slug}/index.html`,'utf8');
  if(!p.inStock) assert(!html.includes('buy-button'),`Sold-out work has purchase button ${p.slug}`);
}
console.log(`Validated ${files.filter(f=>f.endsWith('.html')).length} pages, ${links} local links, all 24 product records and sold-out states.`);
