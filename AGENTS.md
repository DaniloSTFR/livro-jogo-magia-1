<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the spell catalogue centralized in `src/game/adventure.ts`; gameplay must reference spell codes from that catalogue so content updates remain consistent. The up to 6 spells a wizard marks at creation are only a reference: never use them to hide or block the spell options a paragraph offers (see `src/game/spells.ts`).
- Story content lives in `src/game/book.json`, which is the primary source of the story script (text, choices, combats, luck tests, effects and endings). Edit it directly, keeping it valid JSON and consistent (every `to`/`win`/`lucky`/`unlucky` must point to an existing paragraph). `scripts/Pages_pt-BR.md` and `scripts/parse-book.py` are historical sources only: consult them, but do not re-run the parser over `book.json`, as it would overwrite manual fixes. Use `fontes_base/` (original book PDF and rules) as the ground truth when the text diverges.
- Keep the supplied introduction in a separate text source rendered after character creation and spell selection; hold the new character until its start button opens paragraph 1, without changing existing saved progress.
- Não tome decisões sozinho quando tiver um travamento ou um impedimento (ex.: comando que falha ou estoura o tempo, ferramenta indisponível, dependência que não instala, divergência entre fontes). Pare, explique o problema e as opções, e pergunte ao usuário antes de mudar de abordagem — inclusive antes de usar outro ambiente, como a nuvem.
