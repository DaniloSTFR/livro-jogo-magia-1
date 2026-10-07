import data from "./book.json";

export type StatKey = "stamina" | "skill" | "luck";
export type BookEffect = { stat: StatKey; amount: number; auto: boolean; text: string };
export type BookChoice = { to: number; label: string; spell?: string; libra?: boolean };
export type Enemy = { name: string; skill: number; stamina: number };
export type BookParagraph = {
  id: number;
  text: string;
  choices: BookChoice[];
  effects: BookEffect[];
  combat?: { enemies: Enemy[]; win: number };
  luckTest?: { lucky: number; unlucky: number };
  luckFree?: boolean;
  back?: boolean;
  end?: "win" | "death";
};
export type Monster = Enemy & { paragraphs: number[] };

export const DEATH_ID = 0;
export const WIN_ID = 456;

const DEATH: BookParagraph = {
  id: DEATH_ID,
  text: "Sua ENERGIA chegou a zero. Os ferimentos são graves demais e sua visão escurece nas encostas de Shamutanti. Sua aventura termina aqui.",
  choices: [],
  effects: [],
  end: "death",
};

const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
export const MONSTERS = (data as unknown as { monsters: Monster[] }).monsters;

/** Paragraphs reached by invoking Libra — entering one consumes the single use. */
export const LIBRA_TARGETS = new Set<number>(
  Object.values(BOOK).flatMap((p) => p.choices.filter((c) => c.libra).map((c) => c.to)),
);

export function getParagraph(id: number): BookParagraph {
  if (id === DEATH_ID) return DEATH;
  return BOOK[String(id)] ?? BOOK["1"]!;
}

export const STAT_LABEL: Record<StatKey, string> = { stamina: "ENERGIA", skill: "HABILIDADE", luck: "SORTE" };
