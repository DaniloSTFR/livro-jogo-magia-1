import { SPELLS, type Spell } from "./adventure";
import type { BookChoice } from "./book";

/** Maximum number of reference spells a wizard may mark at character creation. */
export const MAX_REFERENCE_SPELLS = 6;

export type ChoiceView = { choice: BookChoice; reference?: Spell };

/**
 * Choices to show on a paragraph. Spell options are shown only to wizards, and always all of
 * them: the spells chosen at creation are only a reference and never hide an option.
 * Choices marked `libraUsedOnly` appear only once Libra has been invoked.
 */
export function visibleChoices(choices: BookChoice[], cls: "guerreiro" | "mago", referenceSpells: string[], libraUsed = false): ChoiceView[] {
  return choices
    .filter((c) => !c.spell || cls === "mago")
    .filter((c) => !c.libraUsedOnly || libraUsed)
    .map((choice) => {
      const reference = choice.spell && referenceSpells.includes(choice.spell)
        ? SPELLS.find((s) => s.code === choice.spell)
        : undefined;
      return reference ? { choice, reference } : { choice };
    });
}
