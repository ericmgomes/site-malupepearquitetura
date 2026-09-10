// inject-article-nav.mjs
// Reads article order from blog/index.html and injects prev/next nav into each article HTML.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dir, 'blog');

/* ── 1. Parse article list from blog/index.html ── */
const indexHtml = readFileSync(join(blogDir, 'index.html'), 'utf8');

// Extract all slugs from #posts-list (newest → oldest order in file).
//
// A lista guarda o slug SEM .html, que e a URL canonica do artigo. O nome do
// arquivo em disco e o slug + ".html" — a extensao so entra na hora de abrir
// o arquivo, nunca num link. Se a lista voltasse a ter .html, o crawler leria
// esses 65 links no HTML e visitaria as duas formas de cada artigo antes de o
// canonical descartar uma.
const postsListMatch = indexHtml.match(/<ul id="posts-list"[\s\S]*?<\/ul>/);
if (!postsListMatch) { console.error('posts-list not found'); process.exit(1); }

const articles = [];
let m;
const re2 = /<a href="([^"#?]+)">/g;
while ((m = re2.exec(postsListMatch[0])) !== null) {
  articles.push(m[1].replace(/\.html$/, '')); // e.g. "como-otimizar-espacos..."
}

const toFile = (slug) => `${slug}.html`;

console.log(`Found ${articles.length} articles`);

/* ── 2. Inject nav into each article file ── */
// articles[0] = newest, articles[last] = oldest
// Left arrow (←, prev) = older → index + 1
// Right arrow (→, next) = newer → index - 1

const NAV_MARKER = '<!-- ba-article-nav -->';

articles.forEach(function (slug, i) {
  const filepath = join(blogDir, toFile(slug));
  if (!existsSync(filepath)) {
    console.warn(`  SKIP (not found): ${toFile(slug)}`);
    return;
  }

  // replace(/^\uFEFF/, '') — BOM antes do <!DOCTYPE> deixa o HTML malformado
  let html = readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');

  // Remove previously injected nav (idempotent)
  html = html.replace(/<!-- ba-article-nav -->[\s\S]*?<!-- \/ba-article-nav -->\n?/g, '');

  const prevSlug = articles[i + 1]; // older
  const nextSlug = articles[i - 1]; // newer

  const prevHref = prevSlug ? `/blog/${prevSlug}` : null;
  const nextHref = nextSlug ? `/blog/${nextSlug}` : null;

  const prevEl = prevHref
    ? `<a href="${prevHref}" class="ba-article-nav ba-article-nav--prev" title="Artigo anterior">\n  <span class="ba-article-nav__btn">←</span>\n</a>`
    : '';
  const nextEl = nextHref
    ? `<a href="${nextHref}" class="ba-article-nav ba-article-nav--next" title="Próximo artigo">\n  <span class="ba-article-nav__btn">→</span>\n</a>`
    : '';

  const navBlock = `<!-- ba-article-nav -->\n${prevEl}\n${nextEl}\n<!-- /ba-article-nav -->\n`;

  html = html.replace('</body>', `${navBlock}</body>`);

  writeFileSync(filepath, html, 'utf8');
  console.log(`  OK [${i + 1}/${articles.length}] ${slug}`);
});

console.log('\nDone.');
