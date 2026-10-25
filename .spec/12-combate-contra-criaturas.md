# Spec 12 — Combate contra criaturas

Status: **em refinamento** · Refina e substitui o detalhamento da Spec 05

## Objetivo
Cobrir todas as formas de combate do livro, não só "você contra um inimigo, 2 de dano por rodada".

## Investigação (2026-10-24)

### O que existe hoje
- 23 parágrafos com `combat`: 2, 20, 47, 74, 87, 99, 104, 117, 162, 203, 207, 217, 227, 285, 317, 338, 361, 369, 386, 388, 407, 411, 425.
- 1 bloco de atributos no texto sem combate estruturado: §375 (Ogro confuso). O §383 manda voltar ao §87 com o Golem enfraquecido.
- O modal faz rodadas de 2D6 + HABILIDADE, 2 de dano, Sorte em combate e inimigos em sequência.

### Variações encontradas no texto
| Tipo | Parágrafos | Regra |
|---|---|---|
| Modificador na Força de Ataque do jogador | §20 (−2 contra criatura poderosa), §43 (+1), §72 (−1), §122 (+2 com espada) | soma na rolagem |
| Modificador na Força de Ataque do inimigo | §203 (+2 do Elvin), §386, §400, §441 (−2 pelo escudo de moeda) | soma na rolagem do inimigo |
| HABILIDADE alterada por N rodadas | §383 (Golem com HABILIDADE 4 nas 4 primeiras rodadas), §375 | temporário |
| Dano diferente | §194 (espada fina: 3), §328 (RAZ: dano dobrado), §388 (ferrão: 6 em 5–6 no dado) | por golpe |
| Aliado luta no lugar | §361 (Gigante mágico × Gigante da Colina), §388 (Gigante × Mantícora), §369 (Goblins × Mantícora) | jogador assiste; se o aliado perder, o jogador continua (§361) ou escolhe (§388) |
| Vários inimigos | §104 (dois bandidos), §407 (goblins), §155 (cita o "primeiro Goblin") | um por vez ou juntos |
| Rodadas especiais | §317, §325, §400, §441 | regras "a cada rodada" |
| Fuga | §26, §63, §295, §407 etc. ("escapar") | só quando o texto oferece |
| Dano antes da luta | §2 (−1 ENERGIA ao ser arremessado), §328, §371 (−3 se errar a magia) | efeito antes do combate |
| Encontro aleatório | §123 | ver Spec 11 |

## Proposta de requisitos
1. Ampliar o modelo de `combat` no `book.json`:
   - `playerMod`, `enemyMod` (Força de Ataque), `rounds` (modificador por N rodadas);
   - `damage` (padrão 2) e `special` (ex.: ferrão: dado 5–6 → 6 de dano);
   - `mode: "sequence" | "together" | "ally"`, com `ally` e `lose` (destino se o aliado perder);
   - `escape: { to, penalty }` quando o texto oferece fuga;
   - `rules`: texto da regra especial, sempre exibido no modal.
2. Modificadores de itens da ficha somados automaticamente (Spec 10).
3. No modal: Força de Ataque detalhada (dados + HABILIDADE + modificadores), ajuste manual de ENERGIA dos dois lados.
4. Registrar no diário cada combate (criatura, resultado), cumprindo as "caixas de encontro" da ficha original.
5. Revisar os 23 combates atuais e o §375 com o texto e o original, registrando a estrutura correta de cada um.

## Decisões a tomar
1. Esta spec substitui a Spec 05 ou a Spec 05 vira só a parte de aliados?
2. Combates "juntos" (vários inimigos ao mesmo tempo): seguir a regra do livro (escolhe um para ferir; os outros só podem ferir você) ou simplificar?
3. Regras muito específicas (ferrão, dano dobrado): estruturar todas ou deixar algumas como ajuste manual?
4. Mostrar a HABILIDADE e ENERGIA do inimigo antes de o jogador decidir lutar?

## Dependências
Spec 10 (itens), Spec 11 (encontro noturno), Spec 06 (testes).
