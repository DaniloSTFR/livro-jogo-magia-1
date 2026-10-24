import { describe, expect, it } from "vitest";
import { getParagraph } from "@/game/book";
import { visibleChoices } from "@/game/spells";

describe("Spell options", () => {
  const cage = getParagraph(4); // GOP, DOP, BAM, PEP, RAZ
  const spellCodes = (views: ReturnType<typeof visibleChoices>) => views.filter((v) => v.choice.spell).map((v) => v.choice.spell);

  it("shows every spell option to a wizard, even with no reference spells", () => {
    expect(spellCodes(visibleChoices(cage.choices, "mago", []))).toEqual(["GOP", "DOP", "BAM", "PEP", "RAZ"]);
  });

  it("does not hide options outside the reference spells", () => {
    const views = visibleChoices(cage.choices, "mago", ["ZAP", "HOT", "FOF", "WAL", "LAW", "DUM"]);
    expect(spellCodes(views)).toHaveLength(5);
  });

  it("marks only reference spells from the catalogue", () => {
    const views = visibleChoices(cage.choices, "mago", ["DOP", "GOP"]);
    const marked = views.filter((v) => v.reference).map((v) => v.reference!.code);
    expect(marked).toEqual(["DOP"]); // GOP is a decoy, not in the catalogue
    expect(views.find((v) => v.choice.spell === "DOP")?.reference?.cost).toBe(2);
  });

  it("hides spell options from a warrior but keeps the other choices", () => {
    const views = visibleChoices(cage.choices, "guerreiro", []);
    expect(spellCodes(views)).toHaveLength(0);
    expect(views.length).toBe(cage.choices.length - 5);
  });
});
