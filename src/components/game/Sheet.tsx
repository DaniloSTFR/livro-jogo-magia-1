import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SPELLS } from "@/game/adventure";
import { getParagraph } from "@/game/book";
import {
  CONDITION_LABEL, addCondition, addItem, adjustGold, adjustProvisions, canEat, conditionLabel, itemLabel, removeCondition, removeItem,
  type Condition, type Game,
} from "@/game/useGame";
import { Coins, Drumstick, Backpack, ScrollText, Sparkles, Skull, History, Minus, Plus, X } from "lucide-react";

/**
 * Barra de um atributo: valor atual sobre o inicial, com preenchimento proporcional.
 * @param color classe Tailwind da cor da barra.
 */
function StatBar({ label, cur, init, color }: { label: string; cur: number; init: number; color: string }) {
  // Porcentagem preenchida, limitada entre 0 e 100.
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

/** Seção da ficha com ícone e título. */
function Section({ icon: Icon, title, children }: { icon: typeof Coins; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm tracking-widest text-primary"><Icon className="h-4 w-4" />{title}</h3>
      {children}
    </section>
  );
}

/**
 * Contador com botões de menos e mais.
 * @param value texto exibido entre os botões.
 * @param label nome usado na acessibilidade dos botões.
 * @param onChange recebe -1 ou +1.
 */
function Counter({ value, label, className = "", onChange }: { value: string; label: string; className?: string; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Menos ${label}`} onClick={() => onChange(-1)}><Minus /></Button>
      <span className={`text-lg ${className}`}>{value}</span>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Mais ${label}`} onClick={() => onChange(1)}><Plus /></Button>
    </div>
  );
}

/**
 * Ficha de Aventura: atributos, Libra, provisões, ouro, equipamento, magias de referência,
 * anotações e diário. Todas as alterações passam por `game.update`, que salva a partida.
 * @param onLibra abre a janela de invocação da Deusa Libra.
 */
