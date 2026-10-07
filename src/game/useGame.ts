import { useCallback, useEffect, useState } from "react";
import { SPELLS } from "./adventure";
import { DEATH_ID, LIBRA_TARGETS, STAT_LABEL, WIN_ID, getParagraph, type BookChoice, type BookEffect } from "./book";

export type Stats = { skill: number; stamina: number; luck: number };
export type GameState = {
  cls: "guerreiro" | "mago";
  initial: Stats;
  current: Stats;
  provisions: number;
  gold: number;
  items: string[];
  curses: string[];
  notes: string;
  spells: string[];
  libraUsed: boolean;
  paragraph: number;
  log: string[];
  history: number[];
};

const KEY = "grimorio-save-v2";
const LEGACY_SPELLS: Record<string, string> = {
  IGNIS: "HOT", LUMEN: "SUN", SOMNUS: "NAP", CLAVIS: "DOP",
  VENTUS: "HUF", SANAR: "DOC", ESCUDO: "FOF", VOX: "YAP",
};
export const d6 = () => Math.floor(Math.random() * 6) + 1;
export const roll2 = () => [d6(), d6()] as const;

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
    n = addLog({ ...n, initial, current: { ...initial }, curses: [], gold: n.gold + 10, items: [...n.items, "Chave de Kharé"] }, "Maldição quebrada em Torrepani!");
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
    items: cls === "guerreiro" ? ["Espada", "Mochila"] : ["Cajado", "Mochila", "Grimório"],
    curses: [], notes: "", spells, libraUsed: false, paragraph: 1, log: ["A jornada começa"], history: [1],
  };
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as GameState;
        const spells = saved.spells
          .map((code) => LEGACY_SPELLS[code] ?? code)
          .filter((code, index, list) => SPELLS.some((spell) => spell.code === code) && list.indexOf(code) === index);
        setState({ ...saved, spells });
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

  const eat = () =>
    update((s) => s.provisions <= 0 ? s : addLog({
      ...s, provisions: s.provisions - 1,
      current: { ...s.current, stamina: Math.min(s.initial.stamina, s.current.stamina + 4) },
    }, "Consumiu uma refeição (+4 Energia)"));

  const testLuck = (): { a: number; b: number; lucky: boolean } => {
    const [a, b] = roll2();
    const lucky = !!state && a + b <= state.current.luck;
    update((s) => addLog({ ...s, current: { ...s.current, luck: Math.max(0, s.current.luck - 1) } },
      `Testou a Sorte: ${a}+${b} — ${lucky ? "Sortudo!" : "Azarado"}`));
    return { a, b, lucky };
  };

  return { state, setState, update, loaded, choose, goBack, eat, testLuck, log: (m: string) => update((s) => addLog(s, m)) };
}

export type Game = ReturnType<typeof useGame>;
