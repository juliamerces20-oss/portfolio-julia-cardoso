// zeca-auditoria.js — Zeca (auditor técnico automatizado), sem API, sem custo
// Verifica title/meta description/canonical em todos os HTMLs, sitemap.xml sem URL quebrada, alt text em imagens.
// Sai com exit code 1 se encontrar problema crítico (aciona criação de Issue no workflow).
// Uso: node zeca-auditoria.js

import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function listarHtmlsRaiz() {
  return readdirSync(__dirname)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(__dirname, f));
}

function listarHtmlsBlog() {
  const blogDir = path.join(__dirname, 'blog');
  if (!existsSync(blogDir)) return [];
  return readdirSync(blogDir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(blogDir, f));
}

function extrair(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

function extrairImgsSemAlt(html) {
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  return imgs.filter(tag => {
    const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
    return !altMatch || altMatch[1].trim() === '';
  });
}

function auditarArquivo(absPath) {
  const rel = path.relative(__dirname, absPath);
  const html = readFileSync(absPath, 'utf-8');
  const criticos = [];
  const avisos = [];

  const title = extrair(html, /<title>([^<]*)<\/title>/i);
  if (!title) {
    criticos.push(`Sem <title>`);
  } else if (title.length > 60) {
    avisos.push(`<title> com ${title.length} caracteres (recomendado até ~60): "${title}"`);
  }

  const metaDesc = extrair(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (!metaDesc) {
    criticos.push(`Sem <meta name="description">`);
  } else if (metaDesc.length < 120 || metaDesc.length > 155) {
    avisos.push(`meta description com ${metaDesc.length} caracteres (esperado 120-155)`);
  }

  const canonical = extrair(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  if (!canonical) {
    criticos.push(`Sem <link rel="canonical">`);
  }

  const viewport = /<meta\s+name=["']viewport["']/i.test(html);
  if (!viewport) {
    criticos.push(`Sem <meta name="viewport">`);
  }

  const h1s = html.match(/<h1\b[^>]*>/gi) || [];
  if (h1s.length === 0) {
    avisos.push(`Nenhum <h1> encontrado`);
  } else if (h1s.length > 1) {
    avisos.push(`${h1s.length} tags <h1> encontradas (esperado 1)`);
  }

  const imgsSemAlt = extrairImgsSemAlt(html);
  if (imgsSemAlt.length > 0) {
    criticos.push(`${imgsSemAlt.length} <img> sem alt text`);
  }

  return { rel, title, criticos, avisos };
}

function auditarSitemap() {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  const criticos = [];
  const avisos = [];

  if (!existsSync(sitemapPath)) {
    criticos.push('sitemap.xml não encontrado');
    return { criticos, avisos };
  }

  const xml = readFileSync(sitemapPath, 'utf-8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

  if (locs.length === 0) {
    criticos.push('sitemap.xml não contém nenhuma <loc>');
  }

  for (const loc of locs) {
    let urlPath;
    try {
      urlPath = new URL(loc).pathname;
    } catch {
      criticos.push(`URL malformada no sitemap: ${loc}`);
      continue;
    }

    // raiz "/" e "/blog/" mapeiam pra index.html
    let relFsPath = urlPath.replace(/^\/+/, '');
    if (relFsPath === '' || relFsPath.endsWith('/')) {
      relFsPath = path.join(relFsPath, 'index.html');
    }

    const absFsPath = path.join(__dirname, relFsPath);
    if (!existsSync(absFsPath)) {
      criticos.push(`URL do sitemap sem arquivo correspondente: ${loc} (esperado em ${relFsPath})`);
    }
  }

  return { criticos, avisos, totalUrls: locs.length };
}

function main() {
  const arquivos = [...listarHtmlsRaiz(), ...listarHtmlsBlog()];
  console.log(`Zeca auditando ${arquivos.length} arquivos HTML...\n`);

  let totalCriticos = 0;
  let totalAvisos = 0;
  const titulosVistos = new Map();

  for (const absPath of arquivos) {
    const resultado = auditarArquivo(absPath);
    console.log(`### ${resultado.rel}`);

    if (resultado.title) {
      const outro = titulosVistos.get(resultado.title);
      if (outro) {
        resultado.avisos.push(`title duplicado, já usado em ${outro}`);
      } else {
        titulosVistos.set(resultado.title, resultado.rel);
      }
    }

    if (resultado.criticos.length === 0 && resultado.avisos.length === 0) {
      console.log('  🟢 ok');
    }
    for (const c of resultado.criticos) {
      console.log(`  🔴 ${c}`);
      totalCriticos++;
    }
    for (const a of resultado.avisos) {
      console.log(`  🟡 ${a}`);
      totalAvisos++;
    }
    console.log('');
  }

  console.log('### sitemap.xml');
  const sitemapResultado = auditarSitemap();
  if (sitemapResultado.criticos.length === 0) {
    console.log(`  🟢 ok (${sitemapResultado.totalUrls ?? 0} URLs verificadas, nenhuma quebrada)`);
  }
  for (const c of sitemapResultado.criticos) {
    console.log(`  🔴 ${c}`);
    totalCriticos++;
  }
  for (const a of sitemapResultado.avisos) {
    console.log(`  🟡 ${a}`);
    totalAvisos++;
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`Arquivos verificados: ${arquivos.length}`);
  console.log(`🔴 Críticos: ${totalCriticos}`);
  console.log(`🟡 Atenção: ${totalAvisos}`);

  if (totalCriticos > 0) {
    console.error(`\nZeca encontrou ${totalCriticos} problema(s) crítico(s).`);
    process.exit(1);
  }

  console.log('\nNenhum problema crítico encontrado.');
}

main();
