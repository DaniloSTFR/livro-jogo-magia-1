# Spec 02 — book.json: mortes falsas e saídas perdidas

## Objetivo
Nenhum parágrafo pode encerrar a aventura se o texto continua a história, e toda saída citada no texto (e confirmada no original) precisa existir como escolha.

## Contexto
- `src/game/book.json` é a fonte principal da história e é editado direto (ver `AGENTS.md`).
- O parser antigo não reconhecia "ir para", "pode ir para", "voltar para" e "(referência N)", nem juntava linhas com CRLF. Isso gerou finais falsos e saídas perdidas.
- Comparação com o original feita via OCR (`.plan/referencias/`).

## Requisitos
1. Fazer as correções com um script pontual de correção (revisado, executado uma vez e descartado ou guardado em `scripts/fixes/` como registro). Não rodar `parse-book.py`.
2. Normalizar quebras de linha dos textos (`text`, `label`, `effects[].text`) de CRLF para LF, sem mudar o conteúdo.
3. Finais falsos: remover `end: "death"` e adicionar a escolha.

   | § | Nova escolha | Observação |
   |---|---|---|
   | 190 | → 126 | Voltar após ver os dentes |
   | 305 | → 117 | Voltar e lutar contra o assassino |
   | 328 | → 47 | Voltar e lutar contra o Goblin (com ou sem cera) |
   | 346 | → 420 | Terminar de derrotar a Mantícora; texto também tem quebras de linha soltas a juntar |
   | 431 | → 79 | Seguir protegido pelo campo de força |

4. Saídas que faltam (o parágrafo continua com as escolhas atuais):

   | § | Adicionar |
   |---|---|
   | 299 | → 158 (conferir no texto qual é a escolha correta além de 220) |
   | 303 | → 63 |
   | 388 | → 227 (terminar pessoalmente) e → 420 (lançar outra magia), como saídas de derrota do aliado |
   | 420 | → 227 |

5. §390: o teste de sorte precisa refletir o texto. Azarado → 64. Sortudo → escolha entre 151 (bifurcação) e 3 (câmara principal).
6. §165: três testes de SORTE seguidos; cada Azar custa 3 de ENERGIA. Sucesso leva a 206. Pode ser uma escolha "Consegui três testes seguidos → 206", usando o botão de teste livre já existente.
7. Manter `end: "death"` só em parágrafos com morte real. Revisar a lista atual: 64, 73, 83, 170, 242, 256, 272, 304, 307, 322, 329, 343, 344, 391, 392, 418, 432, 434, 446.
8. §456 continua `end: "win"`; a menção ao 12 é do próximo volume e não vira escolha.

## Fora de escopo
- §236 e itens numerados (Spec 03).
- Combate com aliado do §388 (Spec 05); aqui só entram as saídas.

## Arquivos afetados
`src/game/book.json` (e opcionalmente `scripts/fixes/`).

## Critérios de aceite
- [x] Os parágrafos 165, 190, 305, 328, 346 e 431 não mostram mais "Fim da jornada".
- [x] Todas as saídas das tabelas acima existem e levam ao parágrafo certo.
- [x] Nenhum texto contém `\r`.
- [x] Todos os destinos apontam para parágrafos existentes (1–456).
- [x] Os testes passam (`npm test`: 3 arquivos, 30 testes).

## Implementação (2026-10-24)
- Script de correção: `scripts/fixes/2026-10-24-spec02.py` (já executado; recusa rodar de novo).
- Parágrafos alterados no `book.json`: 165, 190, 206, 228, 299, 303, 305, 328, 346, 388, 390, 420, 431, 433. Todos os textos passaram de CRLF para LF.
- §165: escolha para 206 e efeito de −3 ENERGIA **repetível** (botão pode ser usado a cada Azar). Novo campo `repeatable` em `BookEffect`.
- §328: efeito condicional de −3 ENERGIA quando não houver cera de abelha.
- §390: teste de sorte livre, com as saídas "Azar → 64", "Sorte → 151" e "Sorte → 3".
- **Acréscimo fora da tabela original:** §206, §228, §303 e §433 só tinham saída pela Libra; com ela já usada, o jogador ficava preso. Ganharam uma escolha de morte (`to: 0`) que só aparece depois que Libra foi invocada. Novo campo `libraUsedOnly` em `BookChoice`, tratado em `visibleChoices`.
- O texto do parágrafo de morte (`DEATH`, em `book.ts`) ficou genérico, porque agora também é usado por esses finais.
- A revisão dos 19 finais de morte confirmou que todos são mortes reais.
- Testes em `src/test/book.test.ts` (consistência do `book.json` e as correções desta spec).
- Inalcançáveis a partir do §1: de 31 para 30 (o §206 voltou a ser alcançável). O restante fica para a Spec 03.
- `npm test` no Windows: 3 arquivos, 30 testes, todos passando.
- Pendência encontrada depois (ver Spec 08): o §45 também perdeu uma saída (→ 226), o mesmo tipo de erro desta spec.
