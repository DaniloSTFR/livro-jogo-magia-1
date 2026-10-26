import { useCallback, useEffect, useState } from "react";
import {
  DEATH_ID, ITEM_KINDS, LIBRA_TARGETS, STAT_LABEL, WIN_ID, getParagraph, hasParagraph,
  type BookChoice, type BookEffect, type Cost, type Meal, type NumberedItem, type NumberedItemUse,
} from "./book";

/** Saves made before numbered items keep plain strings, so both shapes stay valid. */
export type Item = string | NumberedItem;
export type Stats = { skill: number; stamina: number; luck: number };
/** Bonuses, penalties, curses and diseases on the sheet; `attack` adds to the Attack Strength in combat. */
export type Condition = { name: string; kind: "curse" | "disease" | "bonus" | "penalty"; attack?: number };
export type GameState = {
  cls: "guerreiro" | "mago";
  initial: Stats;
  current: Stats;
  provisions: number;
  gold: number;
  items: Item[];
  conditions: Condition[];
  notes: string;
  spells: string[];
  libraUsed: boolean;
  paragraph: number;
  log: string[];
  history: number[];
  /** `history.length` when the last meal was eaten: one meal per visit to a paragraph that allows it. */
  ateAt?: number;
};

/** Saves made before the editable sheet had `curses` instead of `conditions`. */
type Saved = Omit<GameState, "conditions"> & { conditions?: Condition[]; curses?: string[] };

const KEY = "grimorio-save-v2";
export const d6 = () => Math.floor(Math.random() * 6) + 1;
export const roll2 = () => [d6(), d6()] as const;

export const itemLabel = (i: Item) => (typeof i === "string" ? i : `${i.name} (nº ${i.number})`);
const sameItem = (a: Item, b: NumberedItem) => typeof a !== "string" && a.kind === b.kind && a.number === b.number;
export const hasItem = (s: GameState, item: NumberedItem) => s.items.some((i) => sameItem(i, item));
export const numberedItems = (s: GameState, kind: string) =>
  s.items.filter((i): i is NumberedItem => typeof i !== "string" && i.kind === kind);

export function gainItem(s: GameState, item: NumberedItem): GameState {
  return hasItem(s, item) ? s : addLog({ ...s, items: [...s.items, item] }, `Guardou: ${itemLabel(item)}`);
}

/** Goes to the item's number + offset; returns null when that reference does not exist in the book. */
export function applyNumberedItem(s: GameState, item: NumberedItem, use: NumberedItemUse): GameState | null {
  const to = item.number + use.offset;
  if (!hasParagraph(to)) return null;
  return goto(addLog(s, `Usou: ${itemLabel(item)}`), to);
}

function addLog(s: GameState, msg: string): GameState {
  return { ...s, log: [msg, ...s.log].slice(0, 80) };
}

export function applyEffect(s: GameState, e: BookEffect): GameState {
  const c = { ...s.current };
  const cap = e.amount > 0 ? s.initial[e.stat] : Infinity;
  c[e.stat] = Math.max(0, Math.min(cap, c[e.stat] + e.amount));
  return addLog({ ...s, current: c }, `${e.amount > 0 ? "+" : ""}${e.amount} ${STAT_LABEL[e.stat]}`);
}

function checkDeath(s: GameState): GameState {
  if (s.current.stamina <= 0 && s.paragraph !== DEATH_ID) {
    return addLog({ ...s, current: { ...s.current, stamina: 0 }, paragraph: DEATH_ID, history: [...s.history, DEATH_ID] }, "Sucumbiu aos ferimentos");
  }
  return s;
}

export function goto(s: GameState, to: number, opts: { skipEffects?: boolean } = {}): GameState {
  const p = getParagraph(to);
  let n: GameState = addLog({ ...s, paragraph: to, history: [...s.history, to] }, `Seguiu para ${to}`);
  if (LIBRA_TARGETS.has(to) && !n.libraUsed) n = addLog({ ...n, libraUsed: true }, "Invocou a Deusa Libra");
  if (!opts.skipEffects) for (const e of p.effects) if (e.auto) n = applyEffect(n, e);
  if (to === WIN_ID) {
    const initial = { ...n.initial, luck: n.initial.luck + 1 };
    n = addLog({ ...n, initial, current: { ...initial }, conditions: n.conditions.filter((c) => c.kind !== "curse"), gold: n.gold + 10, items: [...n.items, "Chave de Kharé"] }, "Maldição quebrada em Torrepani!");
  }
  return checkDeath(n);
}

/** Paragraph to return to when the text says "volte à referência original". */
export function previousParagraph(s: GameState): number | null {
  const h = s.history;
  for (let i = h.length - 2; i >= 0; i--) if (h[i] !== s.paragraph) return h[i]!;
  return null;
}

export function createCharacter(cls: GameState["cls"], stats: Stats, spells: string[]): GameState {
  return {
    cls, initial: stats, current: { ...stats }, provisions: 2, gold: 20,
    items: ["Espada", "Mochila"],
    conditions: [], notes: "", spells, libraUsed: false, paragraph: 1, log: ["A jornada começa"], history: [1],
  };
}

export function normalizeSave(saved: Saved): GameState {
  const { curses, ...rest } = saved;
  return {
    ...rest,
    spells: Array.isArray(saved.spells) ? saved.spells : [],
    conditions: Array.isArray(saved.conditions) ? saved.conditions : (curses ?? []).map((name) => ({ name, kind: "curse" })),
  };
}

export const canEat = (s: GameState, meal: Meal | undefined): meal is Meal =>
  !!meal && s.provisions > 0 && s.ateAt !== s.history.length;

