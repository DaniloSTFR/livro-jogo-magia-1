# Spec 03 — Erros de tradução e parágrafos inalcançáveis

## Objetivo
Corrigir os textos que divergem do original e tornar alcançáveis todos os parágrafos que o original permite alcançar, inclusive pela mecânica de números gravados em itens.

## Contexto
- Hoje 31 parágrafos não são alcançáveis a partir do §1: 10, 44, 46, 58, 82, 101, 129, 150, 162, 173, 181, 188, 205, 206, 207, 221, 223, 226, 233, 234, 244, 250, 256, 265, 284, 319, 338, 361, 384, 411, 430.
- Parte depende das correções da Spec 02 (ex.: 165→206).
- 44, 101, 205 e 319 não são citados em nenhum "vá para", nem no original: são alcançados por números gravados em objetos.

## Requisitos

### A. §236 (erro de tradução confirmado)
1. Substituir o texto do §236 no `book.json`. No original: *"Teste sua Sorte. Se tiver Sorte, vá para 118. Se tiver Azar, vá para 223."*
2. Trocar a escolha atual (→ 38) por `luckTest` { lucky: 118, unlucky: 223 } e remover o efeito de −2 ENERGIA / −1 SORTE que pertence a outro parágrafo.
3. Registrar a correção também no `Pages_pt-BR.md` histórico (opcional, só como anotação).

### B. Revisão dos 46 parágrafos não separados pelo OCR
1. Usar `.plan/revisao-paragrafos-nao-separados.md`.
2. Para cada divergência encontrada, corrigir texto e estrutura no `book.json`.

### C. Itens com número gravado
1. Mapear no OCR todos os itens numerados. Já identificados:
   - chave da gaiola no §4: "subtraia 10 do número gravado na chave";
   - chave com o número 111 (→ §101 quando usada no §4);
   - chave com o número 206 dada pelo mendigo;
   - machado com o número 233 (também dá −1 na Força de Ataque);
   - página 102 de um livro de magia incompleto (conferir).
2. Modelo de dados: item da ficha com número opcional (ex.: `{ name: "Chave", number: 111 }`). Manter compatibilidade com saves que guardam itens como texto.
3. No `book.json`, marcar os parágrafos que pedem o número (ex.: `numberedItem: { kind: "chave", offset: -10 }`).
4. Na tela, botão "Usar chave/objeto": lista os itens numerados do tipo pedido e leva a `número + offset`. Destino inexistente leva a uma mensagem, não a erro.
5. Ao pegar o item no texto, oferecer botão para adicioná-lo à ficha já com o número.

### D. Recalcular inalcançáveis
1. Depois de A–C e da Spec 02, recalcular a lista.
2. Documentar em `src/game/reachability-exceptions.json` (ou similar) os parágrafos alcançados só por item numerado, com o motivo.

## Arquivos afetados
`src/game/book.json`, `src/game/book.ts` (tipos), `src/game/useGame.ts` (itens), `src/routes/index.tsx`, `src/components/game/Sheet.tsx`.

## Critérios de aceite
- [x] §236 mostra o teste de sorte que leva a 118 ou 223.
- [x] Os 46 parágrafos da revisão estão marcados como revisados.
- [x] Com a chave 111, o §4 leva ao §101.
- [x] A lista de inalcançáveis contém só exceções documentadas.
- [x] Saves antigos com itens em texto continuam carregando.

## Implementação (2026-10-24)
- Script de correção: `scripts/fixes/2026-10-24-spec03.mjs` (Node, já executado; recusa rodar de novo). Python não estava disponível no Windows.
- **A.** §236 virou o teste de sorte do original (118 / 223), sem escolhas nem efeitos. Anotação no `Pages_pt-BR.md`.
- **B.** Os 46 parágrafos foram conferidos com o OCR (§331–333 com o OCR completo, pois o trecho da revisão era do §330). Divergências corrigidas:
  - §9: o caminho elevado leva ao 157 (texto e escolha diziam 57).
  - §166: as 5 opções (NAP, SIX, BAG, LAW, KIL) passaram a ser escolhas de magia.
  - §277: nova saída de morte "dois seis" (`to: 0`, novo campo `diceDeath` em `BookChoice`).
  - §317 (HABILIDADE variável do Troll) fica para a Spec 05.
- **C.** Decisões com o usuário: o jogo faz a conta; só itens guardados na ficha podem ser usados; nesta spec o uso fica só no §4 (§114 e §182 continuam na Spec 08).
  - Itens podem ser texto (saves antigos) ou `{ name, kind, number }` (`Item` em `useGame.ts`).
  - `gainItems` no `book.json`: §199 (chave 54), §186 (chave 111), §244 (chave de cobre 206), §183 (página 102), §72 (machado 233). Botão "Guardar na ficha" no parágrafo.
  - `numberedItem` no §4: `{ kind: "chave", offset: -10 }`. Botão por chave da ficha; número sem parágrafo mostra uma mensagem.
  - A lista da Spec 03 estava incompleta: a chave da gaiola que abre é a nº 54 (§44), conforme a investigação da Spec 08.
- **D.** `src/game/reachability-exceptions.json`: §44 e §101 alcançados só por chave; inalcançáveis §205 e §233 (uso pendente da Spec 08) e §319 (órfão do original). O teste de alcance compara com esse arquivo.
- `npm test`: 4 arquivos, 48 testes passando. UI conferida no navegador (save antigo, chave 111 → §101, chave inválida, §236).
