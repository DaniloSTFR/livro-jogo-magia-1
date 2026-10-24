# Spec 05 — Combates especiais

## Objetivo
Suportar os combates do livro que fogem do padrão "você contra um inimigo por vez".

## Requisitos

### A. Combates descritos no meio do texto
1. §375 (Ogro confuso: HABILIDADE 4, ENERGIA 7; vitória → 15) e §383 (Golem de Madeira com HABILIDADE 4 nas quatro primeiras rodadas; volta ao §87) passam a ter `combat` no `book.json`.
2. Procurar outros casos no texto ("lutará com HABILIDADE").

### B. Combate com aliado
1. Novo modo no `book.json`, ex.: `combat: { mode: "ally", ally: {...}, enemies: [...], win, lose }`.
2. §388: o Gigante criado pela magia luta contra a Mantícora. Ferrão: a cada acerto da Mantícora, rolar 1 dado; 5–6 = 6 de dano. Vitória do Gigante → 456. Derrota → escolha entre 227 (terminar pessoalmente) e 420 (outra magia).
3. §369: Goblins criados contra a Mantícora (conferir regras no texto e no original).
4. Na tela, o modal mostra aliado × inimigo; o jogador não perde ENERGIA nesse combate.

### C. Regras especiais
1. Campo `rules` no combate com o texto da regra especial, exibido no modal.
2. Ajustes manuais no modal: +/− na ENERGIA do inimigo e do jogador, para aplicar o que a regra pedir.
3. Suporte estruturado ao menos para: dano dobrado (RAZ/cera de abelha, §328), HABILIDADE temporária do inimigo por N rodadas (§383) e dano extra por rolagem (ferrão, §388).

### D. Modificadores da ficha
1. Aplicar os modificadores de Força de Ataque da Spec 04 (ex.: machado −1).

### E. Fuga
1. Botão de fuga só quando o parágrafo trouxer `combat.escape` (destino e penalidade do texto).

### F. Múltiplos inimigos
1. Manter "um por vez" como padrão; permitir `together: true` quando o texto mandar enfrentar todos de uma vez.
2. Revisar os combates múltiplos atuais: 104, 361, 369, 388, 407 (no §407 falta o Primeiro Goblin? conferir).

## Arquivos afetados
`src/game/book.json`, `src/game/book.ts`, `src/components/game/Combat.tsx`, `src/routes/index.tsx`.

## Critérios de aceite
- [ ] §375 e §383 mostram o botão "Lutar" com os valores do texto.
- [ ] No §388 o jogador assiste ao combate do Gigante, com ferrão funcionando, e segue para 456, 227 ou 420.
- [ ] As regras especiais aparecem no modal.
- [ ] O machado 233 reduz em 1 a Força de Ataque.
- [ ] Fuga só aparece onde o texto oferece.
