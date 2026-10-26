import { useCallback, useEffect, useState } from "react";
import {
  DEATH_ID, ITEM_KINDS, LIBRA_TARGETS, STAT_LABEL, WIN_ID, getParagraph, hasParagraph,
  type BookChoice, type BookEffect, type Cost, type Meal, type NumberedItem, type NumberedItemUse,
} from "./book";

/** Um item do equipamento. Saves feitos antes dos itens numerados guardam texto simples, então os dois formatos continuam válidos. */
export type Item = string | NumberedItem;
/** Valores dos três atributos: HABILIDADE, ENERGIA e SORTE. */
export type Stats = { skill: number; stamina: number; luck: number };
/**
 * Bônus, penalidades, maldições e doenças anotados na ficha.
 * - `name`: descrição livre. `kind`: tipo da anotação.
 * - `attack`: valor somado à Força de Ataque em combate (pode ser negativo).
 */
export type Condition = { name: string; kind: "curse" | "disease" | "bonus" | "penalty"; attack?: number };
/**
 * Todo o estado de uma partida (é o que fica salvo no navegador).
 * - `cls`: classe do personagem.
 * - `initial` / `current`: atributos iniciais (limite máximo) e atuais.
 * - `provisions`: refeições na mochila. `gold`: Peças de Ouro.
 * - `items`: equipamento. `conditions`: bônus, penalidades, maldições e doenças.
 * - `notes`: anotações livres do leitor (pistas, senhas…).
 * - `spells`: magias marcadas como referência na criação (só para consulta, nunca bloqueiam opções).
 * - `libraUsed`: se a Deusa Libra já foi invocada (ela ajuda só uma vez).
 * - `paragraph`: parágrafo atual. `log`: diário da jornada (mais recente primeiro).
 * - `history`: todos os parágrafos visitados, em ordem.
 */
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
  /** `history.length` no momento da última refeição: uma refeição por visita a um parágrafo que permite comer. */
  ateAt?: number;
};

/** Formato dos saves feitos antes da ficha editável, que tinham `curses` em vez de `conditions`. */
type Saved = Omit<GameState, "conditions"> & { conditions?: Condition[]; curses?: string[] };

/** Chave usada para salvar a partida no `localStorage`. */
const KEY = "grimorio-save-v2";
/** Rola um dado de seis faces. */
export const d6 = () => Math.floor(Math.random() * 6) + 1;
/** Rola dois dados de seis faces. */
export const roll2 = () => [d6(), d6()] as const;

/** Texto de exibição de um item (itens numerados mostram o número). */
export const itemLabel = (i: Item) => (typeof i === "string" ? i : `${i.name} (nº ${i.number})`);
/** Se o item `a` é o mesmo item numerado `b` (mesmo tipo e mesmo número). */
const sameItem = (a: Item, b: NumberedItem) => typeof a !== "string" && a.kind === b.kind && a.number === b.number;
/** Se o leitor já tem o item numerado na ficha. */
export const hasItem = (s: GameState, item: NumberedItem) => s.items.some((i) => sameItem(i, item));
/** Itens numerados da ficha de um determinado tipo (ex.: todas as chaves). */
export const numberedItems = (s: GameState, kind: string) =>
  s.items.filter((i): i is NumberedItem => typeof i !== "string" && i.kind === kind);

/** Guarda um item numerado na ficha (sem duplicar se ele já estiver lá). */
export function gainItem(s: GameState, item: NumberedItem): GameState {
  return hasItem(s, item) ? s : addLog({ ...s, items: [...s.items, item] }, `Guardou: ${itemLabel(item)}`);
}

/** Vai para o número do item + deslocamento; devolve null quando essa referência não existe no livro. */
export function applyNumberedItem(s: GameState, item: NumberedItem, use: NumberedItemUse): GameState | null {
  const to = item.number + use.offset;
  if (!hasParagraph(to)) return null;
  return goto(addLog(s, `Usou: ${itemLabel(item)}`), to);
}

/** Acrescenta uma mensagem no topo do diário, mantendo só as 80 mais recentes. */
function addLog(s: GameState, msg: string): GameState {
  return { ...s, log: [msg, ...s.log].slice(0, 80) };
}

