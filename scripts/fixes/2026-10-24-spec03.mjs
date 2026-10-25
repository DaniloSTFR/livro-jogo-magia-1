/**
 * Spec 03 — §236 (erro de tradução), revisão dos 46 parágrafos não separados pelo OCR
 * e itens com número gravado no book.json.
 *
 * Executado uma vez em 2026-10-24. Guardado como registro; recusa rodar de novo.
 * Uso: node scripts/fixes/2026-10-24-spec03.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/game/book.json";
const data = JSON.parse(readFileSync(PATH, "utf8"));
const P = (n) => data.paragraphs[String(n)];

if (P(236).luckTest) throw new Error("book.json já parece corrigido pela Spec 03");

// A. §236: no original é só um teste de sorte (o texto do corcunda pertence a outro parágrafo).
Object.assign(P(236), {
  text: "Teste sua Sorte. Se tiver Sorte, vá para 118. Se tiver Azar, vá para 223.",
  choices: [],
  effects: [],
  luckTest: { lucky: 118, unlucky: 223 },
});

// B. Divergências da revisão (.plan/revisao-paragrafos-nao-separados.md).
// §9: o caminho elevado é o 157 (o mesmo do §183), não o 57.
P(9).text = P(9).text.replace("(vá para 57)", "(vá para 157)");
P(9).choices[1].to = 157;
// §166: as opções são magias, mas não estavam marcadas como tal.
P(166).choices = P(166).choices.map((c) =>
  /^[A-Z]{3}$/.test(c.label) ? { to: c.to, label: `Lançar ${c.label}`, spell: c.label } : c,
);
// §277: tirar dois seis encerra a aventura.
P(277).choices.unshift({ to: 0, label: "Tirou dois seis: você quebra o pescoço na queda", diceDeath: true });

// C. Itens com número gravado: onde o jogador os recebe.
const gain = (n, ...items) => { P(n).gainItems = items; };
gain(199, { name: "Chave velha e enferrujada", kind: "chave", number: 54 });
gain(186, { name: "Chave de prata", kind: "chave", number: 111 });
gain(244, { name: "Chave de cobre", kind: "chave", number: 206 });
gain(183, { name: "Página do Grimório", kind: "página", number: 102 });
gain(72, { name: "Machado de Glandragor", kind: "machado", number: 233 });

// Onde o número é usado. §114 (página) e §182 (machado) ficam para a Spec 08.
P(4).numberedItem = { kind: "chave", offset: -10, label: "Usar uma chave na porta da gaiola" };

writeFileSync(PATH, JSON.stringify(data, null, 4), "utf8");
console.log("Spec 03 aplicada.");
