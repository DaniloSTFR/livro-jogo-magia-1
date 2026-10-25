import { describe, expect, it } from "vitest";
import { getParagraph } from "@/game/book";
import { applyNumberedItem, createCharacter, gainItem, itemLabel, numberedItems, type GameState } from "@/game/useGame";

const at = (paragraph: number, items: GameState["items"] = []): GameState => ({
  ...createCharacter("guerreiro", { skill: 10, stamina: 20, luck: 10 }, []),
  paragraph, history: [1, paragraph], items: ["Espada", "Mochila", ...items],
});
const cage = getParagraph(4).numberedItem!;
const key = (number: number) => ({ name: "Chave", kind: "chave", number });

describe("numbered items", () => {
  it("opens §44 with key 54 and §101 with key 111 at the cage (§4)", () => {
    expect(applyNumberedItem(at(4), key(54), cage)?.paragraph).toBe(44);
    expect(applyNumberedItem(at(4), key(111), cage)?.paragraph).toBe(101);
  });

  it("returns null instead of moving when the number leads nowhere", () => {
    expect(applyNumberedItem(at(4), key(5), cage)).toBeNull();
    expect(applyNumberedItem(at(4), key(999), cage)).toBeNull();
  });

  it("stores a picked-up item once, with its number", () => {
    const item = getParagraph(186).gainItems![0]!;
    const s = gainItem(gainItem(at(186), item), item);
    expect(numberedItems(s, "chave")).toEqual([item]);
    expect(itemLabel(item)).toBe("Chave de prata (nº 111)");
  });

  it("keeps old saves with text-only items working", () => {
    const old = at(4); // items saved as plain strings
    expect(old.items.map(itemLabel)).toEqual(["Espada", "Mochila"]);
    expect(numberedItems(old, "chave")).toEqual([]);
  });
});
