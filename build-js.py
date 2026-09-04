#!/usr/bin/env python3
"""
Minifica os JS do site e aponta o HTML para as versões minificadas.

Para cada js/<nome>.js gera js/<nome>.min.js com esbuild, e reescreve as
referências no HTML:  <script src="js/nav.js">  ->  <script src="js/nav.min.js">
(também na forma "../js/..." usada pelos artigos do blog).

Os arquivos js/<nome>.js continuam sendo a fonte da verdade — edite sempre
eles. Depois de editar qualquer JS, rode:  python build-js.py

Os .min.js precisam ser commitados: o GitHub Pages serve os arquivos como
estão no repositório, não roda build no deploy.

É idempotente: o HTML já apontando para .min.js não é reescrito de novo.
"""
import os
import re
import sys
import glob
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
JS_DIR = os.path.join(ROOT, "js")

# <script src="js/nav.js"> e <script src="../js/nav.js">, mas nunca .min.js
SCRIPT_SRC = re.compile(
    r'(<script\b[^>]*\bsrc=")((?:\.\./)?js/)([A-Za-z0-9_-]+)(\.js")',
    re.I,
)


def fontes():
    """js/*.js, ignorando os .min.js gerados."""
    return sorted(
        p for p in glob.glob(os.path.join(JS_DIR, "*.js"))
        if not p.endswith(".min.js")
    )


def minifica(src, dest):
    exe = "npx.cmd" if os.name == "nt" else "npx"
    try:
        r = subprocess.run(
            [exe, "esbuild", src, "--minify", "--log-level=error"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
    except (OSError, FileNotFoundError):
        return None
    if r.returncode != 0 or not r.stdout.strip():
        sys.stderr.write(r.stderr.decode("utf-8", "replace"))
        return None
    with open(dest, "wb") as f:
        f.write(r.stdout)
    return len(r.stdout)


def paginas():
    alvos = [os.path.join(ROOT, "index.html"), os.path.join(ROOT, "404.html")]
    alvos += glob.glob(os.path.join(ROOT, "blog", "*.html"))
    return [p for p in alvos if os.path.exists(p)]


def main():
    gerados, antes, depois = 0, 0, 0
    for src in fontes():
        nome = os.path.basename(src)[:-3]
        dest = os.path.join(JS_DIR, nome + ".min.js")
        bruto = os.path.getsize(src)
        tam = minifica(src, dest)
        if tam is None:
            print("ERRO: esbuild indisponível. Rode: npm install")
            return 1
        gerados += 1
        antes += bruto
        depois += tam
        print("  %-22s %6dB -> %5dB" % (nome + ".js", bruto, tam))

    reescritos = 0
    for p in paginas():
        with open(p, "r", encoding="utf-8") as f:
            html = f.read()
        novo = SCRIPT_SRC.sub(r"\1\2\3.min\4", html)
        if novo != html:
            with open(p, "w", encoding="utf-8", newline="\n") as f:
                f.write(novo)
            reescritos += 1

    print("\n%d arquivos minificados: %dB -> %dB (-%.0f%%)"
          % (gerados, antes, depois, (1 - depois / antes) * 100))
    print("%d páginas atualizadas (de %d)" % (reescritos, len(paginas())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
