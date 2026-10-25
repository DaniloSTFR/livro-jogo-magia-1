import { describe, expect, it } from "vitest";
import data from "@/game/book.json";
import { getParagraph, type BookParagraph } from "@/game/book";
import {
  addCondition, addItem, adjustGold, afflictions, attackModifier, canEat, createCharacter, eatMeal, goto, libraCleanse,
  normalizeSave, numberedItems, pay, removeItem, type GameState,
} from "@/game/useGame";

const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
const hero = (paragraph = 1): GameState => ({
  ...createCharacter("mago", { skill: 9, stamina: 20, luck: 10 }, []),
  current: { skill: 9, stamina: 10, luck: 10 }, paragraph, history: [1, paragraph],
});

describe("starting equipment", () => {
  it.each(["guerreiro", "mago"] as const)("%s starts with sword, backpack, 20 gold and 2 provisions", (cls) => {
    const s = createCharacter(cls, { skill: 9, stamina: 20, luck: 10 }, []);
    expect(s.items).toEqual(["Espada", "Mochila"]);
    expect([s.gold, s.provisions]).toEqual([20, 2]);
  });
});

describe("meals", () => {
  it("marks only paragraphs whose text lets the reader eat", () => {
    const meals = Object.values(BOOK).filter((p) => p.meal).map((p) => p.id);
    expect(meals).toEqual([18, 21, 35, 49, 51, 62, 71, 76, 108, 127, 136, 283]);
    for (const id of meals) expect(BOOK[String(id)]!.text, `§${id}`).toMatch(/comer|comido|refeição/i);
  });

  it("does not let the reader eat where the text does not allow it", () => {
    expect(canEat(hero(1), getParagraph(1).meal)).toBe(false);
  });

  it("adds the text's ENERGIA, spends one provision and allows one meal per visit", () => {
    const meal = getParagraph(35).meal!;
    const once = eatMeal(hero(35), meal);
    expect([once.current.stamina, once.provisions]).toEqual([12, 1]);
    expect(eatMeal(once, meal)).toBe(once);
    expect(eatMeal(hero(35), meal, true).current.stamina).toBe(11);
    const later = goto(goto(once, 71), 35, { skipEffects: true });
    expect(canEat(later, meal)).toBe(true);
  });

  it("needs provisions", () => {
    expect(canEat({ ...hero(35), provisions: 0 }, getParagraph(35).meal)).toBe(false);
  });
});

describe("gold and items", () => {
  it("marks fixed prices pointing at real amounts", () => {
    for (const p of Object.values(BOOK).filter((x) => x.costs)) {
      for (const c of p.costs!) expect(c.gold, `§${p.id}`).toBeGreaterThan(0);
    }
    expect(getParagraph(5).costs).toEqual([{ gold: 3, label: "Saco de dentes" }]);
  });

  it("pays only with enough gold", () => {
    const cost = { gold: 3, label: "Saco de dentes" };
    expect(pay(hero(5), cost).gold).toBe(17);
    const poor = { ...hero(5), gold: 2 };
    expect(pay(poor, cost)).toBe(poor);
  });

  it("adjusts gold without going below zero", () => {
    expect(adjustGold(hero(), 5).gold).toBe(25);
    expect(adjustGold({ ...hero(), gold: 0 }, -1).gold).toBe(0);
  });

  it("adds and removes items, with an optional stamped number", () => {
    let s = addItem(hero(), "Gorro de tecido");
    s = addItem(s, "Chave de prata", 111);
    expect(numberedItems(s, "chave")).toEqual([{ name: "Chave de prata", kind: "chave", number: 111 }]);
    expect(removeItem(s, 2).items).toEqual(["Espada", "Mochila", { name: "Chave de prata", kind: "chave", number: 111 }]);
  });
});

describe("conditions and Libra", () => {
  it("sums attack modifiers from the sheet", () => {
    const s = addCondition(addCondition(hero(), { name: "Machado 233", kind: "penalty", attack: -1 }), { name: "Febre", kind: "disease" });
    expect(attackModifier(s)).toBe(-1);
    expect(afflictions(s).map((c) => c.name)).toEqual(["Febre"]);
  });

  it("lifts curses and diseases but keeps bonuses and penalties", () => {
    let s = addCondition(hero(), { name: "Machado 233", kind: "penalty", attack: -1 });
    s = addCondition(addCondition(s, { name: "Febre", kind: "disease" }), { name: "Praga", kind: "curse" });
    const c = libraCleanse(s);
    expect(c.libraUsed).toBe(true);
    expect(c.conditions.map((x) => x.name)).toEqual(["Machado 233"]);
  });
});

describe("old saves", () => {
  it("loads a save with curses and no conditions", () => {
    const { conditions: _, ...old } = hero();
    const s = normalizeSave({ ...old, curses: ["Praga"] });
    expect(s.conditions).toEqual([{ name: "Praga", kind: "curse" }]);
    expect("curses" in s).toBe(false);
  });

  it("loads a save with no curses, conditions or spells", () => {
    const { conditions: _, spells: __, ...old } = hero();
    const s = normalizeSave(old as Parameters<typeof normalizeSave>[0]);
    expect(s.conditions).toEqual([]);
    expect(s.spells).toEqual([]);
  });
});
