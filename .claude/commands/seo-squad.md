---
description: Roda o time completo de SEO em sequência - Nina, Zeca, Bia, Téo, Duda, Rafa, Gil e Bru
---

Rode o time completo de SEO do portfólio de Júlia Cardoso, em sequência, cada agente com seu subagente correspondente em `.claude/agents/`:

1. **Nina** (`nina-pesquisadora`) — atualiza `docs/seo-knowledge-base.md` com o que há de mais recente em SEO.
2. **Zeca** (`zeca-auditor`) — audita a saúde técnica do site inteiro.
3. **Bia** (`bia-estrategista`) — usa o que Nina trouxe e o que Zeca encontrou para sugerir os próximos temas.
4. **Téo** (`teo-redator`) — escreve o(s) post(s) dos temas priorizados por Bia, adiciona a `blog/posts-bank.json`.
5. **Duda** (`duda-revisora`) — revisão individual: audita o que Téo escreveu, o que Bia sugeriu e confere os achados do Zeca.
6. **Rafa** (`rafa-linkagem`) — analisa e melhora a linkagem interna considerando o que mudou.
7. **Gil** (`gil-relatorios`) — puxa dados reais de performance via GA4 para contextualizar as decisões.
8. **Bru** (`bru-mestre`) — audita a coerência do conjunto inteiro, sempre por último.

Depois de rodar todos, compile os relatórios em um único arquivo `docs/relatorio-seo-[DATA].md` (data no formato `AAAA-MM-DD`), nesta ordem:

```markdown
# Relatório SEO Squad — [DATA]

## Resumo executivo (Bru)
[relatório de coerência do Bru, na íntegra]

## Nina — Pesquisa
[relatório da Nina]

## Zeca — Auditoria técnica
[relatório do Zeca]

## Bia — Estratégia
[relatório da Bia]

## Téo — Redação
[o que foi escrito/adicionado ao banco]

## Duda — Revisão
[vereditos da Duda]

## Rafa — Linkagem interna
[relatório do Rafa]

## Gil — Performance
[relatório do Gil, ou aviso de que não houve acesso ao GA4]
```

Se algum agente não puder rodar (ex: Gil sem acesso ao GA4), registre isso explicitamente no relatório em vez de pular a seção silenciosamente. Nunca marque a rodada como concluída se o relatório final do Bru for 🔴 CONTRADIÇÃO sem antes reportar isso claramente à Júlia.
