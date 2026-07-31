# Regras do projeto — Portfólio Júlia Cardoso

## Regra crítica: TUDO no grid

**Proibido qualquer elemento fora do grid.** Nada de elementos flutuantes sem alinhamento, nada de margens "no olho", nada de textos que não compartilham eixo vertical ou horizontal com outros elementos.

Toda peça do site (texto, imagem, número, caption, botão) precisa:
- Compartilhar uma coluna ou linha do grid com outro elemento, OU
- Alinhar-se ao topo / base / lateral de algo já existente.

Ao adicionar qualquer coisa nova, primeiro identifique a qual grid/coluna/linha ela pertence. Se não há grid claro, crie um antes de posicionar.

## Texto pareado com imagem

Quando uma coluna de texto está pareada com uma imagem na mesma linha de grid: o texto **começa no topo da imagem e termina na base da imagem**. Distribuir o conteúdo via `flex-direction: column; justify-content: space-between` e fazer o container do texto esticar (`align-items: stretch` na grid).

## Idioma
Todo o conteúdo do site em **português brasileiro**.

## Identidade visual
- Fundo: `#0A0A0A`
- Texto principal: `#F5F5F5`
- Acento: `#E63230` (vermelho)
- Tipos: `Unbounded` (display) + `DM Sans` (corpo)

## Time de SEO

Subagentes especializados em `.claude/agents/`, orquestrados pelo comando `/seo-squad`. Ver `README-SEO-BOT.md` para detalhes de execução (automática vs. manual).

- **Nina** — pesquisadora. Cética, checa fonte antes de acreditar. Mantém `docs/seo-knowledge-base.md` atualizado. Manual.
- **Zeca** — auditor técnico. Metódico, aponta arquivo e linha, não floreia problema. Automático, diário.
- **Bia** — estrategista. Pragmática, prefere 3 temas certeiros a 20 genéricos. Automático, semanal.
- **Téo** — redator. Direto, carioca, escreve como quem já fez o trabalho. Automático, semanal.
- **Duda** — revisora. Cética por padrão, nunca aprova por educação. Automática dentro do pipeline semanal + versão manual completa.
- **Rafa** — linkagem interna. Pensa em estrutura, só linka onde faz sentido de verdade. Manual.
- **Gil** — relatórios. Só fala com número na mão, nunca estima pra preencher relatório. Manual.
- **Bru** — mestre. Não refaz trabalho de ninguém, audita a costura entre as peças. Manual, roda por último, modelo mais forte (Opus).
