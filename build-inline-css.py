#!/usr/bin/env python3
"""
Otimização de render-blocking para o site inteiro (home + blog).

Para cada página:
  1. Torna o <link> do Google Fonts assíncrono (media=print + onload), com
     fallback <noscript>.
  2. Inlina os CSS locais (css/*.css e blog/article.css) num único <style>,
     entre os marcadores <!-- INLINE-CSS:START files=... --> ... END,
     minificados com esbuild (os arquivos-fonte seguem legíveis).

Os arquivos em css/ e blog/article.css continuam sendo a fonte da verdade.
Sempre que editar qualquer CSS, rode:  python build-inline-css.py

É idempotente: pode rodar quantas vezes quiser. A lista de CSS de cada página
fica gravada no próprio marcador (files=...), então re-rodar só atualiza o
conteúdo inline a partir dos arquivos-fonte.
"""
import os
import re
import sys
import glob
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
_MINIFY_OK = True  # vira False se o esbuild nao estiver disponivel

# Página -> lista ordenada de CSS (caminhos relativos à raiz do repo, p/ leitura)
def css_for(path_rel):
    if path_rel == "index.html":
        return ["css/base.css", "css/components.css", "css/sections.css", "css/responsive.css"]
    if path_rel == "404.html":
        return ["css/base.css", "css/components.css"]
    if path_rel == "blog/index.html":
        return ["css/base.css", "css/components.css"]
    if path_rel.startswith("blog/"):
        return ["css/base.css", "css/components.css", "blog/article.css"]
    return []

START_RE = re.compile(r"<!--\s*INLINE-CSS:START[^>]*-->", re.I)
END = "<!-- INLINE-CSS:END -->"
# <link rel="stylesheet" href="LOCAL"> (não http) — em qualquer ordem de atributos
LOCAL_CSS_LINK = re.compile(
    r'[ \t]*<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="(?!https?:)[^"]+")[^>]*>[ \t]*\r?\n?',
    re.I,
)
# Detecta que a transformação já foi aplicada: o <link> do Google Fonts com
# media="print". Sem essa guarda, uma segunda execução casaria o <link> de
# dentro do <noscript> (que não tem media="print") e aninharia outro <noscript>.
FONT_ALREADY_ASYNC = re.compile(
    r'<link\b(?=[^>]*\bhref="https://fonts\.googleapis\.com/css2[^"]*")(?=[^>]*\bmedia="print")[^>]*>',
    re.I,
)
# <link ... href="GOOGLE FONTS" ...> stylesheet (qualquer ordem), ainda não async
FONT_LINK = re.compile(
    r'<link\b(?![^>]*\bmedia="print")(?=[^>]*\bhref="(https://fonts\.googleapis\.com/css2[^"]*)")(?=[^>]*\brel="stylesheet")[^>]*>',
    re.I,
)


def minify_css(css):
    """Minifica via esbuild. Sem esbuild, devolve o CSS como está.

    Não dá para minificar com regex aqui: o projeto usa calc(), url(data:...)
    e content:, casos em que remover espaço muda o significado ou corrompe o
    valor. O esbuild é devDependency — nada disso vai para o site.
    """
    global _MINIFY_OK
    exe = "npx.cmd" if os.name == "nt" else "npx"
    try:
        r = subprocess.run(
            [exe, "esbuild", "--minify", "--loader=css", "--log-level=error"],
            input=css.encode("utf-8"),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
    except (OSError, FileNotFoundError):
        _MINIFY_OK = False
        return css
    if r.returncode != 0 or not r.stdout.strip():
        _MINIFY_OK = False
        sys.stderr.write(r.stderr.decode("utf-8", "replace"))
        return css
    return r.stdout.decode("utf-8").strip()


def read_css(files):
    parts = []
    for rel in files:
        # utf-8-sig descarta o BOM na leitura; sem isso ele viraria lixo no
        # meio do CSS concatenado
        with open(os.path.join(ROOT, rel), "r", encoding="utf-8-sig") as f:
            parts.append(f.read().strip())
    return minify_css("\n\n".join(parts))


def make_font_async(html):
    if FONT_ALREADY_ASYNC.search(html):
        return html  # idempotente: já processado numa execução anterior

    def repl(m):
        href = m.group(1)
        return (
            f'<link rel="stylesheet" href="{href}" media="print" onload="this.media=\'all\'">'
            f'<noscript><link rel="stylesheet" href="{href}"></noscript>'
        )
    return FONT_LINK.sub(repl, html, count=1)


def inline_css(html, files):
    style = "<style>\n" + read_css(files) + "\n  </style>"
    marker_open = f'<!-- INLINE-CSS:START files={",".join(files)} -->'
    block = f"{marker_open}\n  {style}\n  {END}"

    if START_RE.search(html) and END in html:
        # Já inlinado: regenera entre os marcadores
        return re.sub(
            START_RE.pattern + r".*?" + re.escape(END),
            lambda _: block,
            html,
            count=1,
            flags=re.DOTALL | re.I,
        )

    # Primeira vez: substitui a sequência de <link> CSS locais pelo bloco
    matches = list(LOCAL_CSS_LINK.finditer(html))
    if not matches:
        return html
    start = matches[0].start()
    end = matches[-1].end()
    return html[:start] + block + "\n" + html[end:]


def process(path_rel):
    files = css_for(path_rel)
    if not files:
        return None
    full = os.path.join(ROOT, path_rel)
    with open(full, "r", encoding="utf-8-sig") as f:
        html = f.read()
    orig = html
    html = make_font_async(html)
    html = inline_css(html, files)
    if html != orig:
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(html)
        return True
    return False


def main():
    targets = ["index.html", "404.html"] + [
        os.path.relpath(p, ROOT).replace("\\", "/")
        for p in glob.glob(os.path.join(ROOT, "blog", "*.html"))
    ]
    changed = 0
    for t in targets:
        r = process(t)
        if r:
            changed += 1
    print(f"OK: {len(targets)} páginas processadas, {changed} atualizadas.")
    if not _MINIFY_OK:
        print("AVISO: esbuild indisponível — CSS inlinado sem minificar.")
        print("       Rode: npm install")


if __name__ == "__main__":
    main()
