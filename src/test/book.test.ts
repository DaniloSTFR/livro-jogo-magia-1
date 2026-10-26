import { describe, expect, it } from "vitest";
import data from "@/game/book.json";
import exceptions from "@/game/reachability-exceptions.json";
import original from "./fixtures/original-exits.json";
import { DEATH_ID, combatExits, type BookParagraph } from "@/game/book";

type Book = Record<string, BookParagraph>;
const BOOK = (data as unknown as { paragraphs: Book }).paragraphs;
const paragraphs = Object.values(BOOK);
const exits = (p: BookParagraph) => [
  ...p.choices.map((c) => c.to),
  ...(p.combat ? combatExits(p.combat) : []),
  ...(p.luckTest ? [p.luckTest.lucky, p.luckTest.unlucky] : []),
];
const exitsOf = (id: number) => exits(BOOK[String(id)]!);

/** Exits pointing nowhere, as "§from → to"; 0 (death) is allowed only for the death fallbacks. */
const invalidExits = (book: Book) => Object.values(book).flatMap((p) => [
  ...p.choices.filter((c) => c.to === DEATH_ID && !c.libraUsedOnly && !c.diceDeath).map((c) => `§${p.id} → ${c.to}`),
  ...exits(p).filter((to) => to !== DEATH_ID && !book[String(to)]).map((to) => `§${p.id} → ${to}`),
]);
/** Paragraphs the reader cannot leave and that are not endings. */
const stuckParagraphs = (book: Book) =>
  Object.values(book).filter((p) => !p.end && !p.back && exits(p).length === 0).map((p) => p.id);

describe("book.json consistency", () => {
  it("has paragraphs 1 to 456", () => {
    expect(paragraphs).toHaveLength(456);
    for (let i = 1; i <= 456; i++) expect(BOOK[String(i)]?.id).toBe(i);
  });

  it("points every exit to an existing paragraph (0 only for death fallbacks)", () => {
    expect(invalidExits(BOOK)).toEqual([]);
  });

  it("leaves no paragraph without an exit unless it is an ending", () => {
    expect(stuckParagraphs(BOOK)).toEqual([]);
  });

  it("catches a broken destination or a dead end introduced on purpose", () => {
    const broken: Book = structuredClone(BOOK);
    broken["4"]!.choices[0]!.to = 999;
    broken["9"]!.combat = { enemies: [], win: 457 };
    broken["35"]!.choices = [];
    delete broken["35"]!.combat;
    delete broken["35"]!.luckTest;
    broken["187"]!.choices[0]!.to = DEATH_ID;
    expect(invalidExits(broken)).toEqual(["§4 → 999", "§9 → 457", "§187 → 0"]);
    expect(stuckParagraphs(broken)).toEqual([35]);
  });

  it("gives every spell choice a three-letter uppercase code", () => {
    const spells = paragraphs.flatMap((p) => p.choices.filter((c) => c.spell !== undefined).map((c) => [p.id, c.spell]));
    expect(spells.length).toBeGreaterThan(0);
    expect(spells.filter(([, code]) => !/^[A-Z]{3}$/.test(String(code)))).toEqual([]);
  });

  it("offers a non-Libra way out wherever the only exit needs Libra", () => {
    const stuck = paragraphs
      .filter((p) => !p.end && !p.back && !p.combat && !p.luckTest && p.choices.length > 0 && p.choices.every((c) => c.libra))
      .map((p) => p.id);
    expect(stuck).toEqual([]);
  });

  it("keeps text free of carriage returns", () => {
    expect(paragraphs.filter((p) => p.text.includes("\r")).map((p) => p.id)).toEqual([]);
  });
});

describe("reachability from §1", () => {
  // Numbered items: wherever the book hands one out, it can be used where a paragraph asks for its kind.
  const gained = paragraphs.flatMap((p) => p.gainItems ?? []);
  const itemExits = (p: BookParagraph) => {
    const use = p.numberedItem;
    return use ? gained.filter((i) => i.kind === use.kind).map((i) => i.number + use.offset) : [];
  };
  const reach = (withItems: boolean) => {
    const seen = new Set([1]);
    const stack = [1];
    while (stack.length) {
      const p = BOOK[String(stack.pop()!)]!;
      for (const to of [...exits(p), ...(withItems ? itemExits(p) : [])]) {
        if (to !== DEATH_ID && !seen.has(to)) { seen.add(to); stack.push(to); }
      }
    }
    return seen;
  };
  const ids = paragraphs.map((p) => p.id);

  it("leaves unreachable only the documented exceptions", () => {
    const seen = reach(true);
    expect(ids.filter((id) => !seen.has(id))).toEqual(exceptions.unreachable.map((e) => e.id));
  });

  it("documents every paragraph reached only through a numbered item", () => {
    const plain = reach(false);
    const withItems = reach(true);
    expect(ids.filter((id) => withItems.has(id) && !plain.has(id))).toEqual(exceptions.itemOnly.map((e) => e.id));
  });
});

