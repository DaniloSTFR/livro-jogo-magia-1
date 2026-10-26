import { describe, expect, it } from "vitest";
import data from "@/game/book.json";
import { getParagraph, type BookParagraph, type Combat } from "@/game/book";
import { canEscape, enemySkill, exchange, luckyDamage, makeAllies, playerSkill, rollFlee, weaponOptions, woundTaken } from "@/game/combat";
import { createCharacter } from "@/game/useGame";

const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
const combat = (id: number) => getParagraph(id).combat!;
/** Dice that come out in the given order. */
const dice = (...v: number[]) => { let i = 0; return () => v[i++]!; };

describe("Spec 05: combats in the middle of the text", () => {
  it("§375 fights the confused Ogre (SKILL 4, STAMINA 7) and wins to 15", () => {
    expect(combat(375)).toMatchObject({ enemies: [{ name: "Ogro", skill: 4, stamina: 7 }], win: 15 });
    expect(BOOK["375"]!.choices.map((c) => c.to)).toEqual([144]);
  });

  it("§383 fights the Wooden Golem with SKILL 4 for the first four rounds, then 8", () => {
    const c = combat(383);
    expect(c).toMatchObject({ enemies: [{ skill: 8, stamina: 6 }], win: 169 });
    expect([1, 2, 3, 4, 5].map((r) => enemySkill(c, 8, r, false))).toEqual([4, 4, 4, 4, 8]);
  });

  it("§317 keeps the Troll weakened after round 4 until an even die", () => {
    const c = combat(317);
    expect(enemySkill(c, 8, 6, false)).toBe(4);
    expect(enemySkill(c, 8, 6, true)).toBe(8);
  });

  it("§217 lists the three Goblins of the text", () => {
    expect(combat(217).enemies.map((e) => e.name)).toEqual(["Primeiro Goblin", "Segundo Goblin", "Terceiro Goblin"]);
  });

  it("shows the text's special rule wherever the fight has one", () => {
    for (const id of [20, 117, 203, 227, 317, 325, 328, 356, 361, 369, 383, 386, 388, 400, 407, 411, 425, 441, 442]) {
      expect(combat(id).rules, `§${id}`).toBeTruthy();
    }
  });
});

describe("Spec 05: structured rules", () => {
  it("doubles the damage with the sharpened sword (§328, §442) and luck scales it", () => {
    for (const id of [328, 442]) expect(combat(id).damage, `§${id}`).toBe(4);
    expect([luckyDamage(combat(328), true), luckyDamage(combat(328), false)]).toEqual([4, -2]);
    expect([luckyDamage(combat(2), true), luckyDamage(combat(2), false)]).toEqual([2, -1]);
  });

  it("applies roll modifiers to the Attack Strength", () => {
    expect(exchange(combat(20), 9, -2, 7, dice(3, 3, 3, 3)).sideStrength).toBe(13);
    expect(exchange(combat(386), 9, 0, 8, dice(3, 3, 3, 3)).enemyStrength).toBe(12);
    expect(exchange(combat(203), 9, 0, 6, dice(3, 3, 3, 3)).enemyStrength).toBe(14);
    expect(playerSkill(combat(411), 9)).toBe(18);
  });

  it("stings on a 5 or 6 when the enemy wounds", () => {
    const c = combat(388);
    const normal = exchange(c, 8, 0, 12, dice(1, 1, 6, 6, 4));
    expect([normal.result, normal.stung, woundTaken(c, normal, 9)]).toEqual(["hurt", false, 2]);
    const sting = exchange(c, 8, 0, 12, dice(1, 1, 6, 6, 5));
    expect([sting.stung, woundTaken(c, sting, 9)]).toEqual([true, 6]);
    const hit = exchange(c, 8, 0, 12, dice(6, 6, 1, 1));
    expect([hit.result, hit.stingDie]).toEqual(["hit", undefined]);
  });

  it("lets a lucky reader turn the Manticore's sting into a normal wound (§227)", () => {
    const c = combat(227);
    const ex = exchange(c, 9, 0, 12, dice(1, 1, 6, 6, 6));
    expect([woundTaken(c, ex, 10, false), woundTaken(c, ex, 10, true)]).toEqual([6, 2]);
  });

  it("kills a Goblin with the sting (§369)", () => {
    const c = combat(369);
    const ex = exchange(c, 5, 0, 12, dice(1, 1, 6, 6, 5));
    expect(woundTaken(c, ex, 5)).toBe(5);
  });
});

describe("Spec 05: allies", () => {
  it("§388: the Giant fights the Manticore; losing leaves the choices 227 and 420", () => {
    const c = combat(388);
    expect(c).toMatchObject({ mode: "ally", ally: { name: "Gigante", skill: 8, stamina: 9 }, enemies: [{ name: "Mantícora" }], win: 456 });
    expect(c.allyLost).toBeUndefined();
    expect(BOOK["388"]!.choices.map((c) => c.to)).toEqual([227, 420]);
  });

  it("§369 and §425 create as many Goblins as the reader chooses, 1 ENERGIA each", () => {
    for (const id of [369, 425]) expect(combat(id).ally).toMatchObject({ skill: 5, stamina: 5, choose: { cost: 1 } });
    expect(makeAllies(combat(369), 3).map((a) => a.name)).toEqual(["Goblin 1", "Goblin 2", "Goblin 3"]);
    expect(BOOK["369"]!.effects).toEqual([]);
  });

  it("§361 and §425 make the reader finish the fight when the allies lose", () => {
    for (const id of [361, 425]) expect(combat(id).allyLost).toBe("self");
    expect(makeAllies(combat(361))).toEqual([{ name: "Gigante Mágico", skill: 8, stamina: 9 }]);
  });
});

describe("Spec 05: escape, flight and weapons", () => {
  it("offers an escape only where the text does (§117)", () => {
    const withEscape = Object.values(BOOK).filter((p) => p.combat?.escape).map((p) => p.id);
    expect(withEscape).toEqual([117]);
    const c = combat(117);
    expect([canEscape(c, 3, 6), canEscape(c, 4, 6), canEscape(c, 3, 5)]).toEqual([true, false, false]);
    expect(canEscape(combat(2), 0, 20)).toBe(false);
  });

  it("§407: Goblins whose two dice reach their SKILL run away", () => {
    const c = combat(407);
    expect(c.flee).toEqual({ to: 202 });
    expect(rollFlee(c.enemies, dice(3, 3, 1, 1)).map((r) => r.fled)).toEqual([true, false]);
  });

  it("Glandragor's axe (233) takes 1 from the Attack Strength; the broadsword adds 1", () => {
    const s = { ...createCharacter("guerreiro", { skill: 9, stamina: 20, luck: 10 }, []), items: ["Espada", { name: "Machado de Glandragor", kind: "machado", number: 233 }, "Espada larga"] };
    expect(weaponOptions(s).map((w) => w.attack)).toEqual([0, -1, 1]);
  });

  it("keeps multiple enemies one at a time unless the text says otherwise", () => {
    const together = Object.values(BOOK).filter((p) => (p.combat as Combat | undefined)?.together).map((p) => p.id);
    expect(together).toEqual([]);
  });
});
