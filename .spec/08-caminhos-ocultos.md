# Spec 08 — Caminhos ocultos: §44, §101, §205 e §319

Status: **em refinamento**

## Objetivo
Tornar alcançáveis os parágrafos que o livro original só libera por números escondidos em itens ou por tarefas, sem nenhum "vá para" explícito, e decidir o que fazer com o que não tem caminho nenhum.

## Investigação (2026-10-24)

Fontes: `book.json`, OCR do original em `.plan/referencias/shamutanti_en_ocr.txt`.

### Como cada parágrafo é alcançado no original

| Destino | Como se chega | Onde o jogador obtém a pista | Onde a pista é usada | Conta |
|---|---|---|---|---|
| **§44** (a gaiola abre e a prisioneira é libertada) | Chave velha e enferrujada com o número **54** | §199 (caixa sobre a mesa na aldeia) | §4 (porta da gaiola): "subtraia 10 do número gravado na chave" | 54 − 10 = 44 |
| **§101** ("a chave não serve, volte para 4") | Chave de prata com o número **111** | §186 (pendurada no pescoço do Goblin morto) | §4 (porta da gaiola) | 111 − 10 = 101 |
| **§205** (o Minimita Jann vai embora e as magias voltam a funcionar) | Página do Grimório com o número **102** | §183 (o viajante dá a página) | §114 (a velha): "some o número da página que você possui ao número daquilo que deve ser a página seguinte" | 102 + 103 = 205 |
| **§319** ("você não tem um dente de Gigante… vá para 256") | **Nenhum caminho encontrado**, nem no original | — | — | — |

### Outros caminhos ocultos encontrados na mesma busca
- **§233** (Glandragor, +3 SORTE, contato Vik para Kharé): machado com o número **233** (§72; à venda no §141). Usado no §182: "vá para o número gravado no machado".
- **§223**: depende da correção do §236 (Spec 03).
- **Chave de cobre 206** (dada pelo mendigo): é para o próximo volume (Kharé). Deve ir para a ficha, mas não abre nada neste livro.

### Saída perdida que bloqueia uma cadeia inteira
- O §45 diz "escolha seu caminho indo para 125 **ou 226**", mas o `book.json` só tem a saída para 125 (o parser antigo pegou só o primeiro número).
- Só essa saída faltando deixa inalcançáveis 10, 46, 58, 82, 129, 150, 162, 173, 181, 188, 207, 221, 226, 234, 244, 250, 256, 265, 284, 338, 361, 384, 411 e 430 (o caminho do Gigante da colina e seus desdobramentos).
- É o mesmo tipo de erro da Spec 02.

### Simulação de alcance a partir do §1
| Cenário | Inalcançáveis |
|---|---|
| Hoje | 30 |
| Só com 45 → 226 | 44, 101, 205, 223, 233, 319 |
| Com 45 → 226, chaves no §4, página no §114, machado no §182 e §236 corrigido | **só o 319** |

### §319: provável parágrafo órfão do original
- O texto corresponde a lançar YOB contra o Gigante sem ter um dente de Gigante.
- Mas as duas listas de magia contra o Gigante (§162 e §207) mandam YOB para o §361, e o §361 já trata a falta do dente ("se não tiver, vá para 256").
- No OCR do original, nenhum parágrafo cita 319. Tudo indica que é um resto de uma versão anterior do livro (comum em livros-jogo).

## Proposta de requisitos (a refinar)

### A. Itens com número
1. Ao chegar nos parágrafos que entregam o item (§199, §186, §183, §72/§141, mendigo), oferecer um botão para guardar o item na ficha **com o número** (ex.: "Chave enferrujada — 54").
2. Modelo de item com número opcional, compatível com saves que guardam itens como texto.

### B. Usar o número
1. No §4: botão "Usar chave". O jogador escolhe uma chave da ficha e o jogo leva a `número − 10`.
2. No §114: botão "Usar página do Grimório". Leva a `página + (página + 1)`.
3. No §182: botão "Dar o machado". Leva ao número gravado no machado.
4. Marcação no `book.json`, ex.: `numbered: { item: "chave", formula: "n-10" }`, `{ item: "página", formula: "2n+1" }`, `{ item: "machado", formula: "n" }`.
5. Se o resultado não for um parágrafo válido, mostrar uma mensagem (não navegar).

### C. §45
1. Adicionar a saída 45 → 226 no `book.json` (pode ir para a Spec 02 como pendência).

### D. §319
1. Registrar como exceção documentada de alcance (órfão do original) no teste da Spec 06.

## Decisões a tomar no refinamento
1. **Revelar ou esconder a conta?** No livro, o jogador precisa lembrar o número e fazer a conta. Opções:
   - (a) o jogo faz a conta sozinho a partir do item na ficha (mais prático);
   - (b) o jogador digita o número do parágrafo, e o jogo só confere se ele existe (mais fiel, preserva a "charada");
   - (c) o jogador digita o número gravado e o jogo faz a conta.
2. **Exigir o item na ficha?** Só deixar usar a chave/página/machado se estiver na ficha, ou aceitar qualquer número digitado.
3. **§319:** deixar como órfão documentado, ou ligá-lo como alternativa no §162/§207 (o que alteraria o original).
4. **§45 → 226:** corrigir já junto com a Spec 02 ou aqui.
5. **Relação com a Spec 03:** a seção C da Spec 03 (itens com número gravado) passa a ser coberta por esta spec?

## Arquivos prováveis
`src/game/book.json`, `src/game/book.ts`, `src/game/useGame.ts`, `src/routes/index.tsx`, `src/components/game/Sheet.tsx`, `src/test/book.test.ts`.

## Critérios de aceite (rascunho)
- [ ] Com a chave 54, o §4 leva ao §44; com a chave 111, ao §101.
- [ ] Com a página 102, o §114 leva ao §205.
- [ ] Com o machado 233, o §182 leva ao §233.
- [ ] O §45 oferece as saídas 125 e 226.
- [ ] O teste de alcance só aceita o §319 como inalcançável (além das exceções documentadas).
