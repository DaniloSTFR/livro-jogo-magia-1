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
- [ ] §236 mostra o teste de sorte que leva a 118 ou 223.
- [ ] Os 46 parágrafos da revisão estão marcados como revisados.
- [ ] Com a chave 111, o §4 leva ao §101.
- [ ] A lista de inalcançáveis contém só exceções documentadas.
- [ ] Saves antigos com itens em texto continuam carregando.
