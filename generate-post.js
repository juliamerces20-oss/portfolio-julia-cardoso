// generate-post.js — Geração automática de posts de blog para Júlia Cardoso
// Uso: ANTHROPIC_API_KEY=sk-... node generate-post.js

import fs from 'fs';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Checagem de ambiente ────────────────────────────────────────────────────

console.log("API Key presente:", !!process.env.ANTHROPIC_API_KEY);
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERRO: ANTHROPIC_API_KEY não encontrada");
  process.exit(1);
}

if (typeof fetch === 'undefined') {
  console.error("ERRO: fetch não disponível neste ambiente Node");
  process.exit(1);
}

// ─── Configuração ────────────────────────────────────────────────────────────

const BASE_URL = 'https://juliacardoso.dsgn';

const TEMAS = [
  'branding estratégico para pequenos negócios',
  'identidade visual: o que vai além do logotipo',
  'direção criativa aplicada a redes sociais',
  'como construir um sistema de identidade do zero',
  'naming: como escolher o nome certo para uma marca',
  'design brutalista e sua ascensão no branding contemporâneo',
  'moodboard como ferramenta estratégica de posicionamento',
  'paleta de cores e o que ela comunica antes das palavras',
  'tipografia de marca: como a fonte fala antes do texto',
  'IA no processo criativo: o que muda e o que não muda',
  'funil de branding: como a identidade visual converte',
  'posicionamento de marca para profissionais criativos',
  'conteúdo para Instagram com direção criativa de verdade',
  'vídeo para marcas: linguagem visual em movimento',
  'sistemas de identidade: o que faz uma marca durar',
  'design para negócios de serviço: os erros mais comuns',
  'como auditar a identidade visual do seu negócio',
  'rebranding: quando faz sentido e quando é desperdício',
  'brand voice: como sua marca soa antes de você falar',
  'consistência de marca em múltiplos canais digitais',
  'o papel do espaço em branco no design de marca',
  'direção de arte para editorial de marca',
  'como briefar um projeto de identidade visual',
  'marca pessoal para diretores criativos e designers',
  'hierarquia visual: o que o olho vê primeiro e por quê',
  'design responsivo de identidade: do digital ao impresso',
  'colaboração entre designer e cliente: o que funciona',
  'tendências de branding que têm substância de verdade',
  'como medir se uma identidade visual está funcionando',
  'logo system: quando um símbolo não é suficiente',
  'onboarding de marca: como entregar além do manual',
  'cor preta no branding: minimalismo ou posicionamento',
  'design para luxury brands: o que é diferente',
  'brand equity: o valor invisível que o design constrói',
  'arquitetura de marca: masterbrand vs. portfólio',
  'design thinking aplicado à estratégia de marca',
  'como criar um kit de marca que o cliente realmente usa',
  'fotografia de marca: direção visual para ensaios editoriais',
  'tom de voz e identidade verbal como parte do sistema',
  'design de embalagem como extensão da identidade visual',
  'marca e cultura: quando os valores viram forma',
  'pitch de branding: como apresentar sua proposta criativa',
  'identidade visual para startups em estágio inicial',
  'como a escolha de papel e acabamento fala pela marca',
  'sensory branding: quando a marca ultrapassa o visual',
  'brand guidelines que as pessoas realmente seguem',
  'o que diferencia design gráfico de design estratégico',
  'como documentar decisões de design para o cliente',
  'transição de marca: como comunicar uma mudança de identidade',
];

