// seo-strategist.js — Bia (automatizada): sugere temas novos de SEO via Gemini Flash
// Uso: GEMINI_API_KEY=... node seo-strategist.js

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BANK_PATH = path.join(__dirname, 'blog', 'posts-bank.json');
const KB_PATH = path.join(__dirname, 'docs', 'seo-knowledge-base.md');
const DOCS_DIR = path.join(__dirname, 'docs');

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function limparFencesMarkdown(texto) {
  return texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function resumoKnowledgeBase(conteudo, maxEntradas = 8) {
  // Entradas são separadas por "## " (log cronológico, mais recente no topo — ver nina-pesquisadora)
  const blocos = conteudo.split(/\n(?=## )/).filter(b => b.trim().startsWith('## '));
  return blocos.slice(0, maxEntradas).join('\n\n');
}

function formatarDataArquivo(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERRO: variável de ambiente GEMINI_API_KEY não definida.');
    process.exit(1);
  }

  if (!existsSync(BANK_PATH)) {
    console.error(`ERRO: arquivo não encontrado: ${BANK_PATH}`);
    process.exit(1);
  }

  const bank = JSON.parse(readFileSync(BANK_PATH, 'utf-8'));
  const titulosCobertos = bank.map(p => `- ${p.title} (keyword: ${p.keyword})`).join('\n');
  console.log(`Banco carregado: ${bank.length} posts já cobertos.`);

  let resumoKB = 'Nenhuma base de conhecimento encontrada ainda.';
  if (existsSync(KB_PATH)) {
    const kbConteudo = readFileSync(KB_PATH, 'utf-8');
    resumoKB = resumoKnowledgeBase(kbConteudo) || 'Base de conhecimento existe mas está vazia.';
  }

  const prompt = `Você é Bia, estrategista de SEO para o blog de Júlia Cardoso, diretora criativa carioca especializada em branding estratégico, identidade visual e direção criativa para pequenos negócios.

Temas já cobertos:
${titulosCobertos}

Conhecimento atualizado sobre SEO (entradas mais recentes):
${resumoKB}

Sugira 5 novos temas ainda não cobertos, com potencial de busca real. Retorne APENAS um JSON array, sem markdown, sem texto antes ou depois: [{"tema": "...", "keyword_foco": "...", "justificativa": "..."}]`;

  console.log('Chamando Gemini Flash...');

  let response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
  } catch (error) {
    console.error('ERRO: falha de rede ao chamar a API do Gemini.', error.message);
    process.exit(1);
  }

  if (!response.ok) {
    const corpoErro = await response.text();
    console.error(`ERRO: Gemini retornou status ${response.status}.`, corpoErro);
    process.exit(1);
  }

  const data = await response.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!texto) {
    console.error('ERRO: resposta do Gemini sem conteúdo utilizável.', JSON.stringify(data));
    process.exit(1);
  }

  let sugestoes;
  try {
    sugestoes = JSON.parse(limparFencesMarkdown(texto));
  } catch (error) {
    console.error('ERRO: resposta do Gemini não é um JSON válido.', error.message);
    console.error('Texto recebido:', texto);
    process.exit(1);
  }

  if (!Array.isArray(sugestoes) || sugestoes.length === 0) {
    console.error('ERRO: Gemini não retornou um array de sugestões válido.');
    process.exit(1);
  }

  if (!existsSync(DOCS_DIR)) {
    console.error(`ERRO: pasta não encontrada: ${DOCS_DIR}`);
    process.exit(1);
  }

  const nomeArquivo = `sugestoes-seo-${formatarDataArquivo(new Date())}.json`;
  const destino = path.join(DOCS_DIR, nomeArquivo);
  writeFileSync(destino, JSON.stringify(sugestoes, null, 2), 'utf-8');

  console.log(`Bia sugeriu ${sugestoes.length} temas novos.`);
  console.log(`Salvo em docs/${nomeArquivo}`);
}

main().catch(error => {
  console.error('ERRO COMPLETO:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
