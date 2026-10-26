/**
 * Spec 05 — combates especiais no book.json: combates no meio do texto, aliados, regras especiais, fuga e armas.
 *
 * Executado uma vez em 2026-10-25. Guardado como registro; recusa rodar de novo.
 * Uso: node scripts/fixes/2026-10-25-spec05.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/game/book.json";
const data = JSON.parse(readFileSync(PATH, "utf8"));
const P = (n) => data.paragraphs[String(n)];
const dropChoice = (n, to) => { P(n).choices = P(n).choices.filter((c) => c.to !== to); };
const relabel = (n, to, label) => { P(n).choices.find((c) => c.to === to).label = label; };
const replaceText = (n, from, to) => {
  if (!P(n).text.includes(from)) throw new Error(`§${n}: trecho não encontrado: ${from}`);
  P(n).text = P(n).text.replace(from, to);
};

if (data.weapons) throw new Error("book.json já parece corrigido pela Spec 05");

const MANTICORA = { name: "Mantícora", skill: 12, stamina: 18 };
const GOBLINS_217 = [
  { name: "Primeiro Goblin", skill: 5, stamina: 4 },
  { name: "Segundo Goblin", skill: 6, stamina: 4 },
  { name: "Terceiro Goblin", skill: 5, stamina: 5 },
];

// A. Combates descritos no meio do texto.
P(375).combat = { enemies: [{ name: "Ogro", skill: 4, stamina: 7 }], win: 15, rules: "O Ogro está confuso pela magia e luta com HABILIDADE 4." };
dropChoice(375, 15);
P(383).combat = {
  enemies: [{ name: "Golem De Madeira", skill: 8, stamina: 6 }], win: 169,
  weakened: { skill: 4, rounds: 4 },
  rules: "Lento pela magia, o Golem de Madeira luta com HABILIDADE 4 nas quatro primeiras Rodadas de Ataque.",
};
dropChoice(383, 87);
P(325).combat = {
  enemies: [MANTICORA], win: 456,
  weakened: { skill: 6, rounds: 4 },
  sting: { damage: 6, luckSaves: true },
  rules: "A Mantícora luta com metade da HABILIDADE (6) nas 4 primeiras Rodadas de Ataque. Ferrão: a cada ferimento que ela causar, role um dado; 5 ou 6 causa 6 de dano, a menos que você tenha SORTE (como no §227).",
};
dropChoice(325, 227);
P(356).combat = {
  enemies: [{ name: "Elvin", skill: 6, stamina: 4 }], win: 121,
  doubleSkill: true, enemyRoll: 2,
  rules: "Gigante pela magia, você dobra sua HABILIDADE. A velocidade do Elvin soma 2 à rolagem dele (§203).",
};
delete P(356).luckTest;
delete P(356).back;
P(356).luckFree = true;
P(356).choices = [{ to: 148, label: "Se tiver SORTE, a criatura voa para longe com os companheiros e você volta a dormir" }];
P(400).combat = {
  enemies: [{ name: "Ogro", skill: 8, stamina: 7 }], win: 15, enemyRoll: -2,
  rules: "Com a Peça de Ouro, o escudo invisível subtrai 2 da rolagem do Ogro. Depois da luta, a moeda vira metal inútil.",
};
relabel(400, 285, "Sem Peça de Ouro: o Ogro o ataca enquanto você lança a magia (-2 ENERGIA); volte para 285");
P(400).effects.push({ stat: "stamina", amount: -2, auto: false, text: "Sem Peça de Ouro: o Ogro salta sobre você (2 pontos adicionais de ENERGIA)." });
P(441).combat = {
  enemies: [{ name: "Elvin", skill: 6, stamina: 4 }], win: 121, enemyRoll: 0,
  rules: "Com a Peça de Ouro, o escudo subtrai 2 da rolagem do Elvin, o que anula os 2 da velocidade dele (§203). Depois da luta, a moeda não serve mais.",
};
relabel(441, 203, "Sem Peça de Ouro: a magia não funciona e o Elvin o corta de novo (-2 ENERGIA); volte para 203 e escolha novamente");
P(441).effects.push({ stat: "stamina", amount: -2, auto: false, text: "Sem Peça de Ouro: o Elvin corta você novamente (2 pontos de ENERGIA)." });

// C. Regras especiais dos combates que já existiam.
Object.assign(P(20).combat, { playerRoll: -2, rules: "O cheiro é tão forte que você subtrai 2 da sua rolagem de Força de Ataque." });
Object.assign(P(203).combat, { enemyRoll: 2, rules: "A velocidade do Elvin soma 2 à rolagem dele na Força de Ataque." });
Object.assign(P(386).combat, { enemyRoll: -2, rules: "O escudo da magia subtrai 2 da rolagem do Troll. Depois da luta, a Peça de Ouro vira metal inútil." });
Object.assign(P(411).combat, { doubleSkill: true, rules: "Do tamanho do Gigante, você dobra sua HABILIDADE enquanto durar a magia." });
Object.assign(P(317).combat, {
  enemies: [{ name: "Sentinela Troll", skill: 8, stamina: 7 }],
  weakened: { skill: 4, rounds: 4, recover: "even" },
  rules: "A magia dura 4 Rodadas de Ataque (HABILIDADE 4). Depois, antes de cada rodada, role um dado: ímpar, o Troll continua sem a alabarda (HABILIDADE 4); par, ele a recupera e luta com HABILIDADE 8.",
});
Object.assign(P(227).combat, {
  sting: { damage: 6, luckSaves: true },
  rules: "Ferrão: a cada ferimento que a Mantícora causar, role um dado; 5 ou 6 causa 6 de dano, a menos que você tenha SORTE ao Testar a SORTE.",
});
P(328).combat = {
  enemies: [{ name: "Goblin", skill: 7, stamina: 6 }], win: 186, damage: 4,
  rules: "Só com cera de abelha: sua espada afiada pela magia causa o dobro do dano ao Goblin nesta luta. Você usou metade da cera.",
};
relabel(328, 47, "Sem cera de abelha: o Goblin o ataca (-3 ENERGIA); volte para 47 e lute contra ele");
P(217).combat.enemies = GOBLINS_217;
P(442).combat = {
  enemies: GOBLINS_217, win: 155, damage: 4,
  rules: "Só com cera de abelha: cada vez que atingir um Goblin, você dobra o dano. Se já usou esta magia antes, a cera acabou; senão, usou metade.",
};
relabel(442, 217, "Sem cera de abelha: a espada não foi afiada; volte para 217 e lute com dano normal");

// B. Combates com aliado.
P(388).combat = {
  enemies: [MANTICORA], win: 456, mode: "ally",
  ally: { name: "Gigante", skill: 8, stamina: 9 },
  sting: { damage: 6 },
  rules: "Ferrão: cada vez que a Mantícora atingir o Gigante, role um dado; 5 ou 6 causa 6 de dano. Se a Mantícora vencer, termine você mesmo (227) ou lance outra magia (420).",
};
relabel(388, 227, "Sem dente de Gigante, ou se a Mantícora vencer o Gigante: termine o trabalho com sua arma");
// O original dá ENERGIA 5 aos Goblins (a tradução trazia 3).
replaceText(369, "**GOBLINS — HABILIDADE: 5, ENERGIA: 3.**", "**GOBLINS — HABILIDADE: 5, ENERGIA: 5.**");
P(369).combat = {
  enemies: [MANTICORA], win: 456, mode: "ally",
  ally: { name: "Goblin", skill: 5, stamina: 5, choose: { cost: 1 } },
  sting: { damage: 0, kill: true },
  rules: "Os Goblins atacam um após o outro. Ferrão: cada vez que a Mantícora atingir um Goblin, role um dado; 5 ou 6 o mata. Se ela derrotar todos, termine com sua espada (227) ou lance outra magia (420).",
};
P(369).effects = P(369).effects.filter((e) => e.text !== "Perca 1 ponto de ENERGIA por dente.");
P(361).combat = {
  enemies: [{ name: "Gigante Da Colina", skill: 9, stamina: 11 }], win: 265, mode: "ally",
  ally: { name: "Gigante Mágico", skill: 8, stamina: 9 }, allyLost: "self",
  rules: "Se o Gigante da Colina derrotar seu campeão, você termina a batalha sozinho, com a ENERGIA que restar a ele.",
};
// O original causa 5 de dano sem dentes de Goblin (a tradução trazia 3).
replaceText(425, "causando 3 pontos de dano de ENERGIA", "causando 5 pontos de dano de ENERGIA");
P(425).combat = {
  enemies: [{ name: "Cão-Lobo", skill: 7, stamina: 6 }], win: 50, mode: "ally",
  ally: { name: "Goblin", skill: 5, stamina: 5, choose: { cost: 1 } }, allyLost: "self",
  rules: "Cada Goblin custa 1 de ENERGIA. Se eles não matarem o Cão-Lobo, você termina o serviço. Sem dentes de Goblin, crie 0 Goblins e lute você mesmo (aplique os 5 de dano abaixo).",
};
P(425).effects = [{ stat: "stamina", amount: -5, auto: false, text: "Sem dentes de Goblin: o Cão-Lobo salta em sua garganta (5 pontos de ENERGIA)." }];

// F. Múltiplos inimigos: no §407 o primeiro Goblin já morreu pelo ZAP; os outros podem fugir antes da luta.
Object.assign(P(407).combat, {
  flee: { to: 202 },
  rules: "O primeiro Goblin morreu com a magia. Role dois dados para cada um dos outros: com resultado igual ou maior que a HABILIDADE dele, ele foge. Se ambos fugirem, vá para 202.",
});
dropChoice(407, 202);

// E. Fuga durante a luta, só onde o texto oferece.
P(117).combat.escape = { to: 187, label: "Poupar a vida do Assassino", enemyAtMost: 3, playerAtLeast: 6 };
P(117).combat.rules = "Você pode poupar a vida dele quando a ENERGIA dele chegar a 3 ou menos, se estiver claramente vencendo (sua ENERGIA de pelo menos 6).";
dropChoice(117, 187);

// D. Armas com modificador de Força de Ataque.
data.weapons = [
  { match: ["machado"], attack: -1, paragraph: 72 },
  { match: ["espada larga", "lâmina larga"], attack: 1, paragraph: 43 },
];

writeFileSync(PATH, JSON.stringify(data, null, 4), "utf8");
console.log("Spec 05 aplicada.");
