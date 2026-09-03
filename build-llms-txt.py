#!/usr/bin/env python3
"""
Gera o llms.txt na raiz do site, no formato da spec (llmstxt.org).

A spec pede um Markdown com:
  1. um H1 com o nome do site (obrigatório);
  2. um blockquote com o resumo curto;
  3. prosa livre (sem headings) com o contexto;
  4. seções H2 contendo LISTAS DE LINKS EM MARKDOWN — `- [Nome](url): descrição`.

O item 4 é o que valida no PageSpeed Insights: URLs em texto puro não contam
como link, tem que ser `[texto](url)`.

As URLs dos artigos e os metadados vêm do sitemap.xml + do <title> e da
<meta name="description"> de cada página, então esse arquivo nunca sai de
sincronia com o site.

Rode depois de publicar um artigo novo:  python build-llms-txt.py
"""
import os
import re
import io
import unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://malupepearquitetura.com.br"

CABECALHO = """# Malu Pepe Arquitetura

> Escritório de arquitetura residencial e comercial em São Paulo, fundado em 2007 pela arquiteta Malu Pepe (CAU A212431-9). Mais de 20 anos de experiência em projetos com condução completa, do conceito à entrega.

Malu Pepe é arquiteta formada pela Faculdade de Arquitetura e Urbanismo, com especialização em arquitetura de interiores. O escritório atua em projetos residenciais (apartamentos, casas, studios) e comerciais (escritórios, escolas, estabelecimentos), oferecendo projeto arquitetônico completo, projeto de interiores e decoração, marcenaria sob medida e acompanhamento de obra.

Atendimento em São Paulo capital e região. Contato pelo WhatsApp +55 11 99915-7600 ou pelo Instagram [@malupepearquitetura](https://www.instagram.com/malupepearquitetura/).
"""

PAGINAS = [
    ("Página inicial", SITE + "/",
     "Apresentação do escritório, serviços, portfólio de projetos, depoimentos e FAQ."),
    ("Serviços", SITE + "/#servicos",
     "Projeto arquitetônico residencial e comercial, interiores, marcenaria sob medida e acompanhamento de obra."),
    ("Portfólio", SITE + "/#portfolio",
     "Projetos residenciais e comerciais executados pelo escritório."),
    ("Depoimentos", SITE + "/#depoimentos",
     "Relatos de clientes sobre os projetos entregues."),
    ("Perguntas frequentes", SITE + "/#faq",
     "Dúvidas comuns sobre prazos, custos e etapas de um projeto de arquitetura."),
    ("Contato", SITE + "/#contato",
     "Formulário de contato, WhatsApp e e-mail do escritório."),
    ("Blog", SITE + "/blog/",
     "Índice de todos os artigos sobre arquitetura, interiores e reformas."),
]

OPCIONAIS = [
    ("Sitemap", SITE + "/sitemap.xml", "Lista completa das URLs do site em XML."),
    ("robots.txt", SITE + "/robots.txt", "Regras de rastreamento para crawlers."),
]


def limpa(texto):
    """Normaliza entidades e espaços, e escapa o que quebraria o link Markdown."""
    t = re.sub(r"<[^>]+>", "", texto)  # alguns <title> vieram do WP com <strong>
    t = t.replace("&amp;", "&").replace("&quot;", '"')
    t = t.replace("&#39;", "'").replace("&nbsp;", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t.replace("[", "(").replace("]", ")")


def titulo_limpo(texto):
    """limpa() + remove o sufixo de marca, presente só em parte dos artigos."""
    t = limpa(texto)
    t = re.sub(r"\s*[—–|-]\s*Malu Pepe Arquitetura\s*$", "", t)
    return t.rstrip(" .")


def ordena(titulo):
    """Chave de ordenação que ignora acentos (senão 'Áreas' cai no fim)."""
    base = unicodedata.normalize("NFKD", titulo.lower())
    return "".join(c for c in base if not unicodedata.combining(c))


def resumo(descricao, limite=150):
    """Encurta a meta description para uma linha, cortando na frase."""
    d = limpa(descricao)
    if len(d) <= limite:
        return d
    corte = d[:limite]
    ponto = max(corte.rfind(". "), corte.rfind("! "), corte.rfind("? "))
    if ponto > 60:
        return corte[:ponto + 1]
    espaco = corte.rfind(" ")
    return (corte[:espaco] if espaco > 60 else corte).rstrip(" ,;:") + "…"


def artigos():
    """Lê o sitemap e devolve (titulo, url, descricao) de cada artigo do blog."""
    sitemap = io.open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
    urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    saida = []
    for url in urls:
        if "/blog/" not in url or url.rstrip("/").endswith("/blog"):
            continue
        slug = url.rstrip("/").split("/")[-1]
        caminho = os.path.join(ROOT, "blog", slug + ".html")
        if not os.path.exists(caminho):
            print("  aviso: %s está no sitemap mas não existe em blog/" % slug)
            continue
        html = io.open(caminho, encoding="utf-8").read()
        titulo = re.search(r"<title>(.*?)</title>", html, re.S)
        desc = re.search(r'<meta name="description" content="([^"]*)"', html)
        saida.append((
            titulo_limpo(titulo.group(1)) if titulo else slug,
            url,
            resumo(desc.group(1)) if desc else "",
        ))
    saida.sort(key=lambda x: ordena(x[0]))
    return saida


def secao(titulo, itens):
    linhas = ["## " + titulo, ""]
    for nome, url, desc in itens:
        linhas.append("- [%s](%s)%s" % (nome, url, ": " + desc if desc else ""))
    linhas.append("")
    return "\n".join(linhas)


def main():
    posts = artigos()
    partes = [
        CABECALHO,
        secao("Páginas", PAGINAS),
        secao("Artigos do blog", posts),
        secao("Optional", OPCIONAIS),
    ]
    conteudo = "\n".join(partes).rstrip() + "\n"

    destino = os.path.join(ROOT, "llms.txt")
    with io.open(destino, "w", encoding="utf-8", newline="\n") as f:
        f.write(conteudo)

    links = conteudo.count("](")
    print("llms.txt gerado: %d artigos, %d links, %d bytes"
          % (len(posts), links, len(conteudo.encode("utf-8"))))


if __name__ == "__main__":
    main()
