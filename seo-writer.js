// seo-writer.js — Téo (redator automatizado) escreve, Duda (revisora automatizada) aprova ou rejeita
// Uso: GEMINI_API_KEY=... node seo-writer.js

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOCS_DIR = path.join(__dirname, 'docs');
const BANK_PATH = path.join(__dirname, 'blog', 'posts-bank.json');
const REJEITADOS_DIR = path.join(DOCS_DIR, 'posts-rejeitados');

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function limparFencesMarkdown(texto) {
  return texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function slugify(texto) {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function chamarGemini(prompt) {
  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!response.ok) {
    const corpoErro = await response.text();
    throw new Error(`Gemini retornou status ${response.status}: ${corpoErro}`);
  }

  const data = await response.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    throw new Error(`Resposta do Gemini sem conteúdo utilizável: ${JSON.stringify(data)}`);
  }
  return texto;
}

function encontrarUltimasSugestoes() {
  if (!existsSync(DOCS_DIR)) return null;
  const arquivos = readdirSync(DOCS_DIR)
    .filter(f => /^sugestoes-seo-.*\.json$/.test(f))
    .sort()
    .reverse();
  if (arquivos.length === 0) return null;
  return path.join(DOCS_DIR, arquivos[0]);
}

function jaTratado(tema, keywordFoco, bank, rejeitadosKeywords) {
  const kwNorm = (keywordFoco || '').toLowerCase().trim();
  const temaNorm = (tema || '').toLowerCase().trim();
  const noBank = bank.some(p =>
    p.keyword?.toLowerCase().trim() === kwNorm ||
    p.title?.toLowerCase().includes(temaNorm)
  );
  const noRejeitados = rejeitadosKeywords.includes(kwNorm);
  return noBank || noRejeitados;
}

function listarKeywordsRejeitadas() {
  if (!existsSync(REJEITADOS_DIR)) return [];
  return readdirSync(REJEITADOS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const conteudo = JSON.parse(readFileSync(path.join(REJEITADOS_DIR, f), 'utf-8'));
        return (conteudo.tentativa?.keyword || '').toLowerCase().trim();
      } catch {
        return '';
      }
    })
    .filter(Boolean);
}

const PROMPT_SISTEMA = `Tom obrigatório: direto, vernáculo carioca natural, sem formalidade excessiva. Nunca usar travessão (—) como pontuação, use ponto ou vírgula. Zero linguagem de coach, zero clichê motivacional ("você merece", "sua melhor versão", "faz sentido?"). Frases curtas. Estrutura em HTML puro: h2 abrindo cada seção, h3 quando precisar subdividir, p para parágrafos, strong para os conceitos centrais. Sem markdown, sem h1 (o template já gera o H1 a partir do title). 500 a 900 palavras.`;

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERRO: variável de ambiente GEMINI_API_KEY não definida.');
    process.exit(1);
  }

  const sugestoesPath = encontrarUltimasSugestoes();
  if (!sugestoesPath) {
    console.error('ERRO: nenhum arquivo docs/sugestoes-seo-*.json encontrado. Rode seo-strategist.js primeiro.');
    process.exit(1);
  }
  console.log(`Lendo sugestões de: ${path.basename(sugestoesPath)}`);
  const sugestoes = JSON.parse(readFileSync(sugestoesPath, 'utf-8'));

  if (!existsSync(BANK_PATH)) {
    console.error(`ERRO: arquivo não encontrado: ${BANK_PATH}`);
    process.exit(1);
  }
  const bank = JSON.parse(readFileSync(BANK_PATH, 'utf-8'));
  const rejeitadosKeywords = listarKeywordsRejeitadas();

  const proximoTema = sugestoes.find(s => !jaTratado(s.tema, s.keyword_foco, bank, rejeitadosKeywords));

  if (!proximoTema) {
    console.log('Todos os temas da última rodada de sugestões já foram escritos ou rejeitados.');
    process.exit(0);
  }

  console.log(`Téo vai escrever sobre: "${proximoTema.tema}" (keyword: ${proximoTema.keyword_foco})`);

  const promptEscrita = `Você é Téo, redator de SEO para o blog de Júlia Cardoso, diretora criativa carioca especializada em branding estratégico, identidade visual e direção criativa para pequenos negócios.

${PROMPT_SISTEMA}

Tema: ${proximoTema.tema}
Keyword foco: ${proximoTema.keyword_foco}
Justificativa/ângulo: ${proximoTema.justificativa || 'não informado'}

Escreva o post completo. Retorne APENAS um JSON, sem markdown, sem texto antes ou depois:
{"title": "até 60 caracteres, com a keyword", "slug": "kebab-case sem acento", "keyword": "${proximoTema.keyword_foco}", "metaDescription": "entre 120 e 155 caracteres", "content": "HTML puro do post"}`;

  let post;
  try {
    const textoEscrita = await chamarGemini(promptEscrita);
    post = JSON.parse(limparFencesMarkdown(textoEscrita));
  } catch (error) {
    console.error('ERRO ao gerar post com o Gemini:', error.message);
    process.exit(1);
  }

  if (!post.title || !post.content || !post.metaDescription) {
    console.error('ERRO: post gerado sem campos obrigatórios.', JSON.stringify(post));
    process.exit(1);
  }

  if (!post.slug) post.slug = slugify(post.title);
  if (!post.keyword) post.keyword = proximoTema.keyword_foco;

  console.log(`Post gerado: "${post.title}" (slug: ${post.slug})`);
  console.log('Enviando para revisão da Duda...');

  const promptRevisao = `Você é Duda, revisora de SEO. Revise este post contra o checklist: zero travessões, zero dados/estatísticas inventadas, tom direto sem clichês de coach, meta description entre 120 e 155 caracteres, título até 60 caracteres.

Post: ${JSON.stringify(post)}

Retorne APENAS: {"aprovado": true ou false, "problemas": []}`;

  let revisao;
  try {
    const textoRevisao = await chamarGemini(promptRevisao);
    revisao = JSON.parse(limparFencesMarkdown(textoRevisao));
  } catch (error) {
    console.error('ERRO ao revisar post com o Gemini:', error.message);
    process.exit(1);
  }

  if (!existsSync(REJEITADOS_DIR)) mkdirSync(REJEITADOS_DIR, { recursive: true });

  if (revisao.aprovado === true) {
    bank.push(post);
    writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2), 'utf-8');
    console.log(`APROVADO por Duda. Post adicionado a blog/posts-bank.json (total: ${bank.length} posts).`);
  } else {
    const dataArquivo = new Date().toISOString().split('T')[0];
    const destino = path.join(REJEITADOS_DIR, `${dataArquivo}-${post.slug}.json`);
    writeFileSync(destino, JSON.stringify({ tentativa: post, problemas: revisao.problemas || [] }, null, 2), 'utf-8');
    console.log(`REPROVADO por Duda. Motivos: ${JSON.stringify(revisao.problemas || [])}`);
    console.log(`Salvo em docs/posts-rejeitados/${dataArquivo}-${post.slug}.json`);
  }
}

main().catch(error => {
  console.error('ERRO COMPLETO:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
