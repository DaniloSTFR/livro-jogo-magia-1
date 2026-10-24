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
- [ ] Mago novo começa com Espada e Mochila.
- [ ] "Consumir refeição" só funciona onde o texto permite e soma o valor indicado.
- [ ] O diálogo de Libra não oferece fuga genérica.
- [ ] É possível pagar, ganhar e perder ouro e itens pela ficha.
- [ ] Doenças e maldições podem ser adicionadas e removidas por Libra.
- [ ] Save antigo carrega sem erro.
