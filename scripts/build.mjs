import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

const catalogue = JSON.parse(await readFile('data/catalogue.json', 'utf8'));
const products = catalogue.products;
const homeSource = await readFile('src/home.html', 'utf8');
// These directories contain only generated pages; keep all original assets.
for (const directory of ['produit', 'categorie-produit', 'journal']) {
  await rm(`dist/${directory}`, {recursive:true, force:true});
}
await mkdir('dist', {recursive:true});
await writeFile('dist/styles.css', await readFile('src/styles.css'));
await writeFile('dist/site.js', await readFile('src/site.js'));
const header = homeSource.match(/<header class="site-header">[\s\S]*?<\/header>/)[0]
  .replace('<nav aria-label="Main navigation">', '<nav aria-label="Main navigation">')
  + `<nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation" hidden><a href="/collection/">The collection</a><a href="/prints/">Framed prints</a><a href="/about/">Meet Fadist</a><a href="/custom-portrait/">Custom portrait</a><a href="/journal/">Journal</a><a href="/contact/">Contact</a><a href="https://art-fadist.com/cart/">Shopping bag ↗</a><a href="https://art-fadist.com/mon-compte/">My account ↗</a></nav>`;
const footer = homeSource.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = p => new Intl.NumberFormat('en-IE', {style:'currency', currency:p.currency, maximumFractionDigits:0}).format(p.price);
const pathFor = p => `/produit/${p.slug}/`;