const SYSTEM_PROMPT = `Você é um especialista em SEO e branding estratégico escrevendo para o blog de Júlia Cardoso, diretora criativa carioca. Escreva sempre em português brasileiro. Tom: direto, sem coach motivacional, sem frases vazias, com autoridade e leveza. Sem travessões. Conteúdo útil e original, feito para pessoas primeiro. Siga o framework SEO: título com palavra-chave foco (até 60 chars), meta description (120-155 chars), estrutura com H2 e H3, parágrafos curtos, CTA ao final apontando para contato ou portfólio. Retorne APENAS um objeto JSON válido com os campos: title, slug, metaDescription, keyword, category, readTime (número inteiro de minutos), content (HTML limpo com H2/H3/p/strong/ol/ul/li, sem html/head/body tags, sem markdown, sem blocos de código).`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function formatDateBR(date) {
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  return `${String(date.getDate()).padStart(2,'0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateISO(date) {
  const offset = -3; // Brasília
  const local = new Date(date.getTime() + offset * 60 * 60 * 1000);
  return local.toISOString().replace('Z', '-03:00').replace(/\.\d{3}/, '');
}

function formatDateShort(date) {
  return date.toISOString().split('T')[0];
}

function estimateWordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function categoryToFilter(cat) {
  const map = {
    'BRANDING': 'branding',
    'DIREÇÃO CRIATIVA': 'direcao',
    'IA APLICADA': 'ia',
    'APPS & FERRAMENTAS': 'apps',
  };
  return map[cat?.toUpperCase()] || 'branding';
}

// ─── API Claude ───────────────────────────────────────────────────────────────

async function gerarConteudo(tema, dataHoje) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log(`Chamando API Claude para o tema: "${tema}"...`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Gere um post de blog sobre: ${tema}. Data: ${dataHoje}. Retorne apenas JSON válido.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`ERRO na API Claude (${response.status}): ${err}`);
    process.exit(1);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text;

  if (!rawText) {
    console.error('ERRO: resposta vazia da API Claude.');
    process.exit(1);
  }

  // Remove possível markdown fence ```json ... ```
  const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let post;
  try {
    post = JSON.parse(clean);
  } catch (e) {
    console.error('ERRO: JSON inválido retornado pela API:\n', clean);
    process.exit(1);
  }

  const required = ['title', 'slug', 'metaDescription', 'keyword', 'content'];
  for (const field of required) {
    if (!post[field]) {
      console.error(`ERRO: campo obrigatório ausente no JSON: "${field}"`);
      process.exit(1);
    }
  }

  return post;
}

// ─── Template HTML do post ────────────────────────────────────────────────────

function gerarHTML(post, date, postNumber) {
  const dateBR = formatDateBR(date);
  const dateISO = formatDateISO(date);
  const dateShort = formatDateShort(date);
  const fileName = `${post.slug}.html`;
  const url = `${BASE_URL}/blog/${fileName}`;
  const category = (post.category || 'BRANDING').toUpperCase();
  const readTime = post.readTime || 6;
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

function atualizarBlogIndex(post, date, postNumber) {
  const indexPath = path.join(__dirname, 'blog', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  const dateBR = formatDateBR(date);
  const category = (post.category || 'BRANDING').toUpperCase();
  const filter = categoryToFilter(category);
  const readTime = post.readTime || 6;
  const num = String(postNumber).padStart(2, '0');
  const fileName = `${post.slug}.html`;

  const novaLinha = `
    <a href="${fileName}" class="post-row reveal" data-cat="${filter}" data-cursor="hover">
      <div class="post-row-num">N°${num}</div>
      <div class="post-row-title">${post.title}</div>
      <div class="post-row-cat">${category}</div>
      <div class="post-row-meta">${dateBR} · ${readTime} MIN</div>
      <div class="post-row-arrow">→</div>
    </a>`;

  // Insere antes do fechamento </div>\n</main>
  const marker = '  </div>\n</main>';
  if (!html.includes(marker)) {
    console.error('ERRO: marcador de inserção não encontrado em blog/index.html');
    process.exit(1);
  }

  html = html.replace(marker, `${novaLinha}\n\n  ${marker.trim()}`);
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('blog/index.html atualizado.');
}

// ─── Atualizar sitemap.xml ────────────────────────────────────────────────────

function atualizarSitemap(post, date) {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  let xml = fs.readFileSync(sitemapPath, 'utf-8');

  const dateShort = formatDateShort(date);
  const url = `${BASE_URL}/blog/${post.slug}.html`;

  const novaUrl = `  <url>
    <loc>${url}</loc>
    <lastmod>${dateShort}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  // Insere antes do fechamento </urlset>
  xml = xml.replace('</urlset>', `${novaUrl}\n</urlset>`);
  fs.writeFileSync(sitemapPath, xml, 'utf-8');
  console.log('sitemap.xml atualizado.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const hoje = new Date();
    const diaDoAno = getDayOfYear(hoje);
    const tema = TEMAS[diaDoAno % TEMAS.length];
    const dataHoje = formatDateShort(hoje);

    console.log(`Data: ${dataHoje}`);
    console.log(`Dia do ano: ${diaDoAno}`);
    console.log(`Tema selecionado: "${tema}"`);

    // Garante que a pasta blog existe
    const blogDir = path.join(__dirname, 'blog');
    if (!existsSync(blogDir)) mkdirSync(blogDir, { recursive: true });

    // Gera conteúdo via API
    const post = await gerarConteudo(tema, dataHoje);
    console.log(`Post gerado: "${post.title}" (slug: ${post.slug})`);

    // Descobre o número do próximo post
    const existentes = fs.readdirSync(blogDir).filter(f => f.startsWith('post-') && f.endsWith('.html'));
    const postNumber = existentes.length + 1;

    // Salva o arquivo HTML do post
    const fileName = `${post.slug}.html`;
    const destPath = path.join(blogDir, fileName);

    if (fs.existsSync(destPath)) {
      console.warn(`AVISO: arquivo ${fileName} já existe. Sobrescrevendo.`);
    }

    const html = gerarHTML(post, hoje, postNumber);
    fs.writeFileSync(destPath, html, 'utf-8');
    console.log(`Post salvo em blog/${fileName}`);

    // Atualiza índice e sitemap
    atualizarBlogIndex(post, hoje, postNumber);
    atualizarSitemap(post, hoje);

    console.log('Concluído.');
  } catch (error) {
    console.error("ERRO COMPLETO:", error);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

main();
