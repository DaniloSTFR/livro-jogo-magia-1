import data from "./book.json";

export type StatKey = "stamina" | "skill" | "luck";
/** `repeatable`: a conditional effect the text may apply several times (e.g. each failed luck test). */
export type BookEffect = { stat: StatKey; amount: number; auto: boolean; text: string; repeatable?: boolean };
/**
 * `libraUsedOnly`: shown only after Libra was invoked (the text's outcome when her help is no longer available).
 * `diceDeath`: a death the text deals on a dice result the reader rolls (e.g. a double six).
 */
export type BookChoice = { to: number; label: string; spell?: string; libra?: boolean; libraUsedOnly?: boolean; diceDeath?: boolean };
/** An object with a number stamped on it; some paragraphs send the reader to a reference computed from it. */
export type NumberedItem = { name: string; kind: string; number: number };
/** `numberedItem`: the paragraph lets the reader use an item of `kind`, going to its number + `offset`. */
export type NumberedItemUse = { kind: string; offset: number; label: string };
export type Enemy = { name: string; skill: number; stamina: number };
/** A creature fighting for the reader; `choose`: the reader picks how many (e.g. one per tooth), paying `cost` ENERGIA each. */
export type Ally = Enemy & { choose?: { cost: number } };
/**
 * A fight as the text describes it. Defaults follow the rules: the reader fights each enemy in turn and wounds deal 2.
 * - `mode: "ally"`: the reader watches `ally` fight; `allyLost: "self"` makes the reader finish the fight, otherwise
 *   the paragraph's own choices say what comes next.
 * - `together`: every enemy attacks each round; the reader only wounds the one they target.
 * - `rules`: the text's special rule, shown in the combat window.
 * - `damage`: what each of the reader's wounds deals (4 with a magically sharpened sword).
 * - `playerRoll` / `enemyRoll`: added to the dice roll for Attack Strength. `doubleSkill`: the reader's SKILL counts twice.
 * - `weakened`: the enemy fights with `skill` for the first `rounds` Attack Rounds; with `recover: "even"` a die is rolled
 *   before each later round and only an even result restores its SKILL.
 * - `sting`: each time the enemy wounds, a die of 5–6 deals `damage` instead (or kills an ally with `kill`); with
 *   `luckSaves` a successful luck test turns it back into a normal wound.
 * - `flee`: before the fight two dice are rolled per enemy; a result of at least its SKILL makes it run; if all run, go to `to`.
 * - `escape`: the way out the text offers during the fight, optionally only when the enemy's ENERGIA is at most
 *   `enemyAtMost` and the reader's at least `playerAtLeast`; `penalty` is the ENERGIA it costs.
 */
export type Combat = {
  enemies: Enemy[];
  win: number;
  mode?: "ally";
  ally?: Ally;
  allyLost?: "self";
  together?: boolean;
  rules?: string;
  damage?: number;
  playerRoll?: number;
  enemyRoll?: number;
  doubleSkill?: boolean;
  weakened?: { skill: number; rounds: number; recover?: "even" };
  sting?: { damage: number; kill?: boolean; luckSaves?: boolean };
  flee?: { to: number };
  escape?: { to: number; label: string; penalty?: number; enemyAtMost?: number; playerAtLeast?: number };
};
/** A weapon the text gives an Attack Strength modifier, recognized by the item's name (e.g. Glandragor's axe, −1). */
export type Weapon = { match: string[]; attack: number; paragraph: number };
/** The text lets the reader eat Provisions here: `stamina` for the first meal of the day, `alreadyAte` if they already ate. */
export type Meal = { stamina: number; alreadyAte?: number };
/** A fixed price the text quotes in this paragraph. */
export type Cost = { gold: number; label: string };
export type BookParagraph = {
  id: number;
  text: string;
  choices: BookChoice[];
  effects: BookEffect[];
  combat?: Combat;
  luckTest?: { lucky: number; unlucky: number };
  gainItems?: NumberedItem[];
  numberedItem?: NumberedItemUse;
  meal?: Meal;
  costs?: Cost[];
  luckFree?: boolean;
  back?: boolean;
  end?: "win" | "death";
};
export type Monster = Enemy & { paragraphs: number[] };

export const DEATH_ID = 0;
export const WIN_ID = 456;

const DEATH: BookParagraph = {
  id: DEATH_ID,
  text: "Sua aventura termina aqui. Os perigos das Montanhas de Shamutanti foram demais para você, e sua visão escurece nas encostas.",
  choices: [],
  effects: [],
  end: "death",
};

const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
export const MONSTERS = (data as unknown as { monsters: Monster[] }).monsters;
export const WEAPONS = (data as unknown as { weapons: Weapon[] }).weapons;

/** Every paragraph a fight can lead to, besides the paragraph's own choices. */
export const combatExits = (c: Combat) => [c.win, ...(c.flee ? [c.flee.to] : []), ...(c.escape ? [c.escape.to] : [])];

/** Kinds of numbered items the book hands out or asks for (e.g. "chave"). */
export const ITEM_KINDS = [...new Set(Object.values(BOOK).flatMap((p) => [
  ...(p.gainItems ?? []).map((i) => i.kind),
  ...(p.numberedItem ? [p.numberedItem.kind] : []),
]))];

/** Paragraphs reached by invoking Libra — entering one consumes the single use. */
export const LIBRA_TARGETS = new Set<number>(
  Object.values(BOOK).flatMap((p) => p.choices.filter((c) => c.libra).map((c) => c.to)),
);

export function hasParagraph(id: number): boolean {
  return BOOK[String(id)] !== undefined;
}

export function getParagraph(id: number): BookParagraph {
  if (id === DEATH_ID) return DEATH;
  return BOOK[String(id)] ?? BOOK["1"]!;
}

export const STAT_LABEL: Record<StatKey, string> = { stamina: "ENERGIA", skill: "HABILIDADE", luck: "SORTE" };