describe("exits match the original book", () => {
  // The OCR left some paragraphs glued to the previous one, so the fixture compares groups of paragraphs.
  type Group = { paragraphs: number[]; exits: number[]; bookOnly?: number[]; originalOnly?: number[]; note?: string };
  const groups = (original as { groups: Group[] }).groups;
  const set = (xs: number[]) => [...new Set(xs)].sort((a, b) => a - b);
  // Spell lists and numbered items are compared elsewhere (Spec 01 and 03).
  const plainExits = (p: BookParagraph) => exits({ ...p, choices: p.choices.filter((c) => !c.spell) }).filter((to) => to !== DEATH_ID);

  it("covers every paragraph exactly once", () => {
    expect(groups.flatMap((g) => g.paragraphs).sort((a, b) => a - b)).toEqual(paragraphs.map((p) => p.id));
  });

  it("explains every difference it allows", () => {
    expect(groups.filter((g) => (g.bookOnly || g.originalOnly) && !g.note).map((g) => g.paragraphs[0])).toEqual([]);
  });

  it("leads where the original does, apart from the annotated exceptions", () => {
    const differ = groups.flatMap((g) => {
      const book = set(g.paragraphs.flatMap((id) => plainExits(BOOK[String(id)]!)).filter((to) => !g.bookOnly?.includes(to)));
      const orig = set(g.exits.filter((to) => !g.originalOnly?.includes(to)));
      return book.join() === orig.join() ? [] : [`§${g.paragraphs.join("+")}: book ${book} · original ${orig}`];
    });
    expect(differ).toEqual([]);
  });
});

describe("Spec 06 fixes", () => {
  it("§161 sends the reader who slept at the inn to the morning in Kristatanti (45)", () => {
    expect(exitsOf(161)).toEqual([62, 45]);
  });

  it("§187 does not send the reader to §79, a reference of the second adventure", () => {
    expect(exitsOf(187)).toEqual([212]);
  });
});

describe("Spec 02 fixes", () => {
  it.each([165, 190, 305, 328, 346, 431])("§%i is no longer a false ending", (id) => {
    expect(BOOK[String(id)]!.end).toBeUndefined();
  });

  it.each([
    [165, 206], [190, 126], [305, 117], [328, 47], [346, 420], [431, 79],
    [299, 158], [303, 63], [388, 227], [388, 420], [420, 227], [390, 64], [390, 151], [390, 3],
    [45, 125], [45, 226],
  ])("§%i leads to %i", (from, to) => {
    expect(exitsOf(from)).toContain(to);
  });
});

describe("Spec 03 fixes", () => {
  it("§236 is the original luck test (118 / 223) with no stray effects", () => {
    const p = BOOK["236"]!;
    expect(p.luckTest).toEqual({ lucky: 118, unlucky: 223 });
    expect(p.choices).toEqual([]);
    expect(p.effects).toEqual([]);
  });

  it.each([[9, 157], [277, DEATH_ID]])("§%i leads to %i", (from, to) => {
    expect(exitsOf(from)).toContain(to);
  });

  it("§9 no longer leads to §57", () => {
    expect(exitsOf(9)).not.toContain(57);
  });

  it("§166 offers its five options as spells", () => {
    expect(BOOK["166"]!.choices.filter((c) => c.spell).map((c) => c.spell)).toEqual(["NAP", "SIX", "BAG", "LAW", "KIL"]);
  });

  it.each([
    [199, "chave", 54], [186, "chave", 111], [244, "chave", 206], [183, "página", 102], [72, "machado", 233],
  ])("§%i hands out the %s nº %i", (id, kind, number) => {
    expect(BOOK[String(id)]!.gainItems).toContainEqual(expect.objectContaining({ kind, number }));
  });
});
