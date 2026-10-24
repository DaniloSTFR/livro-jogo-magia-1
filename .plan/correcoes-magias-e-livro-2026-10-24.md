# Plano de correção — magias, parser do livro e mecânicas

Data: 2026-10-24 (revisado com as fontes de `fontes_base/`)

## Fontes de verdade

Em caso de dúvida, vale esta ordem:

1. `fontes_base/Steve Jackson's Sorcery (1of5) - The Shamutanti Hills.pdf`: o livro original em inglês. O PDF é escaneado; o texto extraído por OCR está em `.plan/referencias/shamutanti_en_ocr.txt` (410 dos 456 parágrafos foram separados automaticamente em `shamutanti_en_paragrafos_ocr.json`).
2. `fontes_base/REGRAS.md`: regras de criação, combate, sorte, Libra e equipamento.
3. `fontes_base/MAGIA.md`: as 48 magias. Já confere 100% com `src/game/adventure.ts` (códigos, custos e itens).
4. `fontes_base/FICHA_DE_AVENTUREIRO.md`: seções da ficha.
5. `src/game/book.json`: **fonte principal da história no jogo** (texto + escolhas, combates, testes de sorte, efeitos e finais). Correções são feitas direto nele.
6. `scripts/Pages_pt-BR.md` e `scripts/parse-book.py`: **fontes históricas**. Servem para consulta; o parser não deve mais ser rodado sobre o `book.json`, pois apagaria as correções manuais.

## Contexto

- O `LEGACY_SPELLS` (`src/game/useGame.ts`) só converte códigos antigos de saves (IGNIS, LUMEN…). Não tem mais função e será removido.
- Quem esconde as magias é o filtro em `src/routes/index.tsx`:
  `if (known && !s.spells.includes(known.code)) return null;`
- As 6 magias iniciais passam a ser só uma **dica/guia**. Isso conversa com o original: o livro mostra todos os códigos e cabe ao jogador reconhecê-los (o Grimório não pode ser consultado durante a aventura).

## Fase 1 — Magias: todas visíveis, as 6 iniciais viram dica

- [ ] Remover `LEGACY_SPELLS` e a migração de magias no carregamento em `useGame.ts`.
- [ ] Atualizar a regra do `AGENTS.md` que exige migração de saves pelo catálogo.
- [ ] Remover o filtro em `index.tsx`: para o Mago, **todas** as opções de magia do parágrafo aparecem.
- [ ] Cada opção mostra o código; as 6 escolhidas ganham selo "memorizada" (com nome e custo). As demais, inclusive as iscas fora do catálogo (GOP, WIK…), aparecem só com o código, como no livro.
- [ ] `Creation.tsx`: trocar "Somente as memorizadas poderão ser usadas" por texto dizendo que as escolhas servem de dica.
- [ ] `Sheet.tsx`: renomear a seção para "Magias de referência".
- [ ] Na criação, escolher **até 6** das 48 magias (0 a 6). São só referência e não limitam as escolhas. (Decidido em 2026-10-24; limite de visualização da referência fica para a Spec 07.)

## Fase 2 — `book.json`: mortes falsas e saídas perdidas

As correções são feitas direto no `book.json` (de preferência com um script pontual de correção, revisado e descartado depois, para manter o JSON válido).

- [ ] Normalizar as quebras de linha dos textos do `book.json` (CRLF → LF), sem alterar o conteúdo.
- [ ] Adicionar as escolhas que faltam (o texto usa "ir para", "pode ir para", "voltar para" e "(referência N)", que o parser antigo não reconhecia).
  - Finais falsos: 190→126, 305→117, 328→47, 346→420, 431→79.
  - Saídas perdidas (confirmadas no original): 299→158, 303→63, 388→227 e 420, 420→227.
  - §390: no teste de sorte, o caminho "sortudo" oferece 151 ou 3 (hoje só existe a saída 64).
- [ ] §165 (três testes de SORTE consecutivos): sucesso leva a 206.
- [ ] Remover `end: "death"` dos finais falsos; manter só onde há morte real ("até a morte", "sua aventura termina"…).
- [ ] §456 é a vitória; a menção ao 12 refere-se ao próximo volume (Kharé) e não vira escolha.
- [x] Atualizar o `AGENTS.md`: `book.json` é a fonte principal e o parser é histórico.

## Fase 3 — Erros de tradução e parágrafos inalcançáveis

