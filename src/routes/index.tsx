import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import introduction from "@/game/introduction.txt?raw";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SPELLS } from "@/game/adventure";
import { DEATH_ID, MONSTERS, STAT_LABEL, getParagraph } from "@/game/book";
import { applyEffect, d6, goto, previousParagraph, useGame, type GameState } from "@/game/useGame";
import { Creation } from "@/components/game/Creation";
import { AdventureSheet } from "@/components/game/Sheet";
import { CombatModal } from "@/components/game/Combat";
import { BookOpen, Clover, Dices, Skull, Undo2, RotateCcw, Sparkles, Swords, User, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Magia! As Montanhas de Shamutanti — Livro-jogo" },
      { name: "description", content: "Livro-jogo digital: crie seu Guerreiro ou Mago, role dados, lute e use magia nas montanhas." },
      { property: "og:title", content: "Grimório das Montanhas — Aventura Solo" },
      { property: "og:description", content: "Livro-jogo digital com ficha viva, combate com dados e grimório de feitiços." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const game = useGame();
  const [combatKey, setCombatKey] = useState<number | null>(null);
  const [libraOpen, setLibraOpen] = useState(false);
  const [luckMsg, setLuckMsg] = useState<string | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const [dice, setDice] = useState<string | null>(null);
  const [bestiary, setBestiary] = useState(false);
  const [pendingCharacter, setPendingCharacter] = useState<GameState | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [game.state?.paragraph, game.loaded, pendingCharacter]);

  if (!game.loaded) return <div className="min-h-screen" />;
  if (!game.state && pendingCharacter) {
    const [title = "", ...paragraphs] = introduction.trim().split(/\n\s*\n/);
    return (
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        <article className="parchment rounded-lg px-6 py-8 text-parchment-foreground sm:px-12 sm:py-12">
          <h1 className="text-center font-display text-3xl font-bold sm:text-4xl">{title.replace(/\*\*/g, "")}</h1>
          <div className="mx-auto mt-6 h-px w-24 bg-parchment-edge" />
          <div className="mt-8 space-y-4 text-lg leading-relaxed sm:text-xl">
            {paragraphs.map((text, i) => <p key={i}>{text}</p>)}
          </div>
          <div className="mt-10 border-t border-parchment-edge pt-6 text-center">
            <Button onClick={() => { game.setState(pendingCharacter); setPendingCharacter(null); }}><BookOpen /> Iniciar aventura</Button>
          </div>
        </article>
      </main>
    );
  }
  if (!game.state) return <Creation onStart={setPendingCharacter} />;

  const s = game.state;
  const p = getParagraph(s.paragraph);
  const prev = previousParagraph(s);
  const optional = p.effects.filter((e) => !e.auto);
  const inCombatPara = !!p.combat;

  const restart = () => { if (confirm("Recomeçar a aventura? O progresso será perdido.")) game.setState(null); };

  const doLuck = () => {
    if (!p.luckTest) return;
    const r = game.testLuck();
    setLuckMsg(`Dados: ${r.a} + ${r.b} = ${r.a + r.b} — ${r.lucky ? "Sortudo!" : "Azarado..."}`);
    const to = r.lucky ? p.luckTest.lucky : p.luckTest.unlucky;
    setTimeout(() => { setLuckMsg(null); game.update((st) => goto(st, to)); }, 1400);
  };

  const freeLuck = () => {
    const r = game.testLuck();
    setLuckMsg(`Dados: ${r.a} + ${r.b} = ${r.a + r.b} — ${r.lucky ? "Sortudo!" : "Azarado..."}`);
  };

  const rollDice = (n: number) => {
    const v = Array.from({ length: n }, d6);
    setDice(`${v.join(" + ")}${n > 1 ? ` = ${v.reduce((a, b) => a + b, 0)}` : ""}`);
  };

  const libra = (kind: "revive" | "flee" | "cleanse") => {
    game.update((st) => {
      const n = { ...st, libraUsed: true, log: [`Invocou a Deusa Libra (${kind === "revive" ? "Revitalização" : kind === "flee" ? "Fuga" : "Purificação"})`, ...st.log] };
      if (kind === "revive") return { ...n, current: { ...st.initial } };
      if (kind === "cleanse") return { ...n, curses: [] };
      const cur = getParagraph(st.paragraph);
      return cur.combat ? goto(n, cur.combat.win) : n;
    });
    setLibraOpen(false); setCombatKey(null);
  };

  const sheet = <AdventureSheet game={game} onLibra={() => setLibraOpen(true)} />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
      <main className="px-4 py-6 sm:px-8 lg:py-10">
        <header className="mx-auto mb-6 grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-display tracking-widest">AS MONTANHAS DE SHAMUTANTI</span>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="secondary" className="lg:hidden"><User /> Ficha</Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto p-0">
                <SheetTitle className="sr-only">Ficha de Aventura</SheetTitle>
                {sheet}
              </SheetContent>
            </Sheet>
            <Button size="sm" variant="ghost" onClick={() => setBestiary(true)} aria-label="Bestiário"><Skull /></Button>
            <Button size="sm" variant="ghost" onClick={restart} aria-label="Recomeçar"><RotateCcw /></Button>
          </div>
        </header>

        <article key={s.paragraph} className="parchment mx-auto max-w-3xl rounded-lg px-6 py-8 text-parchment-foreground sm:px-12 sm:py-12">
          <div className="text-center">
            <span className="font-display text-5xl font-bold text-parchment-edge">{p.id === DEATH_ID ? "✝" : p.id}</span>
            <div className="mx-auto mt-4 h-px w-24 bg-parchment-edge" />
          </div>
          <div className="mt-8 space-y-4 text-lg leading-relaxed sm:text-xl">
            {p.text.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para.split(/(\*\*[^*]+\*\*)/).map((t, j) => t.startsWith("**") ? <b key={j} className="font-display">{t.slice(2, -2)}</b> : t)}
              </p>
            ))}
          </div>

          {optional.length > 0 && !p.end && (
            <div className="mt-6 space-y-2 rounded border border-parchment-edge/60 p-3">
              <p className="font-display text-sm tracking-wider">Efeitos condicionais — aplique se a situação se encaixar:</p>
              {optional.map((e, i) => {
                const k = `${p.id}-${i}`;
                return (
                  <div key={k} className="flex items-center justify-between gap-3 text-sm">
                    <span className="italic opacity-80">{e.text}</span>
                    <Button size="sm" variant="outline" disabled={applied.includes(k)} className="shrink-0 border-parchment-edge bg-transparent text-parchment-foreground"
                      onClick={() => { setApplied((a) => [...a, k]); game.update((st) => applyEffect(st, e)); }}>
                      {e.amount > 0 ? "+" : ""}{e.amount} {STAT_LABEL[e.stat]}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {(luckMsg || dice) && <p className="mt-6 rounded border border-parchment-edge p-3 text-center font-display">{luckMsg ?? `Dados: ${dice}`}</p>}

          <div className="mt-10 space-y-3 border-t border-parchment-edge pt-6">
            {p.end ? (
              <div className="text-center">
                <p className="mb-4 font-display text-xl">{p.end === "win" ? "Vitória! A maldição de Torrepani foi quebrada." : "Fim da jornada"}</p>
                <Button onClick={() => game.setState(null)}><RotateCcw /> Nova aventura</Button>
              </div>
            ) : (
              <>
                {p.combat && (
                  <Button className="h-auto w-full justify-start whitespace-normal py-3" variant="destructive" onClick={() => setCombatKey(Date.now())}>
                    <Swords /> Lutar: {p.combat.enemies.map((e) => `${e.name} (Hab ${e.skill} · Ene ${e.stamina})`).join(", ")} <span className="ml-auto opacity-70">vitória → {p.combat.win}</span>
                  </Button>
                )}
                {p.luckTest && (
                  <Button className="w-full justify-start" disabled={!!luckMsg} onClick={doLuck}><Clover /> Testar a Sorte (Sortudo → {p.luckTest.lucky} · Azarado → {p.luckTest.unlucky})</Button>
                )}
                {p.choices.map((c, i) => {
                  if (c.spell && s.cls !== "mago") return null;
                  const known = c.spell ? SPELLS.find((x) => x.code === c.spell) : null;
                  if (known && !s.spells.includes(known.code)) return null;
                  const libraBlocked = c.libra && s.libraUsed;
                  const label = /^(vá|va|continue|siga)\b/i.test(c.label) && c.label.length < 30 ? "Continuar" : c.label;
                  return (
                    <Button key={i} disabled={!!libraBlocked || !!luckMsg} onClick={() => { setDice(null); game.choose(c); }}
                      variant="outline"
                      className={`h-auto w-full justify-between whitespace-normal bg-transparent py-3 text-left text-base text-parchment-foreground hover:bg-parchment-edge/25 ${c.libra ? "border-gold" : "border-parchment-edge"}`}>
                      <span className="flex items-center gap-2">
                        {c.spell && <Wand2 className="shrink-0" />}
                        {c.libra && <Sparkles className="shrink-0 text-gold" />}
                        {c.libra ? `Invocar Libra — ${label}` : label}
                        {libraBlocked && " (Libra já foi invocada)"}
                      </span>
                      <span className="shrink-0 font-display text-sm opacity-70">→ {c.to}</span>
                    </Button>
                  );
                })}
                {p.back && prev !== null && (
                  <Button variant="outline" className="w-full justify-between border-parchment-edge bg-transparent text-parchment-foreground" onClick={game.goBack}>
                    <span className="flex items-center gap-2"><Undo2 /> Voltar à referência anterior</span>
                    <span className="font-display text-sm opacity-70">→ {prev}</span>
                  </Button>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {p.luckFree && !p.luckTest && <Button size="sm" variant="secondary" disabled={!!luckMsg} onClick={freeLuck}><Clover /> Testar a Sorte</Button>}
                  <Button size="sm" variant="secondary" onClick={() => rollDice(1)}><Dices /> 1 dado</Button>
                  <Button size="sm" variant="secondary" onClick={() => rollDice(2)}><Dices /> 2 dados</Button>
                  <Button size="sm" variant="secondary" onClick={() => rollDice(3)}><Dices /> 3 dados</Button>
                </div>
              </>
            )}
          </div>
        </article>
      </main>

      <aside className="hidden border-l border-border bg-card/60 lg:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto">{sheet}</div>
      </aside>

      {combatKey && p.combat && (
        <CombatModal key={combatKey} open enemies={p.combat.enemies} win={p.combat.win} game={game} onClose={() => setCombatKey(null)} />
      )}

      <Dialog open={bestiary} onOpenChange={setBestiary}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl"><Skull /> Bestiário</DialogTitle>
            <DialogDescription>Monstros das Montanhas de Shamutanti.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {MONSTERS.map((m) => (
              <li key={m.name} className="flex items-center justify-between gap-2 py-2">
                <span className="font-display">{m.name}</span>
                <span className="text-sm text-muted-foreground">Hab {m.skill} · Ene {m.stamina} · §{m.paragraphs.join(", ")}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={libraOpen} onOpenChange={setLibraOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl text-gold"><Sparkles /> Deusa Libra</DialogTitle>
            <DialogDescription>Você só pode invocá-la uma vez em toda a aventura. Escolha o milagre:</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="h-auto w-full flex-col items-start whitespace-normal py-3" onClick={() => libra("revive")}>
              <b className="font-display">Revitalização</b><span className="text-sm text-muted-foreground">Restaura Habilidade, Energia e Sorte aos valores iniciais.</span>
            </Button>
            <Button variant="outline" disabled={!inCombatPara} className="h-auto w-full flex-col items-start whitespace-normal py-3" onClick={() => libra("flee")}>
              <b className="font-display">Fuga de Emergência</b><span className="text-sm text-muted-foreground">{inCombatPara ? "Escapa do confronto atual e segue adiante." : "Disponível apenas diante de um confronto."}</span>
            </Button>
            <Button variant="outline" disabled={s.curses.length === 0} className="h-auto w-full flex-col items-start whitespace-normal py-3" onClick={() => libra("cleanse")}>
              <b className="font-display">Remoção de Maldições</b><span className="text-sm text-muted-foreground">{s.curses.length ? `Remove: ${s.curses.join(", ")}.` : "Nenhuma maldição ativa."}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
