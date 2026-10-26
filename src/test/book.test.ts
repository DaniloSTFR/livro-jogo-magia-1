import { describe, expect, it } from "vitest";
import data from "@/game/book.json";
import exceptions from "@/game/reachability-exceptions.json";
import { DEATH_ID, combatExits, type BookParagraph } from "@/game/book";

const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
const paragraphs = Object.values(BOOK);
const exits = (p: BookParagraph) => [
  ...p.choices.map((c) => c.to),
  ...(p.combat ? combatExits(p.combat) : []),
  ...(p.luckTest ? [p.luckTest.lucky, p.luckTest.unlucky] : []),
];
const exitsOf = (id: number) => exits(BOOK[String(id)]!);

describe("book.json consistency", () => {
  it("has paragraphs 1 to 456", () => {
    expect(paragraphs).toHaveLength(456);
    for (let i = 1; i <= 456; i++) expect(BOOK[String(i)]?.id).toBe(i);
  });

  it("points every exit to an existing paragraph (0 only for death fallbacks)", () => {
    for (const p of paragraphs) {
      for (const c of p.choices) {
        if (c.to === DEATH_ID) expect(c.libraUsedOnly || c.diceDeath, `§${p.id}`).toBe(true);
        else expect(BOOK[String(c.to)], `§${p.id} → ${c.to}`).toBeDefined();
      }
      for (const to of exits(p).filter((t) => t !== DEATH_ID)) expect(BOOK[String(to)], `§${p.id} → ${to}`).toBeDefined();
    }
  });

  it("leaves no paragraph without an exit unless it is an ending", () => {
    const stuck = paragraphs.filter((p) => !p.end && !p.back && exits(p).length === 0).map((p) => p.id);
    expect(stuck).toEqual([]);
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