async function save(path, content) {
  await mkdir(dirname(`dist${path}`), {recursive:true});
  await writeFile(`dist${path}`, content);
}
function layout(title, description, main, path = '/', extra = '') {
  const canonical = `https://art-fadist.com${path}`;
  return `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} — Art Fadist</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${canonical}"><link rel="icon" href="/assets/favicon.png"><link rel="stylesheet" href="/styles.css">${extra}</head><body><a class="skip-link" href="#main">Skip to content</a>${header}<main id="main">${main}</main>${footer}<script src="/site.js" defer></script></body></html>\n`;
}
function card(p) {
  return `<article class="work-card"><a href="${pathFor(p)}"><div class="work-image"><img src="${p.image}" alt="${escape(p.name)} by Rémi Aldeguer" width="1200" height="1200" loading="lazy" decoding="async">${!p.inStock ? '<span class="stock-badge">Sold out</span>' : ''}</div><div class="work-info"><h3>${escape(p.name)}</h3><span class="price">${money(p)}</span></div><p class="work-type">${p.type}${p.dimensions ? ` · ${escape(p.dimensions)}` : ''}</p></a></article>`;
}
const featured = ['bad-creatures', 'dolly', 'dolly-copy'].map(slug => products.find(p => p.slug === slug));
let home = homeSource.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
home = home.replace(/<div id="featured-works" class="works-grid">[\s\S]*?<\/div>/, `<div id="featured-works" class="works-grid">${featured.map(card).join('')}</div>`);
// Home source is the editable template; generated output is reproducible.
home = home.replace(/<section class="print-promo[\s\S]*?<\/section>/, '');
home = home.replace('<section class="artist-section wrap">', `<section class="print-promo wrap"><div class="print-promo-image"><img src="/assets/works/rivers-spirits.jpg" alt="River’s spirits framed print by Rémi Aldeguer" width="1200" height="1200" loading="lazy"></div><div><p class="eyebrow">A CREATURE TO CALL YOUR OWN</p><h2>Small frame.<br>Whole new world.</h2><p>Discover the framed prints collection.<br>Four creatures. €60 each.</p><a class="button" href="/prints/">Explore framed prints <span aria-hidden="true">↗</span></a></div></section><section class="artist-section wrap">`);
await save('/index.html', layout('Find your inner creature', 'Original paintings, creatures and framed prints by Rémi Aldeguer. Discover the Art Fadist gallery.', home));

const categories = [
  ['all','All works'], ['abstract','Paintings'], ['creatures','Creatures'], ['portrait','Portraits'], ['disease','Disease'], ['liminal-visions','Liminal visions'], ['prints','Framed prints']
];
const matchCategory = (p, cat) => cat === 'all' || (cat === 'abstract' ? p.type !== 'Framed print' : p.categories.includes(cat));
async function collection(path, category = 'all') {
  const list = products.filter(p => matchCategory(p,category));
  const title = category === 'all' ? 'The collection' : categories.find(c => c[0] === category)?.[1] || 'The collection';
  const description = category === 'prints' ? 'Four creatures, ready to find a home. Explore the framed prints collection, €60 each.' : 'Original paintings, cubist creatures and portraits. Find the one that speaks to you.';
  const filters = categories.map(([slug,label]) => `<a href="${slug === 'all' ? '/collection/' : slug === 'prints' ? '/prints/' : `/categorie-produit/${slug}/`}" ${category===slug?'aria-current="page"':''}>${label}<span>${products.filter(p=>matchCategory(p,slug)).length}</span></a>`).join('');
  await save(`${path}index.html`, layout(title, description, `<section class="page-intro wrap"><p class="eyebrow">FADIST ART GALLERY</p><h1>${title}</h1><p>${description}</p></section><section class="catalogue wrap"><nav class="category-filters" aria-label="Filter collection">${filters}</nav><div class="catalogue-count">${list.length} works</div><div class="works-grid">${list.map(card).join('')}</div></section>`, path));
}
await collection('/collection/');
await collection('/prints/','prints');
for (const [slug] of categories.filter(c=>c[0]!=='all')) await collection(`/categorie-produit/${slug}/`, slug);

for (const p of products) {
  const available = p.inStock && p.purchasable;
  const related = products.filter(item=>item.slug!==p.slug && item.type===p.type).slice(0,3);
  const back = p.type === 'Framed print' ? '/prints/' : '/collection/';
  const productJson = { '@context':'https://schema.org', '@type':'Product', name:p.name, image:`https://art-fadist.com${p.image}`, description:p.description || `${p.type} by Rémi Aldeguer. ${p.dimensions}`, brand:{'@type':'Brand',name:'Art Fadist'}, offers:{'@type':'Offer',url:p.shopUrl,priceCurrency:p.currency,price:p.price,availability:available?'https://schema.org/InStock':'https://schema.org/OutOfStock'} };
  const main = `<div class="wrap breadcrumb"><a href="${back}">← Back to ${p.type==='Framed print'?'framed prints':'the collection'}</a></div><section class="product-detail wrap"><div class="product-image"><a href="${p.image}" target="_blank" rel="noopener" aria-label="View ${escape(p.name)} full image"><img src="${p.image}" alt="${escape(p.name)}, ${p.type.toLowerCase()} by Rémi Aldeguer" width="1200" height="1200" fetchpriority="high"></a><span class="image-hint">Open image to see the details ↗</span></div><div class="product-copy"><p class="eyebrow">${p.type.toUpperCase()}</p><h1>${escape(p.name)}</h1><p class="product-price">${money(p)}</p><p class="availability ${available?'':'sold'}"><span aria-hidden="true">●</span> ${available?'Available in the shop':'Sold out'}</p>${p.description?`<p class="product-description">${escape(p.description)}</p>`:''}<dl class="product-facts"><div><dt>Artist</dt><dd>Rémi Aldeguer</dd></div>${p.medium?`<div><dt>Medium</dt><dd>${escape(p.medium)}</dd></div>`:''}${p.dimensions?`<div><dt>${p.type==='Framed print'?'Frame size':'Dimensions'}</dt><dd>${escape(p.dimensions)}</dd></div>`:''}<div><dt>Collection</dt><dd>${p.categories.filter(c=>c!=='abstract'&&c!=='prints').map(c=>categories.find(x=>x[0]===c)?.[1]).filter(Boolean).join(', ') || 'Paintings'}</dd></div></dl>${available?`<a class="button buy-button" href="${escape(p.shopUrl)}" target="_blank" rel="noopener noreferrer">View in the shop <span aria-hidden="true">↗</span></a><p class="purchase-note">Check current availability and complete your purchase in the Art Fadist shop.</p>`:`<a class="button" href="/collection/">Explore other creatures <span aria-hidden="true">↗</span></a>`}<a class="product-question text-link" href="mailto:contact.thefadist@gmail.com?subject=${encodeURIComponent(`Question about ${p.name}`)}">Ask about this work <span aria-hidden="true">↗</span></a></div></section><section class="collection-section wrap"><div class="section-heading"><h2>You may also like</h2></div><div class="works-grid">${related.map(card).join('')}</div></section>`;
  await save(`${pathFor(p)}index.html`, layout(p.name, `${p.type} by Rémi Aldeguer. ${p.dimensions} Discover ${p.name} at Art Fadist.`, main, pathFor(p), `<script type="application/ld+json">${JSON.stringify(productJson).replace(/</g,'\\u003c')}</script>`));
}

const about = `<section class="page-intro wrap"><p class="eyebrow">THE ARTIST BEHIND ART FADIST</p><h1>Meet Fadist.</h1></section><section class="about-layout wrap"><img class="about-portrait" src="/assets/artist.jpg" width="1080" height="720" alt="Rémi Aldeguer painting" fetchpriority="high"><div class="prose"><h2>Greetings,<br>fellow creature lovers.</h2><p>I’m Rémi Aldeguer, the artist behind Art Fadist. I’m fascinated by human nature and its intricacies.</p><p>My work aims to capture the essence of a movement, the furtive impulse of an individual’s soul, and freeze it as a cubist creature — a condensed emotional snapshot.</p><p>This palette of emotions, usually fragmented in its manifestation, is revealed in its totality, offering a unique contemplative beauty.</p><a class="text-link" href="/collection/">Explore my creatures <span aria-hidden="true">↗</span></a></div></section><section class="about-notes wrap"><div><p class="eyebrow">MADE FOR YOU</p><h2>Your own creature.</h2><p>I also make custom creature portraits and canvases based on your ideas.</p><a class="text-link" href="/custom-portrait/">Ask for a custom portrait ↗</a></div><div><p class="eyebrow">FADIST, IN MUSIC</p><h2>Another way to feel.</h2><p>Discover the music of Fadist.</p><a class="text-link" href="https://open.spotify.com/artist/4WyzSCRjXfXwgNqwMCyc4y" target="_blank" rel="noopener noreferrer">Listen on Spotify ↗</a><a class="text-link music-link" href="https://soundcloud.com/thefadist" target="_blank" rel="noopener noreferrer">Listen on SoundCloud ↗</a></div></section>`;
await save('/about/index.html', layout('Meet Fadist', 'Meet Rémi Aldeguer, the artist behind the cubist creatures of Art Fadist.', about, '/about/'));

function contactForm(portrait = false) {
  return `<form class="contact-form" data-email-form="${portrait?'portrait':'contact'}"><div class="form-row"><div><label for="name">Your name <span aria-hidden="true">*</span></label><input id="name" name="name" autocomplete="name" required maxlength="120"></div><div><label for="email">Your email <span aria-hidden="true">*</span></label><input id="email" name="email" type="email" autocomplete="email" required maxlength="200"></div></div>${portrait?`<label for="portraitType">Type of portrait</label><select id="portraitType" name="portraitType"><option>Creature portrait</option><option>Abstract portrait</option><option>Realistic portrait</option></select><label class="checkbox-label"><input type="checkbox" name="gift" value="yes"> It’s a gift</label>`:''}<label for="message">${portrait?'Tell me about your ideas':'Your message'} <span aria-hidden="true">*</span></label><textarea id="message" name="message" rows="5" required maxlength="1600" placeholder="${portrait?'Your personality, what you love, an idea you have in mind…':'A question about a work, an exhibition, or a collaboration…'}"></textarea><p class="form-note">This opens a draft in your email app. Send it there to complete your request.</p><button class="button" type="submit">Open email draft <span aria-hidden="true">↗</span></button><p id="form-status" class="form-status" role="status" aria-live="polite"></p><p class="direct-email">You can also write directly to <a href="mailto:contact.thefadist@gmail.com">contact.thefadist@gmail.com</a>.</p></form>`;
}
await save('/contact/index.html', layout('Contact', 'Contact Rémi Aldeguer about a painting, a custom piece, an exhibition or a collaboration.', `<section class="page-intro wrap"><p class="eyebrow">LET’S MAKE A CONNECTION</p><h1>Let’s talk.</h1><p>A custom piece, a question about a work,<br>or simply something you want to share.</p></section><section class="contact-layout wrap"><div><h2>Hello, creature.</h2><p>I’d love to hear from you.</p><a class="text-link" href="https://www.instagram.com/art_fadist/" target="_blank" rel="noopener noreferrer">Find me on Instagram ↗</a></div>${contactForm()}</section>`, '/contact/'));
await save('/custom-portrait/index.html', layout('Custom creature portrait', 'Commission a personalized creature, abstract or realistic portrait inspired by your personality and what you love.', `<section class="page-intro wrap"><p class="eyebrow">A CREATURE, JUST FOR YOU</p><h1>Your own inner creature.</h1><p>A personalized portrait based on your personality<br>and what you love.</p></section><section class="custom-layout wrap"><div><img src="/assets/custom-portrait.jpg" width="1200" height="1200" alt="Example of a personalized Art Fadist portrait" fetchpriority="high"><p class="image-hint">Every portrait starts with your ideas.</p></div><div><h2>Tell me your story.</h2><p class="custom-description">Choose a creature, abstract or realistic portrait. Share your ideas and let’s talk about your custom work.</p>${contactForm(true)}</div></section>`, '/custom-portrait/'));

const articlePath = '/journal/exposition-sucy-en-brie/';
const articleTitle = 'Exposition à la galerie éphémère de Sucy-en-Brie';
const articleCopy = 'À Sucy-en-Brie, du 19 au 24 décembre, s’est déroulée la première exposition organisée par Le 12, accueillant les artistes Théotime Plumet, Hugo Besson et Rémi Aldeguer.';
await save('/journal/index.html', layout('Journal', 'Exhibitions and news from the world of Art Fadist.', `<section class="page-intro wrap"><p class="eyebrow">FROM THE WORLD OF FADIST</p><h1>Journal.</h1><p>Exhibitions and moments beyond the frame.</p></section><section class="journal-list wrap"><article><a class="journal-image" href="${articlePath}"><img src="/assets/exhibition.jpg" width="1024" height="598" alt="Art Fadist exhibition at Sucy-en-Brie" loading="lazy"></a><div><p class="eyebrow">EXHIBITION · BY RÉMI ALDEGUER</p><h2><a href="${articlePath}">${articleTitle}</a></h2><p lang="fr">${articleCopy}</p><a class="text-link" href="${articlePath}">Read the story ↗</a></div></article></section>`, '/journal/'));
await save(`${articlePath}index.html`, layout(articleTitle, articleCopy, `<div class="wrap breadcrumb"><a href="/journal/">← Back to the journal</a></div><article class="article wrap" lang="fr"><p class="eyebrow">EXPOSITION · RÉMI ALDEGUER</p><h1>${articleTitle}</h1><img src="/assets/exhibition.jpg" width="1024" height="598" alt="Exposition des œuvres à Sucy-en-Brie" fetchpriority="high"><div class="prose"><h2>Exposition à la maison éphémère de Sucy-en-Brie</h2><p>${articleCopy}</p></div></article>`, articlePath));
await save('/404.html', layout('Page not found', 'Return to the Art Fadist gallery.', `<section class="page-intro wrap not-found"><p class="eyebrow">404</p><h1>This creature<br>has wandered off.</h1><p>The page you are looking for could not be found.</p><a class="button" href="/">Back to the gallery ↗</a></section>`));

// Keep the existing public paths available for a future domain migration.
const aliases = {'/about-me/':'/about/','/get-your-custom-creature-portrait/':'/custom-portrait/','/blog/':'/journal/','/exposition-a-la-galerie-ephemere-de-sucy-en-brie/':articlePath};
for(const [from,to] of Object.entries(aliases)) await save(`${from}index.html`, `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="https://art-fadist.com${to}"><title>Art Fadist</title></head><body><a href="${to}">Continue to Art Fadist</a></body></html>\n`);
const routes=['/','/collection/','/prints/','/about/','/contact/','/custom-portrait/','/journal/',articlePath,...categories.filter(c=>c[0]!=='all').map(([slug])=>`/categorie-produit/${slug}/`),...products.map(pathFor)];
await save('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>https://art-fadist.com${route}</loc></url>`).join('')}</urlset>\n`);
await save('/robots.txt','User-agent: *\nAllow: /\nSitemap: https://art-fadist.com/sitemap.xml\n');
console.log(`Generated ${routes.length} routes and ${products.length} product pages.`);