/** Aplica um efeito do texto a um atributo; ganhos nunca passam do valor inicial e o atributo nunca fica abaixo de zero. */
export function applyEffect(s: GameState, e: BookEffect): GameState {
  const c = { ...s.current };
  const cap = e.amount > 0 ? s.initial[e.stat] : Infinity;
  c[e.stat] = Math.max(0, Math.min(cap, c[e.stat] + e.amount));
  return addLog({ ...s, current: c }, `${e.amount > 0 ? "+" : ""}${e.amount} ${STAT_LABEL[e.stat]}`);
}

/** Se a ENERGIA chegou a zero, leva o leitor ao parágrafo de morte. */
function checkDeath(s: GameState): GameState {
  if (s.current.stamina <= 0 && s.paragraph !== DEATH_ID) {
    return addLog({ ...s, current: { ...s.current, stamina: 0 }, paragraph: DEATH_ID, history: [...s.history, DEATH_ID] }, "Sucumbiu aos ferimentos");
  }
  return s;
}

/**
 * Leva o leitor a um parágrafo: registra no histórico, consome Libra se o destino for dela,
 * aplica os efeitos automáticos e, no parágrafo de vitória, aplica as recompensas finais.
 * @param opts.skipEffects não aplica os efeitos automáticos (usado ao voltar a um parágrafo já visitado).
 */
export function goto(s: GameState, to: number, opts: { skipEffects?: boolean } = {}): GameState {
  const p = getParagraph(to);
  let n: GameState = addLog({ ...s, paragraph: to, history: [...s.history, to] }, `Seguiu para ${to}`);
  if (LIBRA_TARGETS.has(to) && !n.libraUsed) n = addLog({ ...n, libraUsed: true }, "Invocou a Deusa Libra");
  if (!opts.skipEffects) for (const e of p.effects) if (e.auto) n = applyEffect(n, e);
  if (to === WIN_ID) {
    // Recompensas da vitória: +1 SORTE inicial, atributos restaurados, maldições removidas, 10 PO e a Chave de Kharé.
    const initial = { ...n.initial, luck: n.initial.luck + 1 };
    n = addLog({ ...n, initial, current: { ...initial }, conditions: n.conditions.filter((c) => c.kind !== "curse"), gold: n.gold + 10, items: [...n.items, "Chave de Kharé"] }, "Maldição quebrada em Torrepani!");
  }
  return checkDeath(n);
}

/** Parágrafo para onde voltar quando o texto diz "volte à referência original". */
export function previousParagraph(s: GameState): number | null {
  const h = s.history;
  // Percorre o histórico de trás para frente até achar um parágrafo diferente do atual.
  for (let i = h.length - 2; i >= 0; i--) if (h[i] !== s.paragraph) return h[i]!;
  return null;
}

/** Cria o estado inicial de um novo personagem, com o equipamento e os recursos iniciais do livro. */
export function createCharacter(cls: GameState["cls"], stats: Stats, spells: string[]): GameState {
  return {
    cls, initial: stats, current: { ...stats }, provisions: 2, gold: 20,
    items: ["Espada", "Mochila"],
    conditions: [], notes: "", spells, libraUsed: false, paragraph: 1, log: ["A jornada começa"], history: [1],
  };
}

/** Converte um save antigo para o formato atual (garante `spells` e troca `curses` por `conditions`). */
export function normalizeSave(saved: Saved): GameState {
  const { curses, ...rest } = saved;
  return {
    ...rest,
    spells: Array.isArray(saved.spells) ? saved.spells : [],
    conditions: Array.isArray(saved.conditions) ? saved.conditions : (curses ?? []).map((name) => ({ name, kind: "curse" })),
  };
}

/** Se o leitor pode comer agora: o parágrafo permite, há Provisões e ele ainda não comeu nesta visita. */
export const canEat = (s: GameState, meal: Meal | undefined): meal is Meal =>
  !!meal && s.provisions > 0 && s.ateAt !== s.history.length;

/**
 * Consome uma Provisão e recupera ENERGIA (sem passar do valor inicial).
 * @param alreadyAte se o leitor já comeu hoje (usa o valor `alreadyAte` da refeição, quando houver).
 */
