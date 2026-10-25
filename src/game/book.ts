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
/** The text lets the reader eat Provisions here: `stamina` for the first meal of the day, `alreadyAte` if they already ate. */
export type Meal = { stamina: number; alreadyAte?: number };
/** A fixed price the text quotes in this paragraph. */
export type Cost = { gold: number; label: string };
export type BookParagraph = {
  id: number;
  text: string;
  choices: BookChoice[];
  effects: BookEffect[];
  combat?: { enemies: Enemy[]; win: number };
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