export function eatMeal(s: GameState, meal: Meal, alreadyAte = false): GameState {
  if (!canEat(s, meal)) return s;
  const gain = alreadyAte ? meal.alreadyAte ?? meal.stamina : meal.stamina;
  return addLog({
    ...s, provisions: s.provisions - 1, ateAt: s.history.length,
    current: { ...s.current, stamina: Math.min(s.initial.stamina, s.current.stamina + gain) },
  }, `Consumiu uma refeição (+${gain} Energia)`);
}

export function pay(s: GameState, cost: Cost): GameState {
  if (s.gold < cost.gold) return s;
  return addLog({ ...s, gold: s.gold - cost.gold }, `Pagou ${cost.gold} PO: ${cost.label}`);
}

export function adjustGold(s: GameState, delta: number): GameState {
  const gold = Math.max(0, s.gold + delta);
  return gold === s.gold ? s : addLog({ ...s, gold }, `${delta > 0 ? "+" : ""}${gold - s.gold} Peças de Ouro`);
}

export function adjustProvisions(s: GameState, delta: number): GameState {
  const provisions = Math.max(0, s.provisions + delta);
  return provisions === s.provisions ? s : addLog({ ...s, provisions }, `${delta > 0 ? "+" : ""}${provisions - s.provisions} Provisões`);
}

/** A typed number makes it a numbered item; its kind is the book's kind the name starts with (e.g. "Chave de prata" → chave). */
export function addItem(s: GameState, name: string, number?: number): GameState {
  const n = name.trim();
  if (!n) return s;
  if (number === undefined) return addLog({ ...s, items: [...s.items, n] }, `Guardou: ${n}`);
  const lower = n.toLocaleLowerCase("pt-BR");
  const kind = ITEM_KINDS.find((k) => lower.startsWith(k)) ?? lower.split(/\s+/)[0]!;
  return gainItem(s, { name: n, kind, number });
}

export function removeItem(s: GameState, index: number): GameState {
  const item = s.items[index];
  if (item === undefined) return s;
  return addLog({ ...s, items: s.items.filter((_, i) => i !== index) }, `Perdeu: ${itemLabel(item)}`);
}

export const CONDITION_LABEL: Record<Condition["kind"], string> = { curse: "Maldição", disease: "Doença", bonus: "Bônus", penalty: "Penalidade" };
export const conditionLabel = (c: Condition) =>
  `${CONDITION_LABEL[c.kind]}: ${c.name}${c.attack ? ` (${c.attack > 0 ? "+" : ""}${c.attack} Força de Ataque)` : ""}`;
/** What Libra can lift. */
export const afflictions = (s: GameState) => s.conditions.filter((c) => c.kind === "curse" || c.kind === "disease");
export const attackModifier = (s: GameState) => s.conditions.reduce((sum, c) => sum + (c.attack ?? 0), 0);

export function addCondition(s: GameState, c: Condition): GameState {
  const name = c.name.trim();
  if (!name) return s;
  const cond: Condition = c.attack ? { ...c, name } : { name, kind: c.kind };
  return addLog({ ...s, conditions: [...s.conditions, cond] }, `Anotou: ${conditionLabel(cond)}`);
}

export function removeCondition(s: GameState, index: number): GameState {
  const c = s.conditions[index];
  if (!c) return s;
  return addLog({ ...s, conditions: s.conditions.filter((_, i) => i !== index) }, `Removeu: ${c.name}`);
}

/** Libra helps only once per adventure: once used, calling her changes nothing. */
export function libraRevive(s: GameState): GameState {
  if (s.libraUsed) return s;
  return addLog({ ...s, libraUsed: true, current: { ...s.initial } }, "Invocou a Deusa Libra (Revitalização)");
}

export function libraCleanse(s: GameState): GameState {
  if (s.libraUsed) return s;
  const conditions = s.conditions.filter((c) => c.kind !== "curse" && c.kind !== "disease");
  return addLog({ ...s, libraUsed: true, conditions }, "Invocou a Deusa Libra (Remoção de maldições e doenças)");
}

/** Testing your Luck: two dice totalling at most the current SORTE are lucky, and every test costs 1 SORTE. */
export function luckTest(s: GameState, a: number, b: number): { state: GameState; lucky: boolean } {
  const lucky = a + b <= s.current.luck;
  const state = addLog({ ...s, current: { ...s.current, luck: Math.max(0, s.current.luck - 1) } },
    `Testou a Sorte: ${a}+${b} — ${lucky ? "Sortudo!" : "Azarado"}`);
  return { state, lucky };
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setState(normalizeSave(JSON.parse(raw) as Saved));
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
    else localStorage.removeItem(KEY);
  }, [state, loaded]);

  const update = useCallback((fn: (s: GameState) => GameState) => {
    setState((s) => (s ? checkDeath(fn(s)) : s));
  }, []);

  const choose = (c: BookChoice) =>
    update((s) => {
      let n = s;
      if (c.spell) n = addLog(n, `Lançou ${c.spell}`);
      const returning = /^(volte|retorne)/i.test(c.label);
      return goto(n, c.to, { skipEffects: returning });
    });

  const goBack = () =>
    update((s) => {
      const prev = previousParagraph(s);
      return prev === null ? s : goto(s, prev, { skipEffects: true });
    });

  const eat = (alreadyAte = false) =>
    update((s) => { const meal = getParagraph(s.paragraph).meal; return meal ? eatMeal(s, meal, alreadyAte) : s; });

  const testLuck = (): { a: number; b: number; lucky: boolean } => {
    const [a, b] = roll2();
    const lucky = !!state && luckTest(state, a, b).lucky;
    update((s) => luckTest(s, a, b).state);
    return { a, b, lucky };
  };

  return { state, setState, update, loaded, choose, goBack, eat, testLuck, log: (m: string) => update((s) => addLog(s, m)) };
}

export type Game = ReturnType<typeof useGame>;
