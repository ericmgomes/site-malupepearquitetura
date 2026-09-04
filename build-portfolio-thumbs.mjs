// build-portfolio-thumbs.mjs
// Gera miniaturas das imagens do portfólio e põe srcset nas <img> da grade.
//
// O problema: cada card do portfólio usava a imagem original (1067–1600px,
// 54–302KB) numa caixa de 355x355 no desktop e 150x150 no mobile. A mesma
// imagem serve de miniatura e de primeira foto do lightbox — por isso não dá
// para simplesmente encolher o arquivo.
//
// A grade é quadrada (.portfolio-item__img-wrap { aspect-ratio: 1/1 }) com
// object-fit: cover e object-position: center, então recorte quadrado central
// é exatamente o que aparece na tela — sem pixel desperdiçado. As larguras
// cobrem, com folga para o scale(1.03) do hover:
//   400 → mobile DPR2 (~309px) e desktop DPR1 (~366px)
//   800 → mobile DPR3 (~464px) e desktop DPR2 (~732px)
//
// O lightbox (data-lb-src / data-lb-gallery) continua apontando para os
// originais — lá a imagem é exibida grande.
//
// Rode antes de build-cache-bust.py (que anexa ?v=):
//   node build-portfolio-thumbs.mjs && python build-cache-bust.py

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const HTML = join(ROOT, 'index.html');
const LARGURAS = [400, 800];

const IMG_RE = /<img class="portfolio-item__img"([^>]*?)>/g;
const SRC_RE = /(?<![a-z])src="([^"]+)"/;
// Só as larguras conhecidas: um /-\d+$/ genérico comeria o número da foto
// (ru-jie-01 viraria ru-jie).
const SUFIXO = new RegExp(`-(?:${LARGURAS.join('|')})$`);

/** Caminho do original, a partir de um src que pode já ser uma variante.
 *  É o único ponto que deriva o nome-base — geração e injeção usam este. */
function original(src) {
  return src.split('?')[0].replace(/\.webp$/, '').replace(SUFIXO, '') + '.webp';
}

let html = readFileSync(HTML, 'utf8');
const originais = [];

for (const m of html.matchAll(IMG_RE)) {
  const src = m[1].match(SRC_RE)?.[1];
  if (src) originais.push(original(src));
}
console.log(`${originais.length} miniaturas encontradas`);

let antes = 0, depois = 0;

for (const rel of originais) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { console.warn(`  SKIP (nao existe): ${rel}`); continue; }
  antes += statSync(abs).size;

  for (const w of LARGURAS) {
    const saida = abs.replace(/\.webp$/, `-${w}.webp`);
    await sharp(abs)
      .resize(w, w, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toFile(saida);
    if (w === LARGURAS[0]) depois += statSync(saida).size;
  }
}

/* ── Injeta srcset + sizes, de forma idempotente ── */
let injetados = 0;
html = html.replace(IMG_RE, (tag, attrs) => {
  const src = attrs.match(SRC_RE)?.[1];
  if (!src) return tag;
  const base = original(src).replace(/\.webp$/, '');
  const limpo = attrs
    .replace(/\s*\bsrcset="[^"]*"/, '')
    .replace(/\s*\bsizes="[^"]*"/, '')
    .replace(/\s*(?<![a-z])src="[^"]*"/, '');

  const srcset = LARGURAS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  // 355px na grade do desktop; ~35vw no mobile (150px numa viewport de ~430)
  const sizes = '(min-width: 900px) 355px, 35vw';

  // src aponta para a menor variante, não para o original: é o fallback de
  // quem ignorar o srcset, e não faz sentido esse cliente baixar 1600px.
  // O lightbox não usa este src — ele lê data-lb-src / data-lb-gallery.
  injetados++;
  return `<img class="portfolio-item__img" src="${base}-${LARGURAS[0]}.webp" srcset="${srcset}" sizes="${sizes}"${limpo}>`;
});

writeFileSync(HTML, html, 'utf8');

const kb = (b) => (b / 1024).toFixed(0);
console.log(`srcset injetado em ${injetados} <img>`);
console.log(`peso da 1a variante: ${kb(antes)}KB (originais) -> ${kb(depois)}KB (400px)`);
