import { readdir } from 'fs/promises';
import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

const BLOG_DIR = './blog';
const BASE_URL = 'https://malupepearquitetura.com.br';
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/hero/malu-hero-og.webp`;
const AUTHOR = 'Malu Pepe';

const files = (await readdir(BLOG_DIR))
  .filter(f => f.endsWith('.html') && f !== 'index.html');

const monthsPT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

for (const file of files) {
  const path = `${BLOG_DIR}/${file}`;
  const slug = basename(file, '.html');
  const url  = `${BASE_URL}/blog/${slug}`;
  let html = readFileSync(path, 'utf8');

  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/s);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // Extract date
  const dateMatch = html.match(/class="ba-date">(.*?)<\/span>/);
  let dateISO = '';
  if (dateMatch) {
    // parse "7 dez 2024" → ISO
    const parts = dateMatch[1].trim().split(' ');
    if (parts.length === 3) {
      const mon = monthsPT.indexOf(parts[1].toLowerCase()) + 1;
      dateISO = `${parts[2]}-${String(mon).padStart(2,'0')}-${String(parts[0]).padStart(2,'0')}`;
    }
  }

  // Extract plain text description from ba-body (first ~160 chars)
  const bodyMatch = html.match(/<div class="ba-body">(.*?)<\/div>/s);
  let description = '';
  if (bodyMatch) {
    description = bodyMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160)
      .replace(/\s\S*$/, '…'); // don't cut mid-word
  }

  // Build meta tags block
  const metaTags = `
  <!-- SEO -->
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">

  <!-- Open Graph -->
  <meta property="og:type"        content="article">
  <meta property="og:title"       content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url"         content="${url}">
  <meta property="og:image"       content="${DEFAULT_OG_IMAGE}">
  <meta property="og:locale"      content="pt_BR">
  <meta property="og:site_name"   content="Malu Pepe Arquitetura">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image"       content="${DEFAULT_OG_IMAGE}">`;

  // Build Schema Article
  const schema = `
  <!-- Schema.org Article -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title.replace(/"/g, '\\"')}",
    "description": "${description.replace(/"/g, '\\"')}",
    "url": "${url}",${dateISO ? `\n    "datePublished": "${dateISO}",\n    "dateModified": "${dateISO}",` : ''}
    "author": {
      "@type": "Person",
      "name": "${AUTHOR}",
      "url": "${BASE_URL}/#sobre"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Malu Pepe Arquitetura",
      "url": "${BASE_URL}",
      "logo": {
        "@type": "ImageObject",
        "url": "${DEFAULT_OG_IMAGE}"
      }
    },
    "image": "${DEFAULT_OG_IMAGE}",
    "mainEntityOfPage": "${url}"
  }
  </script>`;

  // Inject before </head> (skip if already enriched)
  if (html.includes('og:type')) {
    console.log(`SKIP (already enriched): ${file}`);
    continue;
  }

  html = html.replace('</head>', `${metaTags}\n${schema}\n</head>`);
  writeFileSync(path, html, 'utf8');
  console.log(`OK: ${file}`);
}

console.log(`\nDone. ${files.length} articles processed.`);
