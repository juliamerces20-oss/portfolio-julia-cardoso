# Blog Bot — Geração Automática de Posts

Gera um post de blog por dia às 09h (horário de Brasília), commita e publica no Vercel automaticamente via GitHub Actions.

---

## 1. Adicionar a chave da API nos Secrets do GitHub

1. Acesse o repositório no GitHub
2. Vá em **Settings > Secrets and variables > Actions**
3. Clique em **New repository secret**
4. Nome: `ANTHROPIC_API_KEY`
5. Valor: sua chave `sk-ant-...`
6. Clique em **Add secret**

Sem esse secret, o workflow falha na etapa de geração e não commita nada.

---

## 2. Rodar manualmente pelo GitHub Actions

1. Acesse o repositório no GitHub
2. Vá na aba **Actions**
3. Selecione o workflow **Gerar Post Diário** na lista à esquerda
4. Clique em **Run workflow** (botão cinza à direita)
5. Confirme clicando em **Run workflow** novamente

O workflow executa, gera o post, commita e faz push. O Vercel detecta o push e faz o deploy automaticamente.

---

## 3. Testar localmente

```bash
ANTHROPIC_API_KEY=sk-ant-... node generate-post.js
```

O script vai:
- Selecionar o tema do dia com base no dia do ano
- Chamar a API Claude e gerar o conteúdo
- Salvar o post em `blog/[slug].html`
- Atualizar `blog/index.html` com o novo post na lista
- Atualizar `sitemap.xml` com a URL do novo post

Se algo der errado (API fora, JSON inválido, campo faltando), o script termina com exit code 1 e não modifica nada além do que já escreveu.

---

## 4. Como funciona o sistema de temas

O script tem um array de 50 temas sobre branding, identidade visual, direção criativa, IA e design. O tema do dia é selecionado pelo índice `diaDoAno % totalTemas`, garantindo que cada dia do ano use um tema diferente e o ciclo se repita sem conflito.

Para adicionar temas novos, edite o array `TEMAS` em `generate-post.js`.

---

## 5. Arquivos envolvidos

| Arquivo | Função |
|---|---|
| `generate-post.js` | Script principal de geração |
| `.github/workflows/daily-post.yml` | Agendamento via GitHub Actions |
| `package.json` | Define `"type": "module"` para ESM |
| `blog/[slug].html` | Post gerado (criado automaticamente) |
| `blog/index.html` | Índice do blog (atualizado automaticamente) |
| `sitemap.xml` | Sitemap SEO (atualizado automaticamente) |
