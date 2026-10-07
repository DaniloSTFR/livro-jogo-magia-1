import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { goto, roll2, type Game } from "@/game/useGame";
import type { Enemy } from "@/game/book";
import { Swords, Clover } from "lucide-react";

type Last = { p: readonly [number, number]; e: readonly [number, number]; result: "hit" | "hurt" | "tie" };

function Die({ v }: { v: number }) {
  return (
    <span key={Math.random()} className="inline-grid h-10 w-10 animate-in spin-in-90 zoom-in place-items-center rounded-md border border-parchment-edge bg-parchment font-display text-xl text-parchment-foreground">
      {v}
    </span>
  );
}

export function CombatModal({ open, enemies, win, game, onClose }: { open: boolean; enemies: Enemy[]; win: number; game: Game; onClose: () => void }) {
  const s = game.state!;
  const [idx, setIdx] = useState(0);
  const enemy = enemies[idx]!;
  const [eSt, setESt] = useState(enemy.stamina);
  const [last, setLast] = useState<Last | null>(null);
  const [luckUsed, setLuckUsed] = useState(false);
  const [msg, setMsg] = useState("");
  const won = eSt <= 0;
  const dead = s.current.stamina <= 0;

  const round = () => {
    const p = roll2(); const e = roll2();
    const ps = p[0] + p[1] + s.current.skill;
    const es = e[0] + e[1] + enemy.skill;
    const result = ps > es ? "hit" : es > ps ? "hurt" : "tie";
    setLast({ p, e, result }); setLuckUsed(false);
    if (result === "hit") { setESt((v) => v - 2); setMsg(`Força ${ps} × ${es}: você fere o inimigo (-2).`); }
    else if (result === "hurt") { game.update((st) => ({ ...st, current: { ...st.current, stamina: st.current.stamina - 2 } })); setMsg(`Força ${ps} × ${es}: você é ferido (-2 Energia).`); }
    else setMsg(`Força ${ps} × ${es}: os golpes se anulam.`);
  };

  const luck = () => {
    if (!last || last.result === "tie") return;
    const r = game.testLuck(); setLuckUsed(true);
    if (last.result === "hit") {
      setESt((v) => v + (r.lucky ? -2 : 1));
      setMsg(r.lucky ? "Sortudo! Golpe devastador (+2 de dano)." : "Azarado! O golpe só arranha (-1 de dano).");
    } else {
      game.update((st) => ({ ...st, current: { ...st.current, stamina: st.current.stamina + (r.lucky ? 1 : -1) } }));
      setMsg(r.lucky ? "Sortudo! Você amortece o golpe (+1 Energia)." : "Azarado! O golpe é pior do que parecia (-1 Energia).");
    }
  };

  const finish = () => {
    game.log(`Derrotou ${enemy.name}`);
    if (idx + 1 < enemies.length) {
      const next = enemies[idx + 1]!;
      setIdx(idx + 1); setESt(next.stamina); setLast(null); setMsg(`Agora enfrente: ${next.name}.`);
      return;
    }
    game.update((st) => goto(st, win));
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl"><Swords className="text-accent" /> Combate</DialogTitle>
          <DialogDescription>Role 2D6 + Habilidade. Quem tiver maior Força de Ataque fere o outro.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {[
            { n: "Você", sk: s.current.skill, st: s.current.stamina, d: last?.p },
            { n: enemy.name, sk: enemy.skill, st: Math.max(0, eSt), d: last?.e },
          ].map((c) => (
            <div key={c.n} className="rounded-lg border border-border bg-muted p-4">
              <div className="font-display text-lg">{c.n}</div>
              <div className="text-sm text-muted-foreground">Habilidade {c.sk} · Energia <b className="text-foreground">{c.st}</b></div>
              <div className="mt-3 flex gap-2">{c.d ? c.d.map((v, i) => <Die key={`${i}-${v}-${msg}`} v={v} />) : <span className="h-10 text-sm italic text-muted-foreground">—</span>}</div>
            </div>
          ))}
        </div>
        {msg && <p className="rounded bg-secondary p-3 italic">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          {won ? (
            <Button onClick={finish} className="flex-1">{idx + 1 < enemies.length ? "Próximo inimigo" : "Vitória! Continuar"}</Button>
          ) : dead ? (
            <Button variant="destructive" onClick={onClose} className="flex-1">Você caiu...</Button>
          ) : (
            <>
              <Button onClick={round} className="flex-1"><Swords /> Rolar ataque</Button>
              <Button variant="secondary" disabled={!last || last.result === "tie" || luckUsed || s.current.luck <= 0} onClick={luck}>
                <Clover /> Testar Sorte
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
