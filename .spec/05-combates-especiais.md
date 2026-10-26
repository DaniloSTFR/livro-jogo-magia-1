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
- [x] §375 e §383 mostram o botão "Lutar" com os valores do texto.
- [x] No §388 o jogador assiste ao combate do Gigante, com ferrão funcionando, e segue para 456, 227 ou 420.
- [x] As regras especiais aparecem no modal.
- [x] O machado 233 reduz em 1 a Força de Ataque.
- [x] Fuga só aparece onde o texto oferece.

## Implementação (2026-10-25)
- Script de correção: `scripts/fixes/2026-10-25-spec05.mjs` (Node, já executado; recusa rodar de novo).
- Motor de combate em funções puras em `src/game/combat.ts` (testado em `src/test/combat.test.ts`); o tipo `Combat` em `src/game/book.ts` documenta os campos.
- **A.** Novos combates no meio do texto: §375 (Ogro 4/7 → 15), §383 (Golem 8/6 com HABILIDADE 4 nas 4 primeiras rodadas → 169), §325 (Mantícora com metade da HABILIDADE por 4 rodadas e ferrão → 456), §356 (Elvin com sua HABILIDADE dobrada; Testar a Sorte livre e escolha 148), §400 (Ogro com −2 na rolagem dele → 15), §441 (Elvin com escudo → 121), §328 e §442 (dano dobrado com cera de abelha → 186 / 155). Nos casos "volte para X e lute", a luta com a regra passa a acontecer no próprio parágrafo; a escolha de voltar ficou só para quem não tem o item (cera, Peça de Ouro), e as que só repetiam o combate (§375→15, §383→87, §325→227) saíram. O §453 (BIG no encontro noturno §123) fica para a Spec 11.
- **B.** `mode: "ally"`: §388 (Gigante × Mantícora, ferrão de 6; derrota → escolhas 227/420 do texto), §369 (quantos Goblins o jogador quiser, 1 ENERGIA cada; o ferrão mata o Goblin), §361 (Gigante Mágico × Gigante da Colina; se perder, o jogador termina a luta com a ENERGIA que restar) e §425 (Goblins × Cão-Lobo; 0 Goblins = lutar direto). O jogador não perde ENERGIA enquanto o aliado luta.
- **C.** `rules` aparece no modal; +/− na ENERGIA do jogador, do aliado e do inimigo. Estruturados: `damage` (dano dobrado), `weakened` (HABILIDADE temporária, com `recover: "even"` no §317), `sting` (ferrão, com `kill` e `luckSaves` — no §227/§325 o Teste de Sorte é feito na hora), `playerRoll`/`enemyRoll` (§20, §203, §386, §400, §441) e `doubleSkill` (§356, §411).
- **D.** `weapons` no `book.json`: o modal oferece a arma a usar quando a ficha tem o Machado de Glandragor (−1, §72) ou a espada larga (+1, §43); os modificadores da ficha (Spec 04) continuam somando.
- **E.** `escape` só no §117 (poupar o Assassino com ENERGIA dele ≤ 3 e a sua ≥ 6 → 187), único caso do texto; a escolha solta para 187 saiu.
- **F.** "Um por vez" continua padrão; `together: true` é suportado no modal, mas nenhum parágrafo pede (nem o original). Revisão: §104 ok; §217 ganhou o Segundo e o Terceiro Goblin; §361 e §369/§388 viraram combate com aliado; no §407 o Primeiro Goblin morre com o ZAP (correto), e `flee` rola a fuga dos outros dois antes da luta (ambos fogem → 202).
- Divergências da tradução corrigidas pelo original: §369 Goblins com ENERGIA 5 (não 3); §425 dano de 5 sem dentes de Goblin (não 3).
- `npm test`: 6 arquivos, 79 testes passando. UI conferida no navegador (§388, §369, §117 com machado e fuga, §407, §383).
