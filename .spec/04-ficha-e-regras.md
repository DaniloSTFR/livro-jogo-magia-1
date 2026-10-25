# Spec 04 — Ficha e regras divergentes das fontes

## Objetivo
Alinhar a ficha e as regras do jogo com `fontes_base/REGRAS.md`, `FICHA_DE_AVENTUREIRO.md` e o livro original.

## Requisitos

### A. Equipamento inicial
1. Guerreiro e Mago começam com **Espada** e **Mochila**, 20 peças de ouro e 2 provisões.
2. Remover "Cajado" e "Grimório" do Mago (o Grimório não pode ser levado na aventura).

### B. Provisões
1. Só é possível comer quando o texto permitir, uma refeição por vez.
2. Marcar no `book.json` os parágrafos que permitem comer, com a quantidade de ENERGIA que o texto indica (ex.: `meal: { stamina: 4 }`). Revisar no texto os parágrafos que citam "provisões"/"refeição" (41 ocorrências).
3. Fora desses parágrafos, o botão "Consumir refeição" fica desabilitado, com explicação.

### C. Deusa Libra
1. Revitalização: a qualquer momento, uma vez por aventura (já correto).
2. Fuga: só pelas escolhas com Libra do texto (já existem). Remover a opção genérica "Fuga de Emergência" do diálogo.
3. Remoção de maldições **e doenças**: a ficha passa a registrar doenças junto com as maldições.

### D. Ouro
1. Botões +/− na ficha.
2. Quando o texto citar preço ("cobrará 3 Peças de Ouro"), botão "Pagar N" desabilitado se o ouro não bastar. Marcação no `book.json` (ex.: `costs: [{ gold: 3, label: "Saco de dentes" }]`).

### E. Itens
1. Adicionar (campo de texto) e remover itens na ficha.
2. Número gravado opcional (integra com a Spec 03).

### F. Bônus, penalidades, maldições e doenças
1. Seção editável com nome e, opcionalmente, modificador de Força de Ataque (ex.: machado 233 = −1).
2. O modificador é aplicado no combate (Spec 05).

### G. Encontros com monstros
1. Registrar no diário cada monstro enfrentado com HABILIDADE e ENERGIA (equivale às "caixas de encontro" da ficha original).

## Compatibilidade
- Saves antigos sem os novos campos carregam com valores padrão (sem doenças, sem modificadores).

## Arquivos afetados
`src/game/useGame.ts`, `src/game/book.ts`, `src/game/book.json`, `src/components/game/Sheet.tsx`, `src/components/game/Creation.tsx`, `src/routes/index.tsx`.

## Critérios de aceite
- [x] Mago novo começa com Espada e Mochila.
- [x] "Consumir refeição" só funciona onde o texto permite e soma o valor indicado.
- [x] O diálogo de Libra não oferece fuga genérica.
- [x] É possível pagar, ganhar e perder ouro e itens pela ficha.
- [x] Doenças e maldições podem ser adicionadas e removidas por Libra.
- [x] Save antigo carrega sem erro.

## Implementação (2026-10-24)
- Script de correção: `scripts/fixes/2026-10-24-spec04.mjs` (Node, já executado; recusa rodar de novo).
- **A.** Guerreiro e Mago começam com Espada e Mochila (sem Cajado nem Grimório), 20 PO e 2 provisões.
- **B.** `meal: { stamina, alreadyAte? }` nos §18, 21, 35, 49, 51, 62, 71, 76, 108, 127, 136 e 283 (+2 na primeira refeição do dia; +1 se já comeu, quando o texto diz). Saem os efeitos opcionais que somavam ENERGIA sem gastar provisão. O parágrafo mostra os botões de comer; na ficha, "Consumir Refeição" fica desabilitado fora deles com a explicação. Uma refeição por visita (`ateAt` no save). Como o jogo não controla "já comeu hoje" (Spec 14), o jogador escolhe o valor. §284 (pão oferecido) ganhou efeito opcional de +2, como o §222. Comida para levar (§97, §173, §270) e compras ficam com o +/− de provisões e a Spec 09.
- **C.** O diálogo de Libra perdeu a fuga genérica; a remoção agora tira maldições e doenças.
- **D.** Ouro e provisões com +/− na ficha. `costs: [{ gold, label }]` nos preços fixos (§5, 33, 60, 92, 102, 106, 107, 115, 116, 134, 161, 204, 211, 230, 244, 257, 266, 267 e a Peça de Ouro das magias §296, 386, 400, 441). Botão "Pagar N" uma vez por visita, desabilitado sem ouro. Preços por dados (§22, §214) e a pechincha (§141) ficam para a Spec 09.
- **E.** Itens: adicionar (nome + número gravado opcional; o tipo vem do nome, ex. "Chave de prata" → chave) e remover.
- **F.** `conditions: { name, kind: curse|disease|bonus|penalty, attack? }[]` substitui `curses`. A soma de `attack` já entra na Força de Ataque do combate (a Spec 05 pode refinar, ex.: machado só quando usado).
- **G.** O combate registra no diário "Encontro: NOME — HABILIDADE X, ENERGIA Y" no primeiro ataque contra cada inimigo.
- Compatibilidade: `normalizeSave` converte `curses` em condições do tipo maldição; saves sem os campos novos carregam com padrão.
- `npm test`: 5 arquivos, 62 testes passando. UI conferida no navegador (save antigo, refeição no §35, Libra, pagamento no §5, item numerado, penalidade −1 no combate do §2).
