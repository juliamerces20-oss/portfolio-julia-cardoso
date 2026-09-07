/**
 * otimizar-imagens.js
 *
 * Converte as imagens pesadas de assets/ para WebP e reduz a largura máxima,
 * guardando os arquivos originais intactos em assets/originais/.
 *
 * Para cada imagem acima do limite de peso, gera dois arquivos:
 *   1. assets/nome.webp  → o que o navegador carrega de verdade
 *   2. assets/nome.png   → a mesma imagem redimensionada, no formato de origem,
 *                          usada como fallback do <picture> em navegador antigo
 *
 * O master intocado fica em assets/originais/nome.png.
 * Rodar de novo é seguro: a leitura sempre parte do master.
 *
 * Uso:  node otimizar-imagens.js
 *       node otimizar-imagens.js --dry    (só mostra o que faria)
 */

import sharp from 'sharp';
import { readdir, mkdir, copyFile, stat, access } from 'node:fs/promises';
import path from 'node:path';

const DIR_ASSETS = 'assets';
const DIR_ORIGINAIS = path.join(DIR_ASSETS, 'originais');
const LIMITE_BYTES = 300 * 1024;   // só mexe em quem passa de 300 KB
const LARGURA_MAX = 2000;          // nenhuma tela precisa de mais que isso
const QUALIDADE = 82;

/* Animação pesa por frame, então recebe teto próprio */
const LARGURA_MAX_ANIMADO = 1200;
const QUALIDADE_ANIMADO = 60;

const EXTENSOES = new Set(['.png', '.jpg', '.jpeg', '.gif']);
const seco = process.argv.includes('--dry');

const kb = (b) => (b / 1024).toFixed(1).padStart(9) + ' KB';
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';

/* Lista as imagens de assets/, ignorando a pasta de originais */
async function listarImagens(dir) {
  const achados = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (path.resolve(caminho) === path.resolve(DIR_ORIGINAIS)) continue;
      achados.push(...(await listarImagens(caminho)));
      continue;
    }
    if (EXTENSOES.has(path.extname(entrada.name).toLowerCase())) achados.push(caminho);
  }
  return achados;
}

const existe = (p) => access(p).then(() => true, () => false);

/* Garante o master em assets/originais/ e devolve o caminho dele */
async function garantirMaster(arquivo) {
  const relativo = path.relative(DIR_ASSETS, arquivo);
  const master = path.join(DIR_ORIGINAIS, relativo);
  if (await existe(master)) return master;
  if (seco) return arquivo;
  await mkdir(path.dirname(master), { recursive: true });
  await copyFile(arquivo, master);
  return master;
}

/* Reencoda no formato de origem, para o fallback do <picture> */
function encodarOriginal(pipeline, ext) {
  if (ext === '.png') return pipeline.png({ compressionLevel: 9, effort: 10 });
  if (ext === '.gif') return pipeline.gif({ colours: 128, effort: 7 });
  return pipeline.jpeg({ quality: QUALIDADE, progressive: true, mozjpeg: true });
}

async function main() {
  const imagens = (await listarImagens(DIR_ASSETS)).sort();
  const linhas = [];
  let totalAntes = 0, totalDepois = 0, ignoradas = 0;

  for (const arquivo of imagens) {
    /* O peso "antes" e o corte de 300 KB saem sempre do master, nunca do
       arquivo em disco, senão uma segunda rodada mediria o próprio resultado. */
    const relativo = path.relative(DIR_ASSETS, arquivo);
    const masterExistente = path.join(DIR_ORIGINAIS, relativo);
    const jaTemMaster = await existe(masterExistente);
    const antes = (await stat(jaTemMaster ? masterExistente : arquivo)).size;
    totalAntes += antes;

    if (antes <= LIMITE_BYTES) {
      totalDepois += antes;
      ignoradas++;
      continue;
    }

    const ext = path.extname(arquivo).toLowerCase();
    const master = await garantirMaster(arquivo);
    const destinoWebp = arquivo.replace(/\.(png|jpe?g|gif)$/i, '.webp');
    const animado = ext === '.gif';

    if (seco) {
      linhas.push({ arquivo, antes, depois: 0, largura: '?' });
      continue;
    }

    const meta = await sharp(master, { animated: animado }).metadata();
    const tetoLargura = animado ? LARGURA_MAX_ANIMADO : LARGURA_MAX;
    const qualidade = animado ? QUALIDADE_ANIMADO : QUALIDADE;
    const precisaEncolher = meta.width > tetoLargura;

    const base = () => {
      const p = sharp(master, { animated: animado });
      return precisaEncolher
        ? p.resize({ width: tetoLargura, withoutEnlargement: true })
        : p;
    };

    /* 1. o WebP, que é o arquivo que o site vai servir */
    await base()
      .webp({ quality: qualidade, effort: 5 })
      .toFile(destinoWebp);

    /* 2. o fallback, no formato de origem e no mesmo tamanho.
       Reencodar nem sempre compensa (GIF animado costuma engordar),
       então o resultado só entra se for menor que o master. */
    const buffer = await encodarOriginal(base(), ext).toBuffer();
    const pesoMaster = (await stat(master)).size;
    if (buffer.length < pesoMaster) {
      await sharp(buffer, { animated: animado }).toFile(arquivo);
    } else if (path.resolve(master) !== path.resolve(arquivo)) {
      await copyFile(master, arquivo);
    }

    const depois = (await stat(destinoWebp)).size;
    totalDepois += depois;
    linhas.push({
      arquivo,
      antes,
      depois,
      largura: precisaEncolher ? `${meta.width} → ${tetoLargura}` : `${meta.width}`
    });
  }

  /* Relatório */
  console.log('\n' + '─'.repeat(74));
  console.log('ARQUIVO'.padEnd(34) + 'ANTES'.padStart(12) + 'DEPOIS'.padStart(12) + 'GANHO'.padStart(9) + '  LARGURA');
  console.log('─'.repeat(74));
  for (const l of linhas.sort((a, b) => b.antes - a.antes)) {
    const ganho = l.depois ? (100 - (l.depois / l.antes) * 100).toFixed(0) + '%' : '--';
    console.log(
      l.arquivo.padEnd(34) + kb(l.antes) + kb(l.depois) + ganho.padStart(9) + '  ' + l.largura
    );
  }
  console.log('─'.repeat(74));
  console.log(`${linhas.length} imagens convertidas, ${ignoradas} abaixo de 300 KB mantidas como estão`);
  console.log(`Antes:  ${mb(totalAntes)}`);
  console.log(`Depois: ${mb(totalDepois)}   (redução de ${(100 - (totalDepois / totalAntes) * 100).toFixed(1)}%)`);
  console.log(`Masters preservados em ${DIR_ORIGINAIS}/\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
