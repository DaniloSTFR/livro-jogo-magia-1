# Spec 01 — Magias: todas visíveis, as 6 iniciais viram dica

## Objetivo
Quando o personagem for Mago e o parágrafo oferecer magias, **todas** as opções aparecem. As 6 magias escolhidas na criação deixam de limitar a partida e passam a ser só uma dica.

## Contexto
- O filtro que esconde as magias está em `src/routes/index.tsx`:
  `if (known && !s.spells.includes(known.code)) return null;`
  Ele oculta toda magia do catálogo que o Mago não memorizou.
- `LEGACY_SPELLS` em `src/game/useGame.ts` só converte códigos de saves antigos (IGNIS, LUMEN…). Não tem mais função.
- O original não deixa consultar o Grimório durante a aventura e mostra todos os códigos; cabe ao jogador reconhecê-los. Por isso as iscas (códigos fora do catálogo) continuam aparecendo.

## Requisitos
1. Remover `LEGACY_SPELLS` e o bloco de migração de magias no carregamento do save em `useGame.ts`. O save é carregado como está.
2. Remover o filtro citado em `index.tsx`. Para o Mago, todas as escolhas com `spell` são exibidas. Para o Guerreiro, continuam ocultas.
3. Apresentação de cada opção de magia:
   - sempre o código (ex.: `ZAP`);
   - se o código estiver entre as memorizadas: selo "memorizada", nome e custo em ENERGIA (do catálogo `src/game/adventure.ts`);
   - demais códigos (do catálogo ou iscas): só o código, sem nome, custo ou indicação de que é isca.
4. `Creation.tsx`: trocar "Somente as memorizadas poderão ser usadas na jornada" por texto dizendo que as escolhas são só referência durante a aventura e não limitam as opções.
5. `Sheet.tsx`: renomear a seção "FEITIÇOS MEMORIZADOS" para "MAGIAS DE REFERÊNCIA".
6. Na criação, o Mago escolhe **até 6** das 48 magias (de 0 a 6):
   - o contador mostra "N/6";
   - não é possível marcar uma 7ª;
   - o botão "Iniciar a jornada" fica habilitado com qualquer quantidade de 0 a 6.
7. Atualizar o `AGENTS.md`: remover a exigência de migração de saves pelo catálogo.

## Fora de escopo
- Desconto automático do custo de ENERGIA ao lançar (o texto do parágrafo de destino já instrui a perda).
- Checagem de item exigido pela magia (fica para a Spec 04).

## Arquivos afetados
`src/game/useGame.ts`, `src/routes/index.tsx`, `src/components/game/Creation.tsx`, `src/components/game/Sheet.tsx`, `AGENTS.md`.

## Critérios de aceite
- [x] No §4 (gaiola), um Mago que não memorizou DOP nem PEP vê as 5 opções: GOP, DOP, BAM, PEP e RAZ.
- [ ] As memorizadas aparecem com selo, nome e custo; as outras só com o código.
- [x] Um Guerreiro não vê nenhuma opção de magia.
- [ ] Na criação, é possível iniciar com 0, 3 ou 6 magias marcadas, e não é possível marcar a 7ª.
- [x] Um Mago com 0 magias marcadas vê todas as opções de magia normalmente.
- [ ] Um save antigo carrega sem erro; códigos desconhecidos na lista de memorizadas são ignorados na ficha.
- [x] Não há mais referências a `LEGACY_SPELLS` no código.
- [x] `tsc --noEmit` e `vitest run` passam.

## Decisões
- **2026-10-24:** o Mago escolhe **até 6** magias das 48. Elas são apenas referência durante a aventura e **não limitam** as escolhas nos parágrafos de decisão.
- Um limite para a *visualização* dessa referência será tratado depois na Spec 07.

## Implementação (2026-10-24)
- Novo `src/game/spells.ts` (`visibleChoices`, `MAX_REFERENCE_SPELLS`), usado por `index.tsx` e `Creation.tsx`.
- Removidos `LEGACY_SPELLS` e a migração de magias em `useGame.ts`.
- Testes em `src/test/spells.test.ts`: 4 testes. `npm test` local: 5/5 passando.
- Pendente de conferência manual no navegador: selo/nome/custo na tela, criação com 0/3/6 magias e carregamento de save antigo.
