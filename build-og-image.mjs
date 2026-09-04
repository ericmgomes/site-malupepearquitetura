// build-og-image.mjs
// Gera images/hero/malu-hero-og.jpg (1200x630), a imagem de preview usada em
// og:image / twitter:image por todas as páginas.
//
// Decisões que valem lembrar:
//  - JPEG, não WebP: scrapers de rede social (WhatsApp principalmente) têm
//    suporte irregular a WebP em og:image.
//  - Fundo sólido (#F5F3F0, o tema claro do site): og:image com transparência
//    é renderizada sobre preto em várias plataformas.
//  - Fundo claro porque os dois logos do projeto são escuros.
//  - Texto em Georgia, que é o fallback declarado de --font-display no CSS
//    (Cormorant Garamond não está instalada na máquina de build).
//
// Rode se trocar a foto do hero, o logo ou o texto:  node build-og-image.mjs

import sharp from 'sharp';
import { statSync } from 'fs';

const W = 1200, H = 630;
const BG = '#F5F3F0';   // --color-bg (tema claro)
const TXT = '#2C2925';  // --color-text
const ACC = '#8C6E4B';  // --color-accent

const SAIDA = 'images/hero/malu-hero-og.jpg';

const foto = await sharp('images/hero/malu-hero.webp').resize({ height: H }).toBuffer();
const fotoMeta = await sharp(foto).metadata();

const logo = await sharp('images/logo-malupepe.png').resize({ width: 430 }).toBuffer();

const texto = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="84" y="372" font-family="Georgia, serif" font-size="40" fill="${TXT}">Arquitetura residencial</text>
  <text x="84" y="424" font-family="Georgia, serif" font-size="40" fill="${TXT}">e comercial em São Paulo</text>
  <rect x="84" y="462" width="64" height="3" fill="${ACC}"/>
  <text x="84" y="514" font-family="Arial, sans-serif" font-size="21" letter-spacing="1.5" fill="${ACC}">+20 ANOS DE PROJETOS · CAU A212431-9</text>
</svg>`;

await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
  .composite([
    { input: foto, left: W - fotoMeta.width + 40, top: 0 },
    { input: logo, left: 84, top: 172 },
    { input: Buffer.from(texto), left: 0, top: 0 },
  ])
  .jpeg({ quality: 88 })
  .toFile(SAIDA);

const m = await sharp(SAIDA).metadata();
console.log(`${SAIDA}: ${m.width}x${m.height}, ${(statSync(SAIDA).size / 1024).toFixed(0)}KB`);
