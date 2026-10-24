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
- [ ] `vitest run` passa com todos os testes acima.
- [ ] Introduzir de propósito um destino inválido ou um parágrafo sem saída faz o teste falhar.
- [ ] Verificação manual registrada.
