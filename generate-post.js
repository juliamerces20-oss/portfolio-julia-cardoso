// generate-post.js — Publica o próximo post do banco local (blog/posts-bank.json)
// Uso: node generate-post.js

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL  = 'https://juliacardoso.dsgn';
const BLOG_DIR  = path.join(__dirname, 'blog');
const BANK_PATH = path.join(BLOG_DIR, 'posts-bank.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateBR(date) {
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  return `${String(date.getDate()).padStart(2,'0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateISO(date) {
  const local = new Date(date.getTime() + (-3) * 60 * 60 * 1000);
  return local.toISOString().replace('Z', '-03:00').replace(/\.\d{3}/, '');
}

function formatDateShort(date) {
  return date.toISOString().split('T')[0];
}

function estimateReadTime(html) {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 200));
}

function inferCategory(keyword = '') {
  const kw = keyword.toLowerCase();
  if (kw.includes('ia') || kw.includes('intelig') || kw.includes('artific')) return 'IA APLICADA';
  if (kw.includes('criativ') || kw.includes('audio') || kw.includes('foto') || kw.includes('instagram') || kw.includes('conteúdo')) return 'DIREÇÃO CRIATIVA';
  return 'BRANDING';
}

function categoryToFilter(cat) {
  const map = { 'BRANDING': 'branding', 'DIREÇÃO CRIATIVA': 'direcao', 'IA APLICADA': 'ia' };
  return map[cat] || 'branding';
}

function estimateWordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

// ─── Template HTML ────────────────────────────────────────────────────────────

function gerarHTML(post, date, postNumber, category, readTime) {
  const dateBR    = formatDateBR(date);
  const dateISO   = formatDateISO(date);
  const dateShort = formatDateShort(date);
  const url       = `${BASE_URL}/blog/${post.slug}.html`;
  const wordCount = estimateWordCount(post.content);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${post.title} — Júlia Cardoso</title>
<meta name="description" content="${post.metaDescription}" />
<meta name="keywords" content="${post.keyword}" />
<meta name="author" content="Júlia Cardoso" />
<link rel="canonical" href="${url}" />

<meta property="og:type" content="article" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:title" content="${post.title}" />
<meta property="og:description" content="${post.metaDescription}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Júlia Cardoso" />
<meta property="article:published_time" content="${dateISO}" />
<meta property="article:author" content="Júlia Cardoso" />
<meta property="article:section" content="${category}" />
<meta property="article:tag" content="${post.keyword}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${post.title}" />
<meta name="twitter:description" content="${post.metaDescription}" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${post.title}",
  "description": "${post.metaDescription}",
  "datePublished": "${dateISO}",
  "dateModified": "${dateISO}",
  "author": {
    "@type": "Person",
    "name": "Júlia Cardoso",
    "url": "${BASE_URL}/"
  },
  "publisher": {
    "@type": "Person",
    "name": "Júlia Cardoso"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "${url}"
  },
  "articleSection": "${category}",
  "wordCount": ${wordCount},
  "timeRequired": "PT${readTime}M"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Início", "item": "${BASE_URL}/"},
    {"@type": "ListItem", "position": 2, "name": "Diário", "item": "${BASE_URL}/blog/"},
    {"@type": "ListItem", "position": 3, "name": "${post.title}", "item": "${url}"}
  ]
}
</script>

<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap" rel="stylesheet">
<link rel="stylesheet" href="blog.css">
<link rel="stylesheet" href="post.css">
</head>
<body>

<div id="cursor"></div>

<div class="progress-track"><div class="progress-bar" id="progress"></div></div>

<nav class="nav" id="nav">
  <a href="../index.html" class="nav-brand" data-cursor="hover">JÚLIA CARDOSO</a>
  <div class="nav-links">
    <a href="../index.html#trabalhos" data-cursor="hover">trabalhos</a>
    <a href="index.html" class="active" data-cursor="hover">diário</a>
    <a href="../info.html" data-cursor="hover">info</a>
    <a href="../index.html#contato" data-cursor="hover">contato</a>
  </div>
</nav>

<header class="post-hero">
  <div class="post-hero-inner">
    <div class="crumbs reveal">
      <a href="../index.html" data-cursor="hover">INÍCIO</a>
      <span class="sep">/</span>
      <a href="index.html" data-cursor="hover">DIÁRIO</a>
      <span class="sep">/</span>
      <span>${category}</span>
    </div>
    <div class="post-meta-top reveal">
      <span class="cat">${category}</span>
      <span class="date">${dateBR}</span>
      <span class="time">${readTime} MIN DE LEITURA</span>
    </div>
    <h1 class="post-title reveal">${post.title}.</h1>
    <p class="post-deck reveal">${post.metaDescription}</p>
    <div class="post-author reveal">
      <div class="post-author-avatar">JC</div>
      <div class="post-author-info">
        <div class="post-author-name">Júlia Cardoso</div>
        <div class="post-author-role">Diretora Criativa</div>
      </div>
    </div>
  </div>
</header>

<article class="article">
  <div class="article-inner">
    <div class="article-side">JÚLIA CARDOSO · DIÁRIO · ${date.getFullYear()}</div>

    <div class="article-body">
      ${post.content}
    </div>

    <div class="article-side article-side-right">N°${String(postNumber).padStart(2,'0')} · ${category} · ${readTime} MIN</div>
  </div>
</article>

<section class="post-share">
  <div class="post-share-inner">
    <div class="post-share-label">COMPARTILHAR</div>
    <div class="post-share-links">
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener" data-cursor="hover">TWITTER</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" data-cursor="hover">LINKEDIN</a>
      <a href="https://wa.me/?text=${encodeURIComponent(url)}" target="_blank" rel="noopener" data-cursor="hover">WHATSAPP</a>
      <a href="mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(url)}" data-cursor="hover">EMAIL</a>
    </div>
  </div>
</section>

<section class="related">
  <div class="related-inner">
    <div class="related-label reveal">CONTINUAR LENDO</div>
    <h2 class="related-title reveal">PRÓXIMOS<br/>POSTS.</h2>
    <div class="related-grid">
      <a href="post-branding-essencia.html" class="related-card reveal" data-cursor="hover">
        <div class="related-card-cat">BRANDING</div>
        <div class="related-card-title">Por que sua marca não é o seu logotipo</div>
        <div class="related-card-meta">
          <span>04 MAI 2026 · 6 MIN</span>
          <span class="related-card-arrow">→</span>
        </div>
      </a>
      <a href="post-ia-direcao-criativa.html" class="related-card reveal" data-cursor="hover">
        <div class="related-card-cat">IA APLICADA</div>
        <div class="related-card-title">IA não substitui direção criativa. Substitui execução repetitiva.</div>
        <div class="related-card-meta">
          <span>22 ABR 2026 · 8 MIN</span>
          <span class="related-card-arrow">→</span>
        </div>
      </a>
    </div>
  </div>
</section>

<footer class="footer">
  <span>© JÚLIA CARDOSO ${date.getFullYear()}</span>
  <span><a href="index.html" data-cursor="hover">VOLTAR AO DIÁRIO</a></span>
</footer>

<script src="blog.js"></script>
</body>
</html>`;
}

