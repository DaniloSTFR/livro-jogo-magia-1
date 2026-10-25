# Spec 09 — Compras em lojas, estalagens e provisões

Status: **em refinamento** · Refina a Spec 04 (seções B, D e E)

## Objetivo
Permitir que o jogador compre, pague e receba itens, ouro e provisões conforme o texto, sem depender de anotar à mão.

## Investigação (2026-10-24)

### Lojas e mercadores
| § | Onde | O que vende | Regra especial |
|---|---|---|---|
| 106 | Loja da aldeia | Espada fina 6 PO (→194), gorro de tecido 4 PO (→247), provisões para 3 refeições 6 PO (→97) | Sem dinheiro: pode pedir trabalho |
| 264 / 280 | Mercador (cabana) | Poção 4 PO (107), espada larga **2 dados** PO (214), flauta **1 dado** PO (22), machado 7 PO **com pechincha** (141), saco de dentes 3 PO (5), joia 10 PO (60) | **Só pode examinar 3 artefatos** (§280); depois §91 → §126 para "descobrir o que comprou" |
| 126 | Depois da compra | Examina cada compra: poção (274), espada (43), cachimbo (249), machado (72), dentes (190), joia (152) | Só deve oferecer o que foi comprado |
| 194 | Espada fina | Dano 3 em vez de 2 | Não pode ter duas espadas; devolução se Testar a SORTE com sucesso |

### Estalagens e comida
| § | Preço | Efeito |
|---|---|---|
| 92 | cama 5, refeição 4 | +2 ENERGIA (+1 se já comeu hoje) |
| 134 | refeição 3, cama 3 | — |
| 161 / 211 | refeição 2, cama 3 | refeição +3 ENERGIA; pode comer as próprias provisões |
| 115 | cama 3 | +2 ENERGIA |
| 116 / 257 | refeição 1; provisões para 2 refeições 2 PO | +2 ENERGIA |
| 267 | comida 3, cama 5 | depende de já ter comido hoje |

### Outros pagamentos
§33 (conselho, 2 PO), §102 (cachoeira, 3 PO), §204, §230 e §266 (cerveja 1–2 PO), §226/§244 (esmola de 1 PO → chave 206).

### Dinheiro especial
§15 e §352: **pedras preciosas valem 10 PO, mas não dão troco**.

### Ganhos de ouro (saque)
§57 (12), §87 (7), §153 (3), §155 (2), §177 (3), §213 (2), §258 (5), §263 (3), §265 (8), §456 (10, já automático).

## Proposta de requisitos
1. **Ficha:** ouro com +/−, provisões com +/−, itens com adicionar/remover (base da Spec 04).
2. **Ofertas no `book.json`:** cada parágrafo de compra ganha uma lista de ofertas, ex.:
   `shop: [{ label: "Provisões para 3 refeições", price: 6, gives: { provisions: 3 } }]`.
   - preço fixo (`price`), por dados (`priceDice: 1|2`) ou com pechincha (`haggle`);
   - botão "Comprar" desabilitado se o ouro não bastar.
3. **Estalagens:** botões "Comer (N PO)" e "Dormir (N PO)" que descontam o ouro e aplicam a ENERGIA do texto.
4. **Ganhos:** botão "Pegar N Peças de Ouro" nos parágrafos de saque (uma vez por visita).
5. **Pedras preciosas:** item "Pedra preciosa (10 PO, sem troco)"; ao pagar com ela, o troco é perdido.
6. **Limite de 3 artefatos no §280:** contar os artefatos examinados e bloquear o quarto.
7. **§126:** mostrar só as opções dos itens comprados.

## Decisões a tomar
1. Automatizar tudo (botões por oferta) ou só dar a ficha editável e deixar o jogador seguir o texto?
2. Preço por dados (§22, §214): o jogo rola sozinho ou o jogador usa os dados da tela?
3. Pechincha do §141: implementar a regra completa ou deixar manual?
4. Controlar "já comeu hoje" (ver Spec 14, fome) ou deixar o jogador escolher o valor?
5. Pedras preciosas: tratar como ouro especial ou como item?

## Dependências
Spec 04 (ficha editável), Spec 10 (efeitos dos itens comprados), Spec 14 (fome/dia).
