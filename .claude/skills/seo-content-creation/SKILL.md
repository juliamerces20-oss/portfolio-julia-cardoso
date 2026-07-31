---
name: seo-content-creation
description: Use ao escrever qualquer post novo para o blog do portfólio de Júlia Cardoso (blog/posts-bank.json). Define estrutura de SEO on-page, checklist de qualidade e tom de voz para conteúdo do blog.
---

# Criação de conteúdo de SEO — blog Júlia Cardoso

Skill de referência para quem escreve posts novos para `blog/posts-bank.json` (Téo, humano ou automação via Gemini). Consolida o que antes seria uma skill externa — este projeto não depende de nenhum caminho fora do repositório.

## Tom de voz (Brand Bible / Julia Studio)

- Direto, vernáculo carioca natural, sem formalidade excessiva
- **Nunca usar travessão (—) como pontuação.** Trocar por ponto ou reestruturar a frase
- Zero linguagem de coach: nada de "você merece", "sua melhor versão", "faz sentido?"
- Zero emoji, zero clichê genérico
- Frases curtas. Cada parágrafo é uma unidade de pensamento
- Autoridade vem de mostrar processo real, não de afirmar competência

## Estrutura de SEO on-page

| Campo | Regra |
|---|---|
| `title` | Até 60 caracteres, contém a keyword foco, sem clickbait vazio |
| `slug` | kebab-case, sem acento, sem stopword desnecessária, derivado do title |
| `keyword` | Keyword foco curta (2-4 palavras), a que o título e o H1 giram em torno |
| `metaDescription` | Entre 120 e 155 caracteres, resume o ganho real de ler o post, contém a keyword |
| `content` | HTML puro: `<h2>`, `<h3>`, `<p>`, `<strong>`, `<ul>/<li>`. Sem markdown. Sem `<h1>` (o template já gera o H1 a partir do `title`) |

## Estrutura do `content`

1. Abre com um H2 que já entrega a tese central do post, sem enrolação de introdução genérica
2. 3 a 5 blocos H2, cada um uma ideia completa
3. H3 apenas quando um H2 precisa de subdivisão real (não decorativo)
4. `<strong>` para os 2-4 conceitos centrais do post, não para toda frase de efeito
5. Fecha com um parágrafo que aponta uma ação ou conclusão prática, sem call-to-action de venda direta (isso é papel do site, não do post)
6. Tamanho: 500-900 palavras. Post maior que isso só se o tema exigir de verdade

## Checklist antes de considerar o post pronto

- [ ] Zero travessões no `content`
- [ ] Zero dado, estatística ou citação inventada
- [ ] `title` até 60 caracteres, com a keyword
- [ ] `metaDescription` entre 120 e 155 caracteres, contada de verdade
- [ ] `slug` único (não existe outro igual em `blog/posts-bank.json`)
- [ ] Tema não duplica nenhum `title`/`keyword` já existente no banco
- [ ] H2/H3 em ordem lógica, sem pular estrutura
- [ ] Tom bate com o restante do blog (compare com um post já publicado se tiver dúvida)

## Onde o post entra

Este skill não publica nada. O post final (JSON com `title`, `slug`, `keyword`, `metaDescription`, `content`) é adicionado ao **final** do array em `blog/posts-bank.json`. A publicação real em `blog/[slug].html` acontece depois, automaticamente, via `generate-post.js` (rodado pelo workflow `daily-post.yml`).
