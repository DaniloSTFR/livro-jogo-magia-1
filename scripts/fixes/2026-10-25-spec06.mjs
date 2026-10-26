/**
 * Spec 06 — saídas do book.json que a conferência com o original (OCR) mostrou erradas.
 *
 * Executado uma vez em 2026-10-25. Guardado como registro; recusa rodar de novo.
 * Uso: node scripts/fixes/2026-10-25-spec06.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/game/book.json";
const data = JSON.parse(readFileSync(PATH, "utf8"));
const P = (n) => data.paragraphs[String(n)];
const replaceText = (n, from, to) => {
  if (!P(n).text.includes(from)) throw new Error(`§${n}: trecho não encontrado: ${from}`);
  P(n).text = P(n).text.replace(from, to);
};

if (!P(161).choices.some((c) => c.to === 43)) throw new Error("book.json já parece corrigido pela Spec 06");

// §161: quem passou a noite na estalagem segue para a manhã em Kristatanti (45), não para a espada larga (43).
replaceText(161, "vá agora para 43", "vá agora para 45");
P(161).choices.find((c) => c.to === 43).to = 45;

// §187: a referência 79 é da segunda aventura; no livro 1 o §79 é o portador da praga.
P(187).choices = P(187).choices.filter((c) => c.to !== 79);
P(187).choices.find((c) => c.to === 212).label = "Acrescente 2 pontos de SORTE e continue";

writeFileSync(PATH, JSON.stringify(data, null, 4), "utf8");
console.log("Spec 06 aplicada.");
