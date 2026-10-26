import { WEAPONS, type Combat, type Enemy } from "./book";
import { itemLabel, type GameState } from "./useGame";

export type Dice = readonly [number, number];
export type Fighter = Enemy;
/** One Attack Round between a side (the reader or an ally) and one enemy. `stung`: the enemy's wound was a sting. */
export type Exchange = { side: Dice; enemy: Dice; sideStrength: number; enemyStrength: number; result: "hit" | "hurt" | "tie"; stingDie?: number; stung?: boolean };

const BASE_DAMAGE = 2;

/** The enemy's SKILL this round (1-based), counting a spell that weakens it for a few rounds. */
export function enemySkill(c: Combat, base: number, round: number, recovered: boolean): number {
  const w = c.weakened;
  if (!w) return base;
  if (round <= w.rounds) return w.skill;
  return w.recover === "even" && !recovered ? w.skill : base;
}

/** The reader's SKILL in this fight (BIG doubles it). */
export const playerSkill = (c: Combat, skill: number) => (c.doubleSkill ? skill * 2 : skill);

/** Damage of one of the reader's wounds, before luck. */
export const playerDamage = (c: Combat) => c.damage ?? BASE_DAMAGE;

/** Luck after a wound the reader dealt: lucky doubles it, unlucky halves it (2 → 4 or 1, as in the rules). */
export const luckyDamage = (c: Combat, lucky: boolean) => (lucky ? playerDamage(c) : -playerDamage(c) / 2);

/**
 * Resolves one Attack Round. `sideMod` is everything added to the side's roll (sheet, weapon, the text's rule);
 * `ally` fights skip the reader's modifiers. A sting die is rolled only when the enemy wounds and the fight has a sting.
 */
export function exchange(c: Combat, sideSkill: number, sideMod: number, enemySkillNow: number, roll: () => number): Exchange {
  const side = [roll(), roll()] as const;
  const enemy = [roll(), roll()] as const;
  const sideStrength = side[0] + side[1] + sideSkill + sideMod;
  const enemyStrength = enemy[0] + enemy[1] + enemySkillNow + (c.enemyRoll ?? 0);
  const result = sideStrength > enemyStrength ? "hit" : enemyStrength > sideStrength ? "hurt" : "tie";
  const ex: Exchange = { side, enemy, sideStrength, enemyStrength, result };
  if (result === "hurt" && c.sting) {
    const stingDie = roll();
    return { ...ex, stingDie, stung: stingDie >= 5 };
  }
  return ex;
}

/** What an enemy's wound takes from `target`'s ENERGIA; a sting `kill` takes it all. */
export function woundTaken(c: Combat, ex: Exchange, targetStamina: number, luckSaved = false): number {
  if (ex.result !== "hurt") return 0;
  if (!ex.stung || luckSaved) return BASE_DAMAGE;
  return c.sting!.kill ? targetStamina : c.sting!.damage;
}

/** Rolls two dice per enemy before the fight; those with a result of at least their SKILL run away. */
export function rollFlee(enemies: Fighter[], roll: () => number) {
  return enemies.map((e) => {
    const dice = [roll(), roll()] as const;
    return { enemy: e, dice, fled: dice[0] + dice[1] >= e.skill };
  });
}

/** Whether the text's escape is open now. */
export function canEscape(c: Combat, enemyStamina: number, stamina: number): boolean {
  const e = c.escape;
  if (!e) return false;
  return enemyStamina <= (e.enemyAtMost ?? Infinity) && stamina >= (e.playerAtLeast ?? -Infinity);
}

/** The reader's allies: one, or as many as they chose to create (numbered when more than one). */
export function makeAllies(c: Combat, count = 1): Fighter[] {
  const a = c.ally;
  if (!a) return [];
  const n = a.choose ? count : 1;
  return Array.from({ length: n }, (_, i) => ({ name: n > 1 ? `${a.name} ${i + 1}` : a.name, skill: a.skill, stamina: a.stamina }));
}

/** Weapons on the sheet with a modifier from the text (e.g. Glandragor's axe, −1), plus the common sword. */
export function weaponOptions(s: GameState): { label: string; attack: number }[] {
  const options = [{ label: "Espada comum", attack: 0 }];
  for (const item of s.items) {
    const name = (typeof item === "string" ? item : item.name).toLocaleLowerCase("pt-BR");
    const w = WEAPONS.find((w) => w.match.some((m) => name.includes(m)));
    if (w) options.push({ label: itemLabel(item), attack: w.attack });
  }
  return options;
}
