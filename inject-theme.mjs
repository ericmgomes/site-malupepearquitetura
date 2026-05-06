// inject-theme.mjs — adds dark/light theme init + toggle button to all blog article pages

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dir, 'blog');

const INIT_SCRIPT = `  <!-- Prevent flash of wrong theme -->
  <script>(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();</script>`;

const TOGGLE_BTN = `    <button id="theme-toggle" class="ba-theme-toggle" aria-label="Mudar para modo escuro">
      <svg class="icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
      <svg class="icon-sun"  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>`;

const THEME_SCRIPT = `  <script src="../js/theme.js" defer></script>`;

const files = readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

files.forEach(function (filename, i) {
  let html = readFileSync(join(blogDir, filename), 'utf8');

  // 1. Add init script after <meta viewport> (idempotent)
  if (!html.includes('Prevent flash of wrong theme')) {
    html = html.replace(
      /(<meta name="viewport"[^>]*>)/,
      '$1\n' + INIT_SCRIPT
    );
  }

  // 2. Add toggle button to ba-nav after the back link (idempotent)
  if (!html.includes('ba-theme-toggle')) {
    html = html.replace(
      /(<a href="\/blog\/" class="ba-nav__back">.*?<\/a>)/,
      '$1\n' + TOGGLE_BTN
    );
  }

  // 3. Add theme.js before </footer> (idempotent)
  if (!html.includes('theme.js')) {
    html = html.replace('</footer>', '</footer>\n' + THEME_SCRIPT);
  }

  writeFileSync(join(blogDir, filename), html, 'utf8');
  console.log(`  OK [${i + 1}/${files.length}] ${filename}`);
});

console.log('\nDone.');
