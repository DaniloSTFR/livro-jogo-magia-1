# Spec 14 — Reavaliação do book.json: mecânicas exclusivas ainda não tratadas

Status: **em refinamento**

## Objetivo
Levantar todas as mecânicas do livro que o jogo ainda não representa e decidir, para cada uma, se vira feature, efeito manual ou só texto.

## Investigação (2026-10-24)

Varredura do `book.json` por padrões de texto, comparada com o que o código implementa.

| Mecânica | Parágrafos | Situação hoje | Spec relacionada |
|---|---|---|---|
| **Minimita (Jann) no ombro**: enquanto ele estiver com você, **magias não funcionam** | 21, 37, 51, 67, 73, 100, 111, 114, 135, 171, 191, 204, 205, 212, 235, 243, 286, 305, 321, 333, 392, 394 | Não existe estado de companhia; as magias aparecem normalmente | nova |
| **Fome / refeição diária**: "comeu ontem/hoje?" muda ENERGIA e preços | 45, 178, 267 (+ estalagens 92, 161, 267) | Não há controle de dia nem de refeições | 09 |
| **Descanso noturno**: +2 ou +1 ENERGIA conforme encontro | 108, 283 (32 parágrafos falam de dormir/noite) | Efeito condicional manual | 11 |
| **Comer provisões só quando permitido** | 33 parágrafos citam provisões | Botão livre a qualquer hora | 04 |
| **Testes de HABILIDADE com dados** (rolar < HABILIDADE) | 93 (arrombar porta, −1 ENERGIA por tentativa), 142, 228 (3 dados) | Só botões de dados soltos | nova |
| **Tabelas e rolagens de dado** | 38, 123, 141, 214, 22, 227, 254, 270, 277, 295, 317, 366, 369, 388, 407, 417 | Dados soltos; sem desvio automático | 11, 12 |
| **Teste de SORTE repetido / sem custo** | 165 (3 seguidos), 218 (sem descontar SORTE) | Parcial (165 na Spec 02) | 13 |
| **Maldições, doenças, peste e veneno** | 73, 79, 124, 204, 213, 227, 272, 299, 305, 307, 325, 366, 369, 388, 417 | Lista de maldições sem como adicionar | 04 |
| **Perda de HABILIDADE / sem arma** | 122, 185, 228, 262 | Não tratado | 13 |
| **SORTE Inicial +1** | 456 | Automático no código | ok |
| **Itens para o próximo volume** (Vik, chave 206, chave de Kharé) | 1, 25, 33, 160, 187, 191, 233, 244, 456 | Só a chave do §456 é dada | 08 |
| **Anotar informações** (senhas, pistas) | 108, 273, 283, 357, 379, 450 | Campo de notas livre | nova |
| **Artefatos e limite de compra** | 17, 29, 32, 43, 48, 91, 122, 141, 280 | Não tratado | 09 |
| **Números escondidos** (chaves, página, machado) | 4, 114, 182 | Não tratado | 08 |
| **Escolha que depende de ter visitado/feito algo** ("se já…", "se ainda não…") | a levantar | Não tratado | nova |
| **Libra: Revitalização a qualquer momento** | regra geral | Ok | 04 |
| **Perda de equipamentos e provisões sem testes ** | 168|

## Proposta de requisitos
1. Para cada linha da tabela, registrar a decisão: **feature** (spec própria), **efeito manual** (botão/lembrete) ou **só texto**.
2. Criar specs para as mecânicas novas sem dono:
   - Minimita: estado "Jann no ombro" que bloqueia magias até o §205; liga/desliga pelos parágrafos onde ele entra e sai;
   - testes de HABILIDADE com dados e desvio automático;
   - marcadores de estado ("já fez X") para escolhas condicionais;
   - anotações estruturadas (pistas importantes registradas pelo jogo).
3. Varredura complementar: procurar condições do tipo "se você tiver/já/ainda não" e listar os parágrafos que dependem de estado.
4. Comparar com o original (OCR) para garantir que nenhuma mecânica foi perdida na tradução.

## Decisões a tomar
1. Qual o nível de automação desejado: o jogo aplica as regras sozinho ou o jogador segue o texto com ajuda (botões e lembretes)?
2. Minimita: bloquear as magias de verdade ou só avisar?
3. Controle de tempo (dias/noites/refeições): vale implementar ou fica manual?
4. Ordem de prioridade entre as mecânicas novas.

## Dependências
Todas as specs 04, 08–13.
