# Spec 11 — Encontro aleatório noturno (§123)

Status: **em refinamento**

## Objetivo
Transformar a tabela de encontros noturnos do §123 numa mecânica jogável: rolar o dado, lutar ou usar magia, e voltar ao parágrafo de origem com o efeito no descanso.

## Investigação (2026-10-24)

### O §123
- "Jogue um dado para descobrir se você encontra alguma criatura noturna":

  | Dado | Criatura | HABILIDADE | ENERGIA |
  |---|---|---|---|
  | 1–2 | Morcego Gigante | 5 | 5 |
  | 3 | Cão-Lobo | 7 | 6 |
  | 4 | Lobisomem | 8 | 9 |
  | 5–6 | Nenhum encontro | — | — |

- "Você deve lutar contra qualquer criatura que encontrar." Magias possíveis: RAN (396), GUM (421), LAW (448), WIK (437), BIG (453).
- "Depois de verificar seu encontro, **retorne à referência anterior**."
- Hoje o `book.json` só tem as magias e `back: true`. Não há combate nem rolagem; o jogador vê as magias mesmo sem encontro.

### De onde se chega
| Origem | Depois do encontro |
|---|---|
| §84 | "retorne a esta referência" e siga para 31 |
| §108 | descanso: +2 ENERGIA se a noite foi tranquila, **+1 se encontrou criatura**; segue para 36 |
| §283 | idem (+2 ou +1); segue para 31 |
| §396, §421, §437, §453 | resultados das magias, que voltam ao §123 |

## Proposta de requisitos
1. Marcar no `book.json`: `encounterTable: { die: 1, rows: [{ rolls: [1,2], enemy: {...} }, …, { rolls: [5,6], none: true }] }`.
2. Ao entrar no §123: botão "Rolar o encontro". O resultado é registrado no diário.
3. **Com criatura:** abre o combate com ela; as magias ficam disponíveis; vencendo, aparece "Voltar à referência anterior".
4. **Sem encontro:** só "Voltar à referência anterior"; as magias ficam ocultas.
5. Guardar no estado se houve encontro na noite, para o §108/§283 aplicarem +1 ou +2 ENERGIA automaticamente.
6. Os parágrafos de magia (396, 421, 437, 453) devem saber qual criatura está em jogo.
7. Voltar ao parágrafo de origem **sem reaplicar** os efeitos dele (já funciona com "voltar à referência anterior").

## Decisões a tomar
1. A rolagem é automática ao entrar no §123 ou por botão?
2. Se o jogador recarregar a página, a rolagem é mantida (salva) ou pode ser refeita?
3. O ganho de ENERGIA do §108/§283 fica automático ou continua como efeito condicional?
4. A mesma estrutura serve para outras tabelas de dado do livro (ver Spec 14)?

## Dependências
Spec 12 (combate), Spec 06 (testes).
