import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SPELLS } from "@/game/adventure";
import { createCharacter, d6, type GameState, type Stats } from "@/game/useGame";
import { Dices, Sword, Wand2, Check } from "lucide-react";

function rollStats(cls: GameState["cls"]): Stats {
  return {
    skill: d6() + (cls === "guerreiro" ? 6 : 4),
    stamina: d6() + d6() + 12,
    luck: d6() + 6,
  };
}

export function Creation({ onStart }: { onStart: (s: GameState) => void }) {
  const [cls, setCls] = useState<GameState["cls"] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [step, setStep] = useState<"class" | "roll" | "spells">("class");
  const [spells, setSpells] = useState<string[]>([]);

  const pick = (c: GameState["cls"]) => { setCls(c); setStats(rollStats(c)); setStep("roll"); };
  const toggle = (code: string) =>
    setSpells((s) => (s.includes(code) ? s.filter((x) => x !== code) : s.length < 6 ? [...s, code] : s));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 text-center">
        <p className="font-display text-sm tracking-[0.4em] text-primary">AVENTURA SOLO</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Grimório das Montanhas</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg italic text-muted-foreground">
          Atravesse Kakhabad até a Fortaleza de Mampang e recupere a Coroa dos Reis.
        </p>
      </header>

      {step === "class" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["guerreiro", "Guerreiro", "Habilidade alta (1d6+6). Confia no aço.", Sword],
            ["mago", "Mago", "Habilidade menor (1d6+4), mas memoriza 6 feitiços.", Wand2],
          ] as const).map(([id, name, desc, Icon]) => (
            <button key={id} onClick={() => pick(id)}
              className="group rounded-lg border border-border bg-card p-6 text-left transition hover:border-primary">
              <Icon className="h-8 w-8 text-primary" />
              <h2 className="mt-4 font-display text-2xl">{name}</h2>
              <p className="mt-2 text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      )}

      {step === "roll" && stats && cls && (
        <div className="parchment rounded-lg p-8 text-parchment-foreground">
          <h2 className="font-display text-2xl">Seus Atributos Iniciais</h2>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {([["Habilidade", stats.skill], ["Energia", stats.stamina], ["Sorte", stats.luck]] as const).map(([l, v]) => (
              <div key={l} className="rounded border border-parchment-edge p-4">
                <div className="font-display text-4xl font-bold">{v}</div>
                <div className="mt-1 text-sm uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 italic">Você começa com 2 provisões e 20 moedas de ouro.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" className="border-parchment-edge bg-transparent text-parchment-foreground hover:bg-parchment-edge/30" onClick={() => setStats(rollStats(cls))}>
              <Dices /> Rolar novamente
            </Button>
            <Button onClick={() => (cls === "mago" ? setStep("spells") : onStart(createCharacter(cls, stats, [])))}>
              {cls === "mago" ? "Abrir o Grimório" : "Iniciar a jornada"}
            </Button>
          </div>
        </div>
      )}

      {step === "spells" && stats && (
        <div>
          <h2 className="font-display text-2xl">Memorize 6 feitiços</h2>
          <p className="mt-1 text-muted-foreground">Escolha 6 entre as 48 magias. Somente as memorizadas poderão ser usadas na jornada. ({spells.length}/6)</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {SPELLS.map((sp) => {
              const on = spells.includes(sp.code);
              return (
                <button key={sp.code} onClick={() => toggle(sp.code)}
                  className={`rounded-lg border p-4 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-primary">{sp.code}</span>
                    {on && <Check className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="font-semibold">{sp.name}</div>
                   <div className="text-sm text-muted-foreground">{sp.desc}</div>
                   <div className="mt-2 text-xs text-muted-foreground">Custo: {sp.cost} Energia · Item: {sp.item}</div>
                </button>
              );
            })}
          </div>
          <Button className="mt-6" disabled={spells.length !== 6} onClick={() => onStart(createCharacter("mago", stats, spells))}>
            Iniciar a jornada
          </Button>
        </div>
      )}
    </div>
  );
}
