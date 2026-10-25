/**
 * Spec 04 — refeições permitidas pelo texto (`meal`) e preços fixos (`costs`) no book.json.
 *
 * Executado uma vez em 2026-10-24. Guardado como registro; recusa rodar de novo.
 * Uso: node scripts/fixes/2026-10-24-spec04.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/game/book.json";
const data = JSON.parse(readFileSync(PATH, "utf8"));
const P = (n) => data.paragraphs[String(n)];

if (P(18).meal) throw new Error("book.json já parece corrigido pela Spec 04");

// B. Onde o texto deixa comer Provisões: ENERGIA da primeira refeição do dia e, se o texto der, a de quem já comeu.
// O efeito opcional que fazia as vezes da refeição sai, para não somar ENERGIA sem gastar a provisão.
const isMealEffect = (e) => !e.auto && /comer|comido|refeição|provis/i.test(e.text);
const meal = (n, stamina, alreadyAte) => {
  P(n).meal = alreadyAte === undefined ? { stamina } : { stamina, alreadyAte };
  P(n).effects = P(n).effects.filter((e) => !isMealEffect(e));
};
meal(18, 2, 1);
meal(21, 2, 1);
meal(35, 2, 1);
meal(49, 2, 1);
meal(51, 2);
meal(62, 2, 1);
meal(71, 2, 1);
meal(76, 2, 1);
meal(108, 2, 1);
meal(127, 2);
meal(136, 2, 1);
meal(283, 2, 1);

// Comida oferecida no texto (não gasta Provisões): fica como efeito opcional, igual ao §222.
P(284).effects.push({ stat: "stamina", amount: 2, auto: false, text: "Você pode fazer uma refeição com ele e recuperar 2 pontos de ENERGIA." });

// D. Preços fixos citados no texto. Preços por dados (§22, §214) e a pechincha (§141) ficam para a Spec 09.
const costs = (n, ...list) => { P(n).costs = list.map(([gold, label]) => ({ gold, label })); };
costs(5, [3, "Saco de dentes"]);
costs(33, [2, "Conselho do velho"]);
costs(60, [10, "Joia fina"]);
costs(92, [5, "Cama para a noite"], [4, "Refeição"]);
costs(102, [3, "Visita à cachoeira"]);
costs(106, [6, "Espada finamente confeccionada"], [4, "Gorro de tecido"], [6, "Provisões para três refeições"]);
costs(107, [4, "Poção de herbalista"]);
costs(115, [3, "Noite na hospedaria"]);
costs(116, [1, "Refeição"]);
costs(134, [3, "Refeição farta"], [3, "Cama"]);
costs(161, [2, "Ensopado de Urso-Gambá"], [3, "Noite de descanso"]);
costs(204, [3, "Toalha (o malfeitor pega o ouro)"]);
costs(211, [3, "Noite de descanso"], [2, "Refeição nutritiva"]);
costs(230, [2, "Caneca de cerveja"]);
costs(244, [1, "Esmola ao mendigo"]);
costs(257, [1, "Refeição quente"], [2, "Pão e queijo (duas refeições)"]);
costs(266, [1, "Caneca de cerveja"]);
costs(267, [3, "Comida quente"], [5, "Cama para a noite"]);
for (const n of [296, 386, 400, 441]) costs(n, [1, "Peça de Ouro usada na magia"]);

writeFileSync(PATH, JSON.stringify(data, null, 4), "utf8");
console.log("Spec 04 aplicada.");
