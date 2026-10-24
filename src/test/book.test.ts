import { describe, expect, it } from "vitest";
import data from "@/game/book.json";
import { DEATH_ID, type BookParagraph } from "@/game/book";

const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
const paragraphs = Object.values(BOOK);
const exits = (p: BookParagraph) => [
  ...p.choices.map((c) => c.to),
  ...(p.combat ? [p.combat.win] : []),
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
        if (c.to === DEATH_ID) expect(c.libraUsedOnly, `§${p.id}`).toBe(true);
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
  // Pending: §44, §101, §205, §233 need hidden numbers (Spec 08), §223 needs the §236 fix (Spec 03),
  // §319 looks orphaned in the original book. Shrink this list as those specs are done.
  const KNOWN_UNREACHABLE = [44, 101, 205, 223, 233, 319];

  it("reaches every paragraph except the known pending ones", () => {
    const seen = new Set([1]);
    const stack = [1];
    while (stack.length) {
      for (const to of exitsOf(stack.pop()!)) {
        if (to !== DEATH_ID && !seen.has(to)) { seen.add(to); stack.push(to); }
      }
    }
    const unreachable = paragraphs.map((p) => p.id).filter((id) => !seen.has(id));
    expect(unreachable).toEqual(KNOWN_UNREACHABLE);
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