// ─── Atualizar blog/index.html ────────────────────────────────────────────────

function atualizarBlogIndex(post, date, postNumber, category, readTime) {
  const indexPath = path.join(BLOG_DIR, 'index.html');
  let html = readFileSync(indexPath, 'utf-8');

  const dateBR   = formatDateBR(date);
  const filter   = categoryToFilter(category);
  const num      = String(postNumber).padStart(2, '0');
  const fileName = `${post.slug}.html`;

  const novaLinha = `
    <a href="${fileName}" class="post-row reveal" data-cat="${filter}" data-cursor="hover">
      <div class="post-row-num">N°${num}</div>
      <div class="post-row-title">${post.title}</div>
      <div class="post-row-cat">${category}</div>
      <div class="post-row-meta">${dateBR} · ${readTime} MIN</div>
      <div class="post-row-arrow">→</div>
    </a>`;

  const marker = '  </div>\n</main>';
  if (!html.includes(marker)) {
    console.error('ERRO: marcador de inserção não encontrado em blog/index.html');
    process.exit(1);
  }

  html = html.replace(marker, `${novaLinha}\n\n  ${marker.trim()}`);
  writeFileSync(indexPath, html, 'utf-8');
  console.log('blog/index.html atualizado.');
}

// ─── Atualizar sitemap.xml ────────────────────────────────────────────────────

function atualizarSitemap(post, date) {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  let xml = readFileSync(sitemapPath, 'utf-8');

  const dateShort = formatDateShort(date);
  const url = `${BASE_URL}/blog/${post.slug}.html`;

  const novaUrl = `  <url>
    <loc>${url}</loc>
    <lastmod>${dateShort}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  xml = xml.replace('</urlset>', `${novaUrl}\n</urlset>`);
  writeFileSync(sitemapPath, xml, 'utf-8');
  console.log('sitemap.xml atualizado.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

try {
  // Garante que a pasta blog existe
  if (!existsSync(BLOG_DIR)) mkdirSync(BLOG_DIR, { recursive: true });

  // Lê o banco de posts
  if (!existsSync(BANK_PATH)) {
    console.error(`ERRO: arquivo não encontrado: ${BANK_PATH}`);
    process.exit(1);
  }
  const bank = JSON.parse(readFileSync(BANK_PATH, 'utf-8'));
  console.log(`Banco carregado: ${bank.length} posts.`);

  // Descobre slugs já publicados (arquivos HTML em blog/ que não são index, blog.css, etc.)
  const publicados = new Set(
    readdirSync(BLOG_DIR)
      .filter(f => f.endsWith('.html') && f !== 'index.html')
      .map(f => f.replace(/\.html$/, ''))
  );
  console.log(`Posts já publicados: ${publicados.size}`);

  // Pega o próximo não publicado
  const proximo = bank.find(p => !publicados.has(p.slug));

  if (!proximo) {
    console.log('Todos os posts do banco foram publicados.');
    process.exit(0);
  }

  console.log(`Publicando: "${proximo.title}" (slug: ${proximo.slug})`);

  const hoje      = new Date();
  const category  = inferCategory(proximo.keyword);
  const readTime  = estimateReadTime(proximo.content);
  const postNumber = publicados.size + 1;
  const destPath  = path.join(BLOG_DIR, `${proximo.slug}.html`);

  if (existsSync(destPath)) {
    console.warn(`AVISO: ${proximo.slug}.html já existe. Sobrescrevendo.`);
  }

  writeFileSync(destPath, gerarHTML(proximo, hoje, postNumber, category, readTime), 'utf-8');
  console.log(`Post salvo em blog/${proximo.slug}.html`);

  atualizarBlogIndex(proximo, hoje, postNumber, category, readTime);
  atualizarSitemap(proximo, hoje);

  console.log('Concluído.');
} catch (error) {
  console.error('ERRO COMPLETO:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
