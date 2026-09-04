#!/usr/bin/env python3
"""
Adiciona hash de conteúdo às referências de assets locais no HTML.

    <script src="js/nav.min.js">  ->  <script src="js/nav.min.js?v=a1b2c3d4">
    <img src="images/x.webp">     ->  <img src="images/x.webp?v=9f8e7d6c">

Por que: o Cloudflare serve os assets com Cache-Control longo. Como os nomes
dos arquivos são estáveis (nav.min.js, malu-hero.webp), sem isso um visitante
que já esteve no site continuaria recebendo a versão antiga até o cache expirar.
Com o hash, trocar o conteúdo do arquivo muda a URL e o navegador busca de novo.

O hash sai do conteúdo do arquivo: mesmo conteúdo, mesma URL — então quem já
tem em cache não rebaixa nada.

Atributos tratados: src, srcset, data-lb-src, data-lb-gallery (os dois últimos
alimentam a galeria do lightbox; ele os lê como URL literal, sem manipular a
string, então a query string é inofensiva ali).

Rode DEPOIS de build-js.py, para o hash sair do .min.js já gerado:

    python build-inline-css.py && python build-js.py && python build-cache-bust.py

É idempotente: um ?v= já presente é substituído, nunca acumulado.
"""
import os
import re
import glob
import hashlib

ROOT = os.path.dirname(os.path.abspath(__file__))
ATRIBUTOS = ["src", "srcset", "data-lb-src", "data-lb-gallery"]
MULTIPLOS = {"srcset", "data-lb-gallery"}  # valor é lista separada por vírgula
EXTENSOES = (".js", ".css", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".ico")

_cache_hash = {}


def hash_de(caminho_abs):
    if caminho_abs not in _cache_hash:
        with open(caminho_abs, "rb") as f:
            _cache_hash[caminho_abs] = hashlib.sha256(f.read()).hexdigest()[:8]
    return _cache_hash[caminho_abs]


def versiona(url, dir_html):
    """Anexa ?v=<hash> a uma URL local. Devolve a URL intacta se não se aplica."""
    limpa = re.sub(r"\?v=[0-9a-f]{8}$", "", url)
    if limpa.startswith(("http://", "https://", "//", "data:", "#", "mailto:", "tel:")):
        return url
    if "?" in limpa or not limpa.lower().endswith(EXTENSOES):
        return url
    alvo = os.path.normpath(os.path.join(dir_html, limpa))
    if not os.path.exists(alvo):
        print("  aviso: nao encontrado, deixado como esta -> %s" % limpa)
        return url
    return limpa + "?v=" + hash_de(alvo)


def processa_valor(valor, attr, dir_html):
    if attr not in MULTIPLOS:
        return versiona(valor.strip(), dir_html)
    saida = []
    for parte in valor.split(","):
        p = parte.strip()
        if not p:
            continue
        pedacos = p.split(None, 1)          # "img.webp 590w" -> url + descritor
        nova = versiona(pedacos[0], dir_html)
        saida.append(nova + (" " + pedacos[1] if len(pedacos) > 1 else ""))
    return ", ".join(saida)


def processa(path_rel):
    full = os.path.join(ROOT, path_rel)
    dir_html = os.path.dirname(full)
    with open(full, "r", encoding="utf-8") as f:
        html = f.read()
    orig = html

    for attr in ATRIBUTOS:
        padrao = re.compile(r'(\b' + re.escape(attr) + r'=")([^"]*)(")', re.S)
        html = padrao.sub(
            lambda m: m.group(1) + processa_valor(m.group(2), attr, dir_html) + m.group(3),
            html,
        )

    if html != orig:
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(html)
        return True
    return False


def main():
    alvos = ["index.html", "404.html"] + [
        os.path.relpath(p, ROOT).replace("\\", "/")
        for p in glob.glob(os.path.join(ROOT, "blog", "*.html"))
    ]
    alvos = [a for a in alvos if os.path.exists(os.path.join(ROOT, a))]
    mudou = sum(1 for a in alvos if processa(a))
    print("%d páginas processadas, %d atualizadas, %d assets com hash."
          % (len(alvos), mudou, len(_cache_hash)))


if __name__ == "__main__":
    main()