export function eatMeal(s: GameState, meal: Meal, alreadyAte = false): GameState {
  if (!canEat(s, meal)) return s;
  const gain = alreadyAte ? meal.alreadyAte ?? meal.stamina : meal.stamina;
  return addLog({
    ...s, provisions: s.provisions - 1, ateAt: s.history.length,
    current: { ...s.current, stamina: Math.min(s.initial.stamina, s.current.stamina + gain) },
  }, `Consumiu uma refeição (+${gain} Energia)`);
}

/** Paga um preço do texto, se houver ouro suficiente. */
export function pay(s: GameState, cost: Cost): GameState {
  if (s.gold < cost.gold) return s;
  return addLog({ ...s, gold: s.gold - cost.gold }, `Pagou ${cost.gold} PO: ${cost.label}`);
}

/** Ajuste manual do ouro na ficha (nunca fica negativo). */
export function adjustGold(s: GameState, delta: number): GameState {
  const gold = Math.max(0, s.gold + delta);
  return gold === s.gold ? s : addLog({ ...s, gold }, `${delta > 0 ? "+" : ""}${gold - s.gold} Peças de Ouro`);
}

/** Ajuste manual das Provisões na ficha (nunca ficam negativas). */
export function adjustProvisions(s: GameState, delta: number): GameState {
  const provisions = Math.max(0, s.provisions + delta);
  return provisions === s.provisions ? s : addLog({ ...s, provisions }, `${delta > 0 ? "+" : ""}${provisions - s.provisions} Provisões`);
}

/** Adiciona um item à ficha. Um número digitado o torna um item numerado; o tipo é o tipo do livro com que o nome começa (ex.: "Chave de prata" → chave). */
export function addItem(s: GameState, name: string, number?: number): GameState {
  const n = name.trim();
  if (!n) return s;
  if (number === undefined) return addLog({ ...s, items: [...s.items, n] }, `Guardou: ${n}`);
  const lower = n.toLocaleLowerCase("pt-BR");
  // Se o nome não começa com um tipo conhecido, usa a primeira palavra como tipo.
  const kind = ITEM_KINDS.find((k) => lower.startsWith(k)) ?? lower.split(/\s+/)[0]!;
  return gainItem(s, { name: n, kind, number });
}

/** Remove da ficha o item na posição `index`. */
export function removeItem(s: GameState, index: number): GameState {
  const item = s.items[index];
  if (item === undefined) return s;
  return addLog({ ...s, items: s.items.filter((_, i) => i !== index) }, `Perdeu: ${itemLabel(item)}`);
}

/** Nome em português de cada tipo de anotação. */
export const CONDITION_LABEL: Record<Condition["kind"], string> = { curse: "Maldição", disease: "Doença", bonus: "Bônus", penalty: "Penalidade" };
/** Texto de exibição de uma anotação, com o modificador de Força de Ataque quando houver. */
export const conditionLabel = (c: Condition) =>
  `${CONDITION_LABEL[c.kind]}: ${c.name}${c.attack ? ` (${c.attack > 0 ? "+" : ""}${c.attack} Força de Ataque)` : ""}`;
/** O que Libra pode remover: maldições e doenças. */
export const afflictions = (s: GameState) => s.conditions.filter((c) => c.kind === "curse" || c.kind === "disease");
/** Soma de todos os modificadores de Força de Ataque anotados na ficha. */
export const attackModifier = (s: GameState) => s.conditions.reduce((sum, c) => sum + (c.attack ?? 0), 0);

/** Anota um bônus, penalidade, maldição ou doença na ficha. */
export function addCondition(s: GameState, c: Condition): GameState {
  const name = c.name.trim();
  if (!name) return s;
  // Só guarda `attack` quando ele é diferente de zero.
  const cond: Condition = c.attack ? { ...c, name } : { name, kind: c.kind };
  return addLog({ ...s, conditions: [...s.conditions, cond] }, `Anotou: ${conditionLabel(cond)}`);
}

/** Remove a anotação na posição `index`. */
export function removeCondition(s: GameState, index: number): GameState {
  const c = s.conditions[index];
  if (!c) return s;
  return addLog({ ...s, conditions: s.conditions.filter((_, i) => i !== index) }, `Removeu: ${c.name}`);
}

