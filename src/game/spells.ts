import { SPELLS, type Spell } from "./adventure";
import type { BookChoice } from "./book";

/** Número máximo de magias de referência que o mago pode marcar na criação do personagem. */
export const MAX_REFERENCE_SPELLS = 6;

/**
 * Uma escolha pronta para ser exibida no parágrafo.
 * - `choice`: a escolha original do livro.
 * - `reference`: a magia do catálogo, presente só quando a escolha lança uma magia que o mago marcou como referência
 *   (usada para destacá-la como "memorizada" na tela).
 */
export type ChoiceView = { choice: BookChoice; reference?: Spell };

/**
 * Escolhas a mostrar em um parágrafo. As opções de magia aparecem só para magos, e sempre todas:
 * as magias escolhidas na criação servem apenas de referência e nunca escondem uma opção.
 * Escolhas marcadas com `libraUsedOnly` aparecem só depois que Libra já foi invocada.
 *
 * @param choices escolhas do parágrafo, como estão no livro.
 * @param cls classe do personagem ("guerreiro" ou "mago").
 * @param referenceSpells códigos das magias marcadas como referência na criação.
 * @param libraUsed se a Deusa Libra já foi invocada nesta aventura.
 */
export function visibleChoices(choices: BookChoice[], cls: "guerreiro" | "mago", referenceSpells: string[], libraUsed = false): ChoiceView[] {
  // 1º filtro: guerreiros não lançam magias. 2º filtro: escolhas que só valem depois de Libra ter sido usada.
  return choices
    .filter((c) => !c.spell || cls === "mago")
    .filter((c) => !c.libraUsedOnly || libraUsed)
    .map((choice) => {
      // Se a magia da escolha foi marcada como referência, anexa os dados dela para destacar na tela.
      const reference = choice.spell && referenceSpells.includes(choice.spell)
        ? SPELLS.find((s) => s.code === choice.spell)
        : undefined;
      return reference ? { choice, reference } : { choice };
    });
}
