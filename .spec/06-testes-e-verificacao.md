# Spec 06 — Testes e verificação

## Objetivo
Proteger o `book.json` (agora editado à mão) e as regras do jogo contra regressões, e conferir a história com o original.

## Requisitos

### A. Testes de consistência do `book.json` (Vitest)
1. JSON válido, com os parágrafos 1 a 456.
2. Todos os destinos (`choices[].to`, `combat.win`, `combat.lose`, `luckTest.lucky/unlucky`) existem.
3. Nenhum parágrafo sem saída, a não ser `end: "death"` ou `end: "win"`.
4. Nenhum texto com `\r`.
5. Alcançabilidade a partir do §1: os inalcançáveis devem ser exatamente a lista de exceções documentada (Spec 03).
6. Todo `spell` de escolha é um código de três letras maiúsculas.

### B. Conferência com o original
1. Fixture com as saídas "turn to N" de cada parágrafo, gerada do OCR (`.plan/referencias/shamutanti_en_paragrafos_ocr.json`) e revisada à mão.
2. Teste: as saídas do `book.json` batem com o original, ignorando listas de magias, itens numerados e as exceções anotadas na fixture.

### C. Testes de regras
1. Mago vê todas as opções de magia de um parágrafo; Guerreiro não vê nenhuma (Spec 01).
2. Teste de sorte: 2d6 ≤ SORTE = sortudo, e SORTE cai 1.
3. Sorte em combate: acerto sortudo = 4 de dano, azarado = 1; ferido sortudo = 1, azarado = 3.
4. Atributos não passam do valor inicial.
5. Libra só pode ser usada uma vez.
6. Save antigo carrega sem erro.

### D. Verificação manual no navegador
Jogar os caminhos que passam por 165, 190, 236, 305, 328, 346, 388, 390 e 431, e registrar o resultado nesta spec.

## Arquivos afetados
`src/test/book.test.ts`, `src/test/rules.test.ts`, `src/test/fixtures/original-exits.json` (novos).

## Critérios de aceite
- [x] `vitest run` passa com todos os testes acima.
- [x] Introduzir de propósito um destino inválido ou um parágrafo sem saída faz o teste falhar.
- [x] Verificação manual registrada.

## Implementação (2026-10-25)
- **A.** `src/test/book.test.ts`: as checagens de destino e de parágrafo sem saída viraram funções (`invalidExits`, `stuckParagraphs`), testadas também numa cópia do livro estragada de propósito (destino 999, vitória 457, morte fora dos casos permitidos e §35 sem saída), o que cobre o 2º critério de aceite. Novo teste: todo `spell` é um código de três letras maiúsculas. Os itens 1–5 já existiam (Specs 02 e 03).
- **B.** `src/test/fixtures/original-exits.json`, gerada por `scripts/fixes/2026-10-25-spec06-original-exits.mjs` (rodou uma vez e não roda de novo; agora a fixture é editada à mão). Como o OCR não separou 46 parágrafos, a fixture agrupa os parágrafos como o OCR os deixou (409 grupos, 456 parágrafos) e o teste compara a união das saídas de cada grupo, sem listas de magias nem itens numerados. A revisão manual está no script: OCR ilegível (§126, §142, §248–250, §258–259, §260, §261, §435), §103 (o OCR leu 147; é 117), §1 dentro do grupo do §2, §330–334 embaralhados, combates que a Spec 05 trouxe para o próprio parágrafo (`bookOnly`/`originalOnly` com nota) e referências da 2ª aventura (§187 → 79, §456 → 12).
- **Erros achados pela conferência e corrigidos** (com o usuário; `scripts/fixes/2026-10-25-spec06.mjs`): §161 "se passou a noite" levava a 43 (espada larga); o original diz 45. §187 tinha uma escolha para o §79 deste livro (portador da praga), mas o texto cita o §79 da 2ª aventura; a escolha saiu.
- **C.** `src/test/rules.test.ts`. Para testar sem React, a regra do teste de sorte virou `luckTest(s, a, b)` em `useGame.ts` e a sorte ao ser ferido virou `luckyWound` em `combat.ts` (usadas pelo hook e pelo modal). `libraRevive`/`libraCleanse` agora não fazem nada se Libra já foi usada (antes só o botão da tela impedia).
- **D.** Verificação no navegador (saves colocados no parágrafo, saídas clicadas):
  - §165 → 206 pela escolha "três testes de SORTE seguidos". OK.
  - §190 mostra "Volte para 126". OK.
  - §236: Testar a Sorte (118/223); 3+6 = 9 com SORTE 9 → sortudo, SORTE 8, foi para 118. OK.
  - §305 → 117 (lutar contra o assassino). OK.
  - §328 com cera de abelha: "Lutar: Goblin (7/6)", regra especial no modal, cada acerto tira 4; vitória → 186. Sem cera: escolha → 47. OK.
  - §346 → 420. OK.
  - §388: combate do aliado Gigante × Mantícora com a regra do ferrão; o jogador não perde ENERGIA (20 → 20); saídas 456, 227 e 420. OK.
  - §390 → 64, 151 e 3. OK.
  - §431 → 79. OK.
  - §161 → 62 e 45; §187 só → 212. OK.
  - Sem erros no console.
- `npm test`: 7 arquivos, 98 testes passando; `tsc --noEmit` limpo.
