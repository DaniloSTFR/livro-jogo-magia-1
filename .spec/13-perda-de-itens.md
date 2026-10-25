# Spec 13 — Perda de itens (captura, roubo e saque)

Status: **em refinamento**

## Objetivo
Executar na ficha as perdas de itens que o texto manda fazer, inclusive as que dependem de Teste de SORTE item por item.

## Investigação (2026-10-24)

| § | Situação | Regra do texto |
|---|---|---|
| **218** | Capturado: vasculham sua mochila | **Teste a SORTE para cada item**, um por um, incluindo Ouro e Provisões como itens individuais. Sorte = mantém; Azar = perde. **Não desconta SORTE** nesses testes. Depois → 196 |
| 32 | Larápia na grama | Perde **dois artefatos** à escolha; só Ouro/Provisões se não tiver outro item |
| 57 | Ganha 12 PO, mas a larápia rouba | Perde **um item** à escolha; só Ouro/Provisões se não houver outro |
| 261 | Bandidos fogem com a mochila | Perde **tudo da mochila**, inclusive ouro e provisões, **menos a espada**; −2 ENERGIA |
| 296, 386, 400, 441 | Magia WOK | A **moeda** usada é perdida |
| 152 | Joia de Gelo | Derrete e perde o valor |
| 184 | A velha pega a página do Grimório | Perde a página (ligado à Spec 08: §114 → §205) |
| 390 | Inundação | Perde o que a água estragaria, **ex.: provisões** |
| 185, 262 | Perda de arma | Sem arma: −4 de HABILIDADE até achar outra (§185 cita a regra) |

## Proposta de requisitos
1. **§218:** assistente de saque. Lista cada item da ficha, mais "Ouro" e "Provisões" como entradas separadas. Para cada um, botão "Testar a SORTE" (sem descontar SORTE). Azar remove o item. Só libera "Continuar → 196" quando todos forem testados.
2. **Perda à escolha (§32, §57):** diálogo "Escolha N itens para perder", respeitando a regra de Ouro/Provisões só como último recurso.
3. **Perda total (§261):** botão "Perder a mochila" que zera itens, ouro e provisões e mantém a espada.
4. **Perdas automáticas:** moeda do WOK, página no §184, provisões no §390, Joia de Gelo (Spec 10).
5. **Sem arma:** marcar a penalidade de −4 de HABILIDADE enquanto não houver arma na ficha.
6. Registrar no diário cada item perdido.

## Decisões a tomar
1. Ouro no §218 é testado como um único item (perde tudo ou nada) ou por moeda? O texto sugere "seu Ouro" como um item.
2. O assistente do §218 pode ser pulado (o jogador resolve manualmente) ou é obrigatório?
3. "Provisões" no §218: perde todas de uma vez ou uma refeição?
4. A perda é automática (o jogo escolhe) ou sempre confirmada pelo jogador?

## Dependências
Spec 04 (ficha editável), Spec 10 (catálogo de itens).