export function AdventureSheet({ game, onLibra }: { game: Game; onLibra: () => void }) {
  const s = game.state!;
  // Campos do formulário de novo item (nome e número gravado opcional).
  const [itemName, setItemName] = useState("");
  const [itemNumber, setItemNumber] = useState("");
  // Campos do formulário de nova anotação (nome, tipo e modificador de Força de Ataque).
  const [condName, setCondName] = useState("");
  const [condKind, setCondKind] = useState<Condition["kind"]>("penalty");
  const [condAttack, setCondAttack] = useState("");
  // Refeição permitida pelo parágrafo atual, se houver.
  const meal = getParagraph(s.paragraph).meal;
  // Dica abaixo do botão de comer, explicando por que dá (ou não dá) para comer agora.
  const mealHint = !meal ? "Só é possível comer quando o texto permitir."
    : s.ateAt === s.history.length ? "Você já comeu aqui: uma refeição por vez."
    : s.provisions <= 0 ? "O texto permite comer aqui, mas você não tem Provisões."
    : meal.alreadyAte !== undefined ? `O texto permite comer aqui: +${meal.stamina} na primeira refeição do dia, +${meal.alreadyAte} se já comeu (escolha no parágrafo).`
    : `O texto permite comer aqui: +${meal.stamina} ENERGIA.`;
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

      {/* Botão da Deusa Libra: um único uso por aventura. */}
      <button onClick={onLibra} disabled={s.libraUsed}
        className={`w-full rounded-md border border-gold px-4 py-3 font-display tracking-wider text-gold transition disabled:opacity-40 ${s.libraUsed ? "" : "gold-glow hover:bg-gold/10"}`}>
        <Sparkles className="mr-2 inline h-4 w-4" />Deusa Libra [{s.libraUsed ? 0 : 1}/1 Uso]
      </button>

      <Section icon={Drumstick} title="PROVISÕES">
        <div className="flex items-center justify-between gap-2">
          <Counter value={`${s.provisions} refeiç${s.provisions === 1 ? "ão" : "ões"}`} label="provisões"
            onChange={(d) => game.update((st) => adjustProvisions(st, d))} />
          <Button size="sm" variant="secondary" disabled={!canEat(s, meal)} onClick={() => game.eat()}>
            Consumir Refeição{meal && ` (+${meal.stamina})`}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{mealHint}</p>
      </Section>

      <Section icon={Coins} title="OURO">
        <Counter value={`${s.gold} peças de ouro`} label="ouro" className="text-gold"
          onChange={(d) => game.update((st) => adjustGold(st, d))} />
      </Section>

      <Section icon={Backpack} title="EQUIPAMENTO">
        <ul className="flex flex-wrap gap-2">
          {s.items.map((i, k) => (
            <li key={k} className="flex items-center gap-1 rounded border border-border bg-muted py-0.5 pl-2 pr-1 text-sm">
              {itemLabel(i)}
              <button aria-label={`Remover ${itemLabel(i)}`} className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                onClick={() => game.update((st) => removeItem(st, k))}><X className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
        <form className="mt-2 flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          // Número vazio = item comum; número inteiro = item numerado; outro valor é ignorado.
          const n = itemNumber.trim() === "" ? undefined : Number(itemNumber);
          if (n !== undefined && !Number.isInteger(n)) return;
          game.update((st) => addItem(st, itemName, n));
          setItemName(""); setItemNumber("");
        }}>
          <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Novo item" className="h-8 bg-muted" />
          <Input value={itemNumber} onChange={(e) => setItemNumber(e.target.value)} placeholder="Nº" inputMode="numeric" aria-label="Número gravado (opcional)" className="h-8 w-16 bg-muted" />
          <Button size="sm" type="submit" variant="secondary" disabled={!itemName.trim()} aria-label="Adicionar item"><Plus /></Button>
        </form>
      </Section>

      {s.cls === "mago" && (
        <Section icon={ScrollText} title="MAGIAS DE REFERÊNCIA">
          {s.spells.length === 0 && <p className="text-sm italic text-muted-foreground">Nenhuma magia marcada.</p>}
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

      <Section icon={Skull} title="BÔNUS, PENALIDADES, MALDIÇÕES E DOENÇAS">
        {s.conditions.length === 0 && <p className="text-sm italic text-muted-foreground">Nada anotado.</p>}
        <ul className="space-y-1 text-sm">
          {s.conditions.map((c, k) => (
            <li key={k} className={`flex items-center justify-between gap-2 ${c.kind === "curse" || c.kind === "disease" ? "text-destructive" : ""}`}>
              <span>{conditionLabel(c)}</span>
              <button aria-label={`Remover ${c.name}`} className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                onClick={() => game.update((st) => removeCondition(st, k))}><X className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
        <form className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={(e) => {
          e.preventDefault();
          // Campo vazio vira 0 (sem modificador); valores não inteiros são ignorados.
          const attack = Number(condAttack);
          if (!Number.isInteger(attack)) return;
          game.update((st) => addCondition(st, { name: condName, kind: condKind, attack }));
          setCondName(""); setCondAttack("");
        }}>
          <Input value={condName} onChange={(e) => setCondName(e.target.value)} placeholder="Nome (ex.: machado de Glandragor)" className="col-span-2 h-8 bg-muted" />
          <div className="flex gap-2">
            <select value={condKind} onChange={(e) => setCondKind(e.target.value as Condition["kind"])} aria-label="Tipo"
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-muted px-2 text-sm">
              {Object.entries(CONDITION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <Input value={condAttack} onChange={(e) => setCondAttack(e.target.value)} placeholder="±FA" inputMode="numeric"
              aria-label="Modificador de Força de Ataque (opcional)" className="h-8 w-16 bg-muted" />
          </div>
          <Button size="sm" type="submit" variant="secondary" disabled={!condName.trim()} aria-label="Anotar"><Plus /></Button>
        </form>
      </Section>

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
