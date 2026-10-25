# Spec 10 — Efeitos de itens: cura, sorte e combate

Status: **em refinamento** · Refina a Spec 04 (seção F) e a Spec 05 (seção D)

## Objetivo
Itens com efeito permanente ou de uso devem alterar as regras automaticamente enquanto estiverem na ficha, em vez de depender de o jogador lembrar.

## Investigação (2026-10-24)

| Item | Onde se obtém | Efeito | Tipo |
|---|---|---|---|
| Suco de Blimberry (poção do herbalista) | §107 → §274 | +3 ENERGIA a qualquer momento **fora de combate**, 1 dose; ou componente de magia (DOC, §299) | Consumível |
| Espada larga | §214 → §43 | **+1 na Força de Ataque** | Arma |
| Espada fina | §106 → §194 | **3 de dano** em vez de 2; não acumula com outra espada | Arma |
| Machado de Glandragor (nº 233) | §141 → §72 | **−1 na Força de Ataque** se usado como arma reserva; número 233 (Spec 08) | Arma |
| Amuleto da SORTE | §177 (Troll) | **−1 na rolagem** de cada Teste de SORTE | Permanente |
| Braçadeira de Ragnar | §122 (recompensa de Alianna) | **+2 na Força de Ataque** só com espada | Permanente |
| Joia de Gelo | §60 → §152 | Derrete depois, sem valor | Some |
| Escudo de moeda (WOK) | §386, §400, §441 | −2 na Força de Ataque do inimigo durante a luta; a moeda é perdida | Temporário |
| Componentes de magia | §248 (cola, tampões, pedras), §190 (dentes), §213 (areia), §247 (gorro), §249 (flauta) | Exigidos por magias (MAGIA.md) | Componente |

Também: ganho de SORTE por evento (§185 +2, §233 +3) e aumento da SORTE **Inicial** (§456).

## Proposta de requisitos
1. **Catálogo de itens** (`src/game/items.ts`), como o de magias: id, nome, tipo, efeito, usos.
2. **Efeitos aplicados automaticamente:**
   - Força de Ataque: soma dos modificadores dos itens ativos (arma em uso + braçadeira), mostrada no combate;
   - dano por golpe: 2, ou 3 com a espada fina;
   - Teste de SORTE: −1 na rolagem com o amuleto;
   - modificador temporário do inimigo (escudo de moeda) só no combate do parágrafo.
3. **Arma em uso:** o jogador escolhe a arma ativa (espada, espada larga, machado…). Só uma por vez.
4. **Consumíveis:** botão "Usar" (ex.: Blimberry +3 ENERGIA), bloqueado em combate; some ao usar.
5. **Itens que somem:** a Joia de Gelo vira "líquido sem valor" depois de um tempo (decidir quando).
6. **Componentes de magia:** marcar quais magias cada item habilita (base para uma futura checagem de item exigido).

## Decisões a tomar
1. Os efeitos são aplicados sozinhos ou só exibidos como lembrete?
2. Uma única "arma ativa" ou o jogador pode trocar a cada combate?
3. Quando a Joia de Gelo derrete: no próximo parágrafo, ao tentar usá-la ou num ponto fixo?
4. A checagem de "item exigido pela magia" entra aqui ou continua só pelo texto do livro (que já pune quem não tem o item)?

## Dependências
Spec 04 (ficha), Spec 05/12 (combate), Spec 09 (compras).
