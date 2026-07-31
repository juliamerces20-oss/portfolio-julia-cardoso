# Time de SEO — Nina, Zeca, Bia, Téo, Duda, Rafa, Gil e Bru

Time completo de subagentes de SEO para o portfólio de Júlia Cardoso. Parte roda automática via GitHub Actions com a API gratuita do Gemini Flash, parte roda manual via Claude Code.

---

## 1. Pegar a chave gratuita do Gemini

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Faça login com uma conta Google (sem cartão de crédito)
3. Procure por **"Get API Key"** no menu
4. Clique em **"Create API key"**
5. Copie a chave gerada (começa com `AIza...`)

A camada gratuita do Gemini Flash tem limite de requisições por minuto/dia, mas é suficiente pro volume deste pipeline (1x por semana).

---

## 2. Adicionar a chave nos Secrets do GitHub

1. Acesse o repositório no GitHub
2. Vá em **Settings > Secrets and variables > Actions**
3. Clique em **New repository secret**
4. Nome: `GEMINI_API_KEY`
5. Valor: a chave copiada no passo anterior
6. Clique em **Add secret**

Sem esse secret, os workflows `SEO Squad Semanal` falham nas etapas que chamam a API do Gemini.

---

## 3. Quem roda automático (24/7, via GitHub Actions)

| Agente | Workflow | Frequência | Usa API? |
|---|---|---|---|
| **Zeca** (auditoria técnica) | `.github/workflows/seo-auditoria.yml` | Diário, 11h UTC (~08h Brasília) | Não — script Node puro, sem custo |
| **Bia** (sugestão de temas) | `.github/workflows/seo-squad.yml` | Semanal, segunda 13h UTC (~10h Brasília) | Sim — Gemini Flash |
| **Téo** (redação) | `.github/workflows/seo-squad.yml` | Semanal, junto com a Bia | Sim — Gemini Flash |
| **Duda** (revisão do post do Téo) | `.github/workflows/seo-squad.yml` | Semanal, dentro do mesmo pipeline do Téo | Sim — Gemini Flash |

Se o Zeca encontrar um problema **crítico** (🔴), o workflow falha e cria automaticamente uma Issue no repositório com o alerta. Confira os logs do workflow (aba Actions) para o relatório completo — a Issue não vem com o relatório dentro, só o aviso.

Se aprovado pela Duda, o post do Téo entra no final de `blog/posts-bank.json`. **A publicação real como página HTML (`blog/[slug].html`) continua acontecendo pelo pipeline já existente** (`generate-post.js` via `daily-post.yml`), que publica um post por dia a partir do banco. Ou seja: Téo alimenta o banco, o robô diário já existente publica.

Se a Duda reprovar, o post não entra no banco — fica salvo em `docs/posts-rejeitados/[data]-[slug].json` com os problemas apontados, pra auditoria.

---

## 4. Quem roda manual (via Claude Code)

| Agente | Comando/uso |
|---|---|
| **Nina** (pesquisadora) | Peça diretamente: "Nina, atualiza a base de conhecimento de SEO" — ou deixe o Claude Code invocar via descrição da tarefa |
| **Rafa** (linkagem interna) | "Rafa, revisa a linkagem interna do blog" |
| **Gil** (relatórios GA4) | "Gil, faz um relatório de performance orgânica" |
| **Bru** (coerência do conjunto) | "Bru, audita a coerência do time de SEO" — sempre rode por último, depois de qualquer rodada dos outros |
| **Duda** (versão completa) | Além de rodar automático dentro do pipeline do Téo, pode ser chamada manualmente pra revisar qualquer entrega antes de publicar |

Ou rode o time inteiro em sequência com o comando orquestrador:

```
/seo-squad
```

Isso invoca Nina → Zeca → Bia → Téo → Duda → Rafa → Gil → Bru, nessa ordem, e compila tudo em `docs/relatorio-seo-[DATA].md`.

---

## 5. Rodar manualmente qualquer workflow pela aba Actions

1. Acesse o repositório no GitHub
2. Vá na aba **Actions**
3. Selecione o workflow na lista à esquerda (**SEO Squad Semanal** ou **Zeca Auditoria Diaria**)
4. Clique em **Run workflow** (botão cinza à direita)
5. Confirme clicando em **Run workflow** novamente

---

## 6. Testar localmente

```bash
GEMINI_API_KEY=AIza... node seo-strategist.js   # Bia sugere temas → docs/sugestoes-seo-[data].json
GEMINI_API_KEY=AIza... node seo-writer.js       # Téo escreve + Duda revisa → blog/posts-bank.json ou docs/posts-rejeitados/
node zeca-auditoria.js                          # Zeca audita, sem precisar de chave nenhuma
```

Se algo der errado (API fora, JSON inválido, campo faltando), os scripts terminam com exit code 1 e não modificam nada além do que já escreveram até o ponto da falha.

---

## 7. Arquivos envolvidos

| Arquivo | Função |
|---|---|
| `.claude/agents/*.md` | Os 8 subagentes (versão Claude Code, manual ou parte do `/seo-squad`) |
| `.claude/commands/seo-squad.md` | Comando orquestrador `/seo-squad` |
| `.claude/skills/seo-content-creation/SKILL.md` | Estrutura, checklist e tom de voz usados por Téo ao escrever |
| `seo-strategist.js` | Bia automatizada — chama Gemini Flash, sugere temas |
| `seo-writer.js` | Téo automatizado (escreve) + Duda automatizada (revisa) no mesmo pipeline |
| `zeca-auditoria.js` | Zeca automatizado — auditoria técnica sem API |
| `.github/workflows/seo-squad.yml` | Agenda Bia + Téo semanalmente |
| `.github/workflows/seo-auditoria.yml` | Agenda Zeca diariamente, cria Issue se achar problema crítico |
| `docs/seo-knowledge-base.md` | Log cronológico da Nina (criado na primeira rodada dela) |
| `docs/sugestoes-seo-[data].json` | Saída da Bia automatizada |
| `docs/posts-rejeitados/[data]-[slug].json` | Posts que a Duda reprovou, com os motivos |
| `docs/relatorio-seo-[data].md` | Saída compilada do `/seo-squad` completo |
| `blog/posts-bank.json` | Banco de posts (o pipeline diário já existente publica a partir daqui) |

---

## 8. Uma diferença importante em relação ao robô de posts que já existia

O portfólio já tinha um pipeline de publicação diária (`generate-post.js` + `daily-post.yml`, ver `README-BOT.md`) que pega o próximo post não publicado de `blog/posts-bank.json` e vira ele uma página HTML de verdade, todo santo dia. Esse time de SEO **não substitui isso** — Téo só alimenta o banco com temas novos gerados a partir do que Bia identificou como gap. A publicação continua sendo feita pelo robô diário que já existia.
