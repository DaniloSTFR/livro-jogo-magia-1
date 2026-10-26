/**
 * Spec 06 — gera `src/test/fixtures/original-exits.json`: as saídas "turn to N" de cada parágrafo do original,
 * lidas do OCR e revisadas à mão (tabela REVIEW abaixo).
 *
 * O OCR não separou 46 parágrafos (o texto ficou no anterior), então a fixture agrupa os parágrafos como o OCR os
 * deixou e o teste compara a união das saídas de cada grupo. Listas de magias e itens numerados não entram.
 *
 * Executado uma vez em 2026-10-25. Guardado como registro; recusa rodar de novo (a fixture passou a ser editada à mão).
 * Uso: node scripts/fixes/2026-10-25-spec06-original-exits.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OCR = ".plan/referencias/shamutanti_en_paragrafos_ocr.json";
const OUT = "src/test/fixtures/original-exits.json";
if (existsSync(OUT)) throw new Error(`${OUT} já existe; edite-o à mão`);

const ocr = JSON.parse(readFileSync(OCR, "utf8"));
// "turn to 5", "Turn next to 280", "turning to 63", "return to 123", "Turn to5", com erros de OCR comuns (tum, turty).
const EXIT = /\b(?:t[uw]r?n|tum|turty|return)(?:ing)?\s+(?:next\s+|now\s+|back\s+)?to\s*(?:reference\s+)?(\d{1,3})\b/gi;
const sorted = (xs) => [...new Set(xs)].sort((a, b) => a - b);

/**
 * Revisão à mão, pela primeira referência do grupo. `exits`: as saídas do original quando o OCR errou;
 * `bookOnly` / `originalOnly`: diferenças intencionais do book.json; `merge`: grupos que o OCR embaralhou.
 */
const REVIEW = {
  2: { paragraphs: [1, 2, 3], note: "O §1 está no texto antes do cabeçalho do §2." },
  45: { exits: [125, 226], note: "\"turning either to 125 or 226\"." },
  103: { exits: [117], note: "O OCR leu 147; o §117 é a luta com o estranho de cimitarra (Assassino)." },
  126: { exits: [43, 72, 95, 152, 190, 249, 274], note: "Referências entre parênteses: a poção (274), a espada (43)…" },
  142: { exits: [90, 278], note: "O OCR leu \"turn to go\" (90)." },
  187: { originalOnly: [79], note: "A referência 79 é da segunda aventura (Spec 06)." },
  248: { exits: [87, 126, 176, 188], note: "§248–250 grudados; o OCR cortou 87 e 188." },
  258: { exits: [196, 199, 202, 251], note: "§259 ilegível no OCR (\"Tum tease\" = 202)." },
  260: { exits: [3, 16], note: "OCR ilegível na segunda saída (16)." },
  261: { exits: [131], note: "OCR ilegível na saída (131)." },
  325: { bookOnly: [456], originalOnly: [227], note: "Spec 05: a luta com a Mantícora acontece no próprio parágrafo." },
  328: { bookOnly: [186], note: "Spec 05: com cera de abelha a luta acontece no próprio parágrafo." },
  330: { paragraphs: [330, 331, 332, 333, 334], note: "O OCR embaralhou §330–334 (o §332 e o §333 saíram no §334)." },
  356: { bookOnly: [121], originalOnly: [203], note: "Spec 05: a luta com o Elvin acontece no próprio parágrafo." },
  383: { bookOnly: [169], originalOnly: [87], note: "Spec 05: a luta com o Golem acontece no próprio parágrafo." },
  400: { bookOnly: [15], note: "Spec 05: com a Peça de Ouro a luta com o Ogro acontece no próprio parágrafo." },
  435: { exits: [51, 73], note: "O OCR leu \"turty to 51\"." },
  441: { bookOnly: [121], note: "Spec 05: com a Peça de Ouro a luta com o Elvin acontece no próprio parágrafo." },
  442: { bookOnly: [155], note: "Spec 05: com cera de abelha a luta com os Goblins acontece no próprio parágrafo." },
  456: { originalOnly: [12], note: "A referência 12 é da segunda aventura." },
};

const keys = Object.keys(ocr).map(Number).sort((a, b) => a - b);
const groups = [];
const taken = new Set();
for (const k of keys) {
  if (taken.has(k)) continue;
  const review = REVIEW[k] ?? {};
  const paragraphs = review.paragraphs ?? [k];
  if (!review.paragraphs) for (let j = k + 1; j <= 456 && !ocr[j]; j++) paragraphs.push(j);
  const read = sorted(paragraphs.filter((p) => ocr[p]).flatMap((p) => [...ocr[p].matchAll(EXIT)].map((m) => +m[1])));
  const exits = review.exits ?? read;
  const group = { paragraphs, exits };
  if (review.exits) group.ocr = read;
  if (review.bookOnly) group.bookOnly = review.bookOnly;
  if (review.originalOnly) group.originalOnly = review.originalOnly;
  if (review.note) group.note = review.note;
  for (const p of paragraphs) taken.add(p);
  groups.push(group);
}

mkdirSync("src/test/fixtures", { recursive: true });
writeFileSync(OUT, JSON.stringify({ source: OCR, groups }, null, 2) + "\n", "utf8");
console.log(`${groups.length} grupos gravados em ${OUT}.`);
