import { describe, expect, it } from "vitest";
import { LIBRA_TARGETS, getParagraph, type Combat } from "@/game/book";
import { luckyDamage, luckyWound, playerDamage } from "@/game/combat";
import { visibleChoices } from "@/game/spells";
import {
  applyEffect, createCharacter, eatMeal, goto, libraCleanse, libraRevive, luckTest, normalizeSave, type GameState,
} from "@/game/useGame";

const hero = (current: Partial<GameState["current"]> = {}): GameState => {
  const s = createCharacter("mago", { skill: 9, stamina: 20, luck: 8 }, []);
  return { ...s, current: { ...s.initial, ...current } };
};
const fight: Combat = { enemies: [{ name: "Goblin", skill: 5, stamina: 5 }], win: 1 };

describe("spell options (Spec 01)", () => {
  const assassin = getParagraph(117).choices; // MUG, WOK, ZAP, KIL, FIX
  const spells = (cls: GameState["cls"]) => visibleChoices(assassin, cls, ["ZAP"]).filter((v) => v.choice.spell).map((v) => v.choice.spell);

  it("shows a wizard every spell option of the paragraph", () => {
    expect(spells("mago")).toEqual(["MUG", "WOK", "ZAP", "KIL", "FIX"]);
  });

  it("shows a warrior none", () => {
    expect(spells("guerreiro")).toEqual([]);
  });
});

describe("testing your Luck", () => {
  it("is lucky when two dice total at most the current SORTE", () => {
    expect(luckTest(hero(), 4, 4).lucky).toBe(true);
    expect(luckTest(hero(), 1, 1).lucky).toBe(true);
    expect(luckTest(hero(), 4, 5).lucky).toBe(false);
  });

  it("costs 1 SORTE whatever the result, never below 0", () => {
    expect(luckTest(hero(), 1, 1).state.current.luck).toBe(7);
    expect(luckTest(hero(), 6, 6).state.current.luck).toBe(7);
    expect(luckTest(hero({ luck: 0 }), 6, 6).state.current.luck).toBe(0);
  });

  it("compares with the SORTE left after earlier tests", () => {
    const once = luckTest(hero(), 1, 1).state;
    expect(luckTest(once, 4, 4).lucky).toBe(false);
  });
});

describe("luck in combat", () => {
  it("makes a wound dealt 4 when lucky and 1 when unlucky", () => {
    expect(playerDamage(fight) + luckyDamage(fight, true)).toBe(4);
    expect(playerDamage(fight) + luckyDamage(fight, false)).toBe(1);
  });

  it("makes a wound taken 1 when lucky and 3 when unlucky", () => {
    expect(2 - luckyWound(true)).toBe(1);
    expect(2 - luckyWound(false)).toBe(3);
  });
});

describe("attributes", () => {
  const gain = (stat: "skill" | "stamina" | "luck", amount: number) => ({ stat, amount, auto: true, text: "" });

  it("never go above their Initial value", () => {
    const s = hero({ skill: 8, stamina: 18, luck: 7 });
    expect(applyEffect(s, gain("skill", 3)).current.skill).toBe(9);
    expect(applyEffect(s, gain("stamina", 5)).current.stamina).toBe(20);
    expect(applyEffect(s, gain("luck", 2)).current.luck).toBe(8);
    expect(eatMeal({ ...s, paragraph: 35 }, getParagraph(35).meal!).current.stamina).toBe(20);
    expect(libraRevive(s).current).toEqual(s.initial);
  });

  it("never go below 0", () => {
    expect(applyEffect(hero({ skill: 2 }), gain("skill", -5)).current.skill).toBe(0);
  });
});

describe("Libra", () => {
  it("helps only once", () => {
    const revived = libraRevive(hero({ stamina: 3 }));
    expect(revived.libraUsed).toBe(true);
    const hurt = { ...revived, current: { ...revived.current, stamina: 2 } };
    expect(libraRevive(hurt)).toBe(hurt);
    expect(libraCleanse({ ...hurt, conditions: [{ name: "Praga", kind: "curse" }] }).conditions).toHaveLength(1);
  });

  it("is used up by following a Libra choice of the text", () => {
    const to = [...LIBRA_TARGETS][0]!;
    const s = goto(hero(), to);
    expect(s.libraUsed).toBe(true);
    expect(libraRevive({ ...s, current: { ...s.current, stamina: 1 } }).current.stamina).toBe(1);
  });
});

describe("old saves", () => {
  // A `grimorio-save-v2` written before Specs 03–05: items as text, curses instead of conditions, no spells, no meals.
  const OLD = JSON.parse(`{
    "cls": "guerreiro", "initial": { "skill": 10, "stamina": 19, "luck": 9 }, "current": { "skill": 10, "stamina": 12, "luck": 7 },
    "provisions": 1, "gold": 14, "items": ["Espada", "Mochila", "Chave de prata"], "curses": ["Praga"], "notes": "",
    "libraUsed": false, "paragraph": 161, "log": ["A jornada começa"], "history": [1, 178, 161]
  }`);

  it("load without error and keep playing", () => {
    const s = normalizeSave(OLD);
    expect(s.conditions).toEqual([{ name: "Praga", kind: "curse" }]);
    expect(s.spells).toEqual([]);
    expect(getParagraph(s.paragraph).id).toBe(161);
    const next = goto(luckTest(s, 3, 3).state, 45);
    expect([next.paragraph, next.current.luck]).toEqual([45, 6]);
    expect(libraCleanse(next).conditions).toEqual([]);
  });
});
