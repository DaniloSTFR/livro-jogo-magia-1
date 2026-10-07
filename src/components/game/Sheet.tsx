import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SPELLS } from "@/game/adventure";
import type { Game } from "@/game/useGame";
import { Coins, Drumstick, Backpack, ScrollText, Sparkles, Skull, History } from "lucide-react";

function StatBar({ label, cur, init, color }: { label: string; cur: number; init: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (cur / Math.max(init, 1)) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm tracking-wider">{label}</span>
        <span className="font-display text-lg">{cur}<span className="text-sm text-muted-foreground"> / {init}</span></span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Coins; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm tracking-widest text-primary"><Icon className="h-4 w-4" />{title}</h3>
      {children}
    </section>
  );
}

export function AdventureSheet({ game, onLibra }: { game: Game; onLibra: () => void }) {
  const s = game.state!;
  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="font-display text-xs tracking-[0.3em] text-muted-foreground">FICHA DE AVENTURA</p>
        <p className="font-display text-xl capitalize">{s.cls}</p>
      </div>
      <div className="space-y-3">
        <StatBar label="HABILIDADE" cur={s.current.skill} init={s.initial.skill} color="bg-stat-skill" />
        <StatBar label="ENERGIA" cur={s.current.stamina} init={s.initial.stamina} color="bg-stat-stamina" />
        <StatBar label="SORTE" cur={s.current.luck} init={s.initial.luck} color="bg-stat-luck" />
      </div>

      <button onClick={onLibra} disabled={s.libraUsed}
        className={`w-full rounded-md border border-gold px-4 py-3 font-display tracking-wider text-gold transition disabled:opacity-40 ${s.libraUsed ? "" : "gold-glow hover:bg-gold/10"}`}>
        <Sparkles className="mr-2 inline h-4 w-4" />Deusa Libra [{s.libraUsed ? 0 : 1}/1 Uso]
      </button>

      <Section icon={Drumstick} title="PROVISÕES">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg">{s.provisions} refeiç{s.provisions === 1 ? "ão" : "ões"}</span>
          <Button size="sm" variant="secondary" disabled={s.provisions <= 0 || s.current.stamina >= s.initial.stamina} onClick={game.eat}>
            Consumir Refeição
          </Button>
        </div>
      </Section>

      <Section icon={Coins} title="OURO">
        <span className="text-lg text-gold">{s.gold} peças de ouro</span>
      </Section>

      <Section icon={Backpack} title="EQUIPAMENTO">
        <ul className="flex flex-wrap gap-2">
          {s.items.map((i) => <li key={i} className="rounded border border-border bg-muted px-2 py-0.5 text-sm">{i}</li>)}
        </ul>
      </Section>

      {s.cls === "mago" && (
        <Section icon={ScrollText} title="FEITIÇOS MEMORIZADOS">
          <ul className="space-y-1 text-sm">
            {s.spells.map((c) => {
              const sp = SPELLS.find((x) => x.code === c);
              if (!sp) return null;
              return (
                <li key={c} className="flex items-center justify-between gap-2">
                  <span><b className="font-display text-primary">{c}</b> {sp.name}</span>
                  <span className="text-xs text-muted-foreground">{sp.cost} Energia</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {s.curses.length > 0 && (
        <Section icon={Skull} title="MALDIÇÕES">
          <ul className="text-sm text-destructive">{s.curses.map((c) => <li key={c}>{c}</li>)}</ul>
        </Section>
      )}

      <Section icon={ScrollText} title="PISTAS & ANOTAÇÕES">
        <Textarea value={s.notes} placeholder="Senhas, códigos, pistas..." className="min-h-20 bg-muted"
          onChange={(e) => { const v = e.target.value; game.update((st) => ({ ...st, notes: v })); }} />
      </Section>

      <Section icon={History} title="DIÁRIO DA JORNADA">
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">Ver últimos eventos ({s.log.length})</summary>
          <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {s.log.map((l, i) => <li key={i} className="border-l-2 border-primary/40 pl-2">{l}</li>)}
          </ol>
        </details>
      </Section>
    </div>
  );
}