### Erro de tradução confirmado
- [ ] **§236 está com o texto errado** no `book.json` (e no `Pages_pt-BR.md` histórico): tem uma cópia do "resposta incorreta do corcunda". No original, §236 é: *"Teste sua Sorte. Se tiver Sorte, vá para 118. Se tiver Azar, vá para 223."* Isso explica por que §223 é inalcançável. Corrigir o texto e trocar a escolha para 38 por um `luckTest` (118 / 223).
- [ ] Revisar os 46 parágrafos que o OCR não separou automaticamente (lista no JSON de referência) para garantir que não há outras trocas iguais à do §236.

### Números escondidos em itens (mecânica do original)
O original usa números gravados em objetos para levar a parágrafos sem citá-los no texto. Por isso 44, 101, 205 e 319 não aparecem em nenhum "vá para", nem no inglês.
- [ ] §4: chave na gaiola, "subtraia 10 do número gravado na chave".
- [ ] Chave com o número 111 (→ §101), chave com o número 206 (ganha do mendigo), machado com o número 233, e as demais chaves/objetos numerados a mapear no OCR.
- [ ] Implementar: ao pegar o item, guardar o número na ficha; onde o texto pedir, botão "Usar chave/objeto" que calcula o destino.

### Inalcançáveis restantes
Lista atual a partir do §1: 10, 44, 46, 58, 82, 101, 129, 150, 162, 173, 181, 188, 205, 206, 207, 221, 223, 226, 233, 234, 244, 250, 256, 265, 284, 319, 338, 361, 384, 411, 430.
- [ ] Recalcular depois das Fases 2 e 3 (muitos dependem de 165→206 e 236→223).
- [ ] Documentar as exceções que só se alcançam por item numerado, para o teste da Fase 6.

## Fase 4 — Ficha e regras divergentes das fontes

- [ ] **Equipamento do Mago**: hoje começa com "Cajado, Mochila, Grimório". Pelas regras, todos começam com **espada e mochila**, e o Grimório **não pode** ser levado.
- [ ] **Provisões**: hoje dá para comer a qualquer momento (+4 fixo). O original diz: só comer quando o texto permitir, uma refeição por vez, somando o que o texto indicar. Ligar o botão aos parágrafos que permitem comer.
- [ ] **Libra**:
  - Revitalização a qualquer momento, uma vez por aventura (já está correto).
  - Fuga **só pelas opções do texto** (já existem as escolhas com Libra). Remover a "Fuga de Emergência" genérica do diálogo, que hoje aparece em qualquer combate.
  - Remover **maldições e doenças**: hoje só existem maldições, e não há como adicioná-las.
- [ ] Ouro: botões +/− e botão de pagamento quando o texto citar preço ("cobrará 3 Peças de Ouro").
- [ ] Itens: adicionar/remover, com campo opcional de número gravado (Fase 3).
- [ ] Seção "Bônus, penalidades, maldições e doenças" editável (ex.: o machado 233 dá −1 na Força de Ataque).
- [ ] "Caixas de encontros com monstros" da ficha: registrar no diário os monstros enfrentados (o bestiário já existe).

## Fase 5 — Combates especiais

- [ ] Detectar combates descritos no meio do texto ("HABILIDADE 4 e ENERGIA 7") e mostrar o botão "Lutar" (§375, §383).
- [ ] Combate com aliado para §388 e §369 (a criatura invocada luta no lugar do jogador), com as saídas de vitória e derrota (§388 → 456 / 227 / 420).
- [ ] Mostrar as regras especiais do texto no combate (ferrão da Mantícora, dano dobrado, HABILIDADE reduzida) e permitir ajuste manual.
- [ ] Modificadores de Força de Ataque vindos da ficha (ex.: machado −1).
- [ ] Fuga só quando o texto oferecer.

## Fase 6 — Testes e verificação

- [ ] Testes Vitest sobre `book.json`:
  - todos os links apontam para parágrafos existentes;
  - nenhum parágrafo sem saída que não seja morte real;
  - inalcançáveis só os da lista de exceções da Fase 3.
- [ ] Teste de conferência com o original: as saídas de cada parágrafo devem bater com os "turn to N" do OCR, ignorando listas de magias e itens numerados.
- [ ] Teste: o Mago vê todas as opções de magia do parágrafo.
- [ ] Jogar no navegador os caminhos corrigidos (165, 190, 236, 305, 328, 346, 388, 390, 431).

## Ordem sugerida

1. Fases 1 e 2: magias e travamentos.
2. Correção do §236 e a Fase 6 (testes), para travar regressões.
3. Fase 4 (regras divergentes), Fase 3 (itens numerados) e Fase 5.