/** Milagre da Revitalização: restaura os atributos aos valores iniciais. Libra ajuda só uma vez por aventura: depois de usada, chamá-la não muda nada. */
export function libraRevive(s: GameState): GameState {
  if (s.libraUsed) return s;
  return addLog({ ...s, libraUsed: true, current: { ...s.initial } }, "Invocou a Deusa Libra (Revitalização)");
}

/** Milagre da Remoção: tira todas as maldições e doenças da ficha (também consome o uso único de Libra). */
export function libraCleanse(s: GameState): GameState {
  if (s.libraUsed) return s;
  const conditions = s.conditions.filter((c) => c.kind !== "curse" && c.kind !== "disease");
  return addLog({ ...s, libraUsed: true, conditions }, "Invocou a Deusa Libra (Remoção de maldições e doenças)");
}

/** Testar a Sorte: dois dados com total até a SORTE atual dão sorte, e todo teste custa 1 de SORTE. */
export function luckTest(s: GameState, a: number, b: number): { state: GameState; lucky: boolean } {
  const lucky = a + b <= s.current.luck;
  const state = addLog({ ...s, current: { ...s.current, luck: Math.max(0, s.current.luck - 1) } },
    `Testou a Sorte: ${a}+${b} — ${lucky ? "Sortudo!" : "Azarado"}`);
  return { state, lucky };
}

/**
 * Hook React que guarda a partida, salva/carrega do `localStorage` e expõe as ações de jogo.
 * Retorna:
 * - `state`: a partida atual (null quando não há personagem). `setState`: troca a partida inteira.
 * - `update`: aplica uma transformação ao estado e verifica a morte em seguida.
 * - `loaded`: se o save já foi lido do navegador.
 * - `choose`, `goBack`, `eat`, `testLuck`, `log`: ações usadas pela interface.
 */
export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Ao montar, carrega o save do navegador (se houver).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setState(normalizeSave(JSON.parse(raw) as Saved));
      }
    } catch { /* ignora saves corrompidos ou armazenamento indisponível */ }
    setLoaded(true);
  }, []);

  // A cada mudança, salva a partida (ou apaga o save quando não há personagem).
  useEffect(() => {
    if (!loaded) return;
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
    else localStorage.removeItem(KEY);
  }, [state, loaded]);

  /** Aplica `fn` ao estado atual e verifica se o leitor morreu. */
  const update = useCallback((fn: (s: GameState) => GameState) => {
    setState((s) => (s ? checkDeath(fn(s)) : s));
  }, []);

  /** Segue uma escolha do parágrafo; escolhas que começam com "volte"/"retorne" não reaplicam os efeitos do destino. */
  const choose = (c: BookChoice) =>
    update((s) => {
      let n = s;
      if (c.spell) n = addLog(n, `Lançou ${c.spell}`);
      const returning = /^(volte|retorne)/i.test(c.label);
      return goto(n, c.to, { skipEffects: returning });
    });

  /** Volta à referência anterior, sem reaplicar os efeitos dela. */
  const goBack = () =>
    update((s) => {
      const prev = previousParagraph(s);
      return prev === null ? s : goto(s, prev, { skipEffects: true });
    });

  /** Come uma refeição no parágrafo atual, se o texto permitir. */
  const eat = (alreadyAte = false) =>
    update((s) => { const meal = getParagraph(s.paragraph).meal; return meal ? eatMeal(s, meal, alreadyAte) : s; });

  /** Rola os dados de um teste de sorte, aplica-o ao estado e devolve os dados e o resultado para a tela mostrar. */
  const testLuck = (): { a: number; b: number; lucky: boolean } => {
    const [a, b] = roll2();
    const lucky = !!state && luckTest(state, a, b).lucky;
    update((s) => luckTest(s, a, b).state);
    return { a, b, lucky };
  };

  return { state, setState, update, loaded, choose, goBack, eat, testLuck, log: (m: string) => update((s) => addLog(s, m)) };
}

/** Tipo do objeto devolvido por `useGame`, repassado aos componentes. */
export type Game = ReturnType<typeof useGame>;
