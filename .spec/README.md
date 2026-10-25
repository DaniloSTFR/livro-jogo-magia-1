# Specs — correções do livro-jogo Magia! Vol. 1

Origem: `.plan/correcoes-magias-e-livro-2026-10-24.md` (cada fase do plano virou uma spec).

| # | Spec | Status | Depende de |
|---|------|--------|------------|
| 01 | [Magias: todas visíveis, as 6 iniciais viram dica](01-magias-todas-visiveis.md) | Concluída (2026-10-24) | — |
| 02 | [book.json: mortes falsas e saídas perdidas](02-book-json-saidas-e-mortes-falsas.md) | Concluída (2026-10-24) | — |
| 03 | [Erros de tradução e parágrafos inalcançáveis](03-traducao-e-inalcancaveis.md) | Concluída (2026-10-24) | 02 |
| 04 | [Ficha e regras divergentes das fontes](04-ficha-e-regras.md) | Concluída (2026-10-24) | 01 |
| 05 | [Combates especiais](05-combates-especiais.md) | A fazer | 02, 04 |
| 06 | [Testes e verificação](06-testes-e-verificacao.md) | A fazer | 02 (iniciar junto) |
| 07 | Limite de visualização da referência de magias | A definir (spec a criar) | 01 |
| 08 | [Caminhos ocultos: §44, §101, §205 e §319](08-caminhos-ocultos.md) | Em refinamento | 02, 03 |
| 09 | [Compras em lojas, estalagens e provisões](09-compras-e-lojas.md) | Em refinamento | 04 |
| 10 | [Efeitos de itens: cura, sorte e combate](10-efeitos-de-itens.md) | Em refinamento | 04, 09 |
| 11 | [Encontro aleatório noturno (§123)](11-encontro-noturno-123.md) | Em refinamento | 12 |
| 12 | [Combate contra criaturas](12-combate-contra-criaturas.md) | Em refinamento | 10 (refina a 05) |
| 13 | [Perda de itens: captura, roubo e saque](13-perda-de-itens.md) | Em refinamento | 04, 10 |
| 14 | [Mecânicas exclusivas ainda não tratadas](14-mecanicas-exclusivas.md) | Em refinamento | 04, 08–13 |

Ordem sugerida: 01 e 02 → 06 (junto com 02) e §236 da 03 → 04 → 03 → 05.

## Fontes de verdade (vale para todas as specs)

1. `fontes_base/Steve Jackson's Sorcery (1of5) - The Shamutanti Hills.pdf`: livro original (OCR em `.plan/referencias/`).
2. `fontes_base/REGRAS.md`, `fontes_base/MAGIA.md`, `fontes_base/FICHA_DE_AVENTUREIRO.md`.
3. `src/game/book.json`: fonte principal da história no jogo, editada direto.
4. `scripts/Pages_pt-BR.md` e `scripts/parse-book.py`: apenas históricos. Não rodar o parser.

## Regras gerais

- Toda edição do `book.json` mantém o JSON válido e todos os destinos (`to`, `win`, `lucky`, `unlucky`) apontando para parágrafos existentes.
- Saves existentes no navegador (`grimorio-save-v2`) devem continuar carregando.
- Seguir o `AGENTS.md`.
