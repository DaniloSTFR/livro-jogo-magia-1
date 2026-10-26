import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { attackModifier, d6, goto, type Game } from "@/game/useGame";
import type { Combat } from "@/game/book";
import {
  canEscape, enemySkill, exchange, luckyDamage, luckyWound, makeAllies, playerDamage, playerSkill, rollFlee, weaponOptions, woundTaken,
  type Dice, type Exchange, type Fighter,
} from "@/game/combat";
import { Clover, DoorOpen, Minus, Plus, Swords, Users } from "lucide-react";

/** Um dado na tela; a `key` aleatória refaz a animação a cada rolagem. */
function Die({ v }: { v: number }) {
  return (
    <span key={Math.random()} className="inline-grid h-10 w-10 animate-in spin-in-90 zoom-in place-items-center rounded-md border border-parchment-edge bg-parchment font-display text-xl text-parchment-foreground">
      {v}
    </span>
  );
}

/** Formata um número com sinal (ex.: +2, -1). */
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

/**
 * Cartão de um combatente com HABILIDADE, ENERGIA e os dados da última rolagem.
 * - `rollKey`: muda a cada série, para animar os dados de novo.
 * - `note`: observação curta (ex.: "HABILIDADE dobrada").
 * - `onAdjust`: mostra botões de ±1 ENERGIA para correções manuais.
 * - `active` / `onSelect`: destaque e clique para escolher o alvo nos combates em que todos atacam juntos.
 */
function FighterCard({ name, skill, stamina, dice, rollKey, note, onAdjust, active, onSelect }: {
  name: string; skill: number; stamina: number; dice?: Dice | undefined; rollKey?: number; note?: string | undefined;
  onAdjust?: (d: number) => void; active?: boolean | undefined; onSelect?: (() => void) | undefined;
}) {
  return (
    <div className={`rounded-lg border bg-muted p-4 ${active ? "border-accent" : "border-border"} ${onSelect ? "cursor-pointer" : ""}`} onClick={onSelect}>
      <div className="font-display text-lg">{name}</div>
      <div className="text-sm text-muted-foreground">Habilidade {skill} · Energia <b className="text-foreground">{Math.max(0, stamina)}</b></div>
      {note && <div className="text-xs italic text-muted-foreground">{note}</div>}
      <div className="mt-3 flex items-center gap-2">
        {dice ? dice.map((v, i) => <Die key={`${i}-${v}-${rollKey}`} v={v} />) : <span className="h-10 text-sm italic text-muted-foreground">—</span>}
        {onAdjust && (
          <span className="ml-auto flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`-1 Energia de ${name}`} onClick={(e) => { e.stopPropagation(); onAdjust(-1); }}><Minus /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`+1 Energia de ${name}`} onClick={(e) => { e.stopPropagation(); onAdjust(1); }}><Plus /></Button>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Janela de combate. Conduz as Séries de Ataque do leitor (ou de um aliado) contra os inimigos do parágrafo,
 * com fuga de inimigos, criação de aliados, teste de sorte, fuga do leitor e vitória.
 * @param combat o combate descrito no parágrafo atual.
 * @param onClose fecha a janela (ao vencer, fugir, morrer ou quando o texto decide o que vem depois).
 */
export function CombatModal({ open, combat: c, game, onClose }: { open: boolean; combat: Combat; game: Game; onClose: () => void }) {
  const s = game.state!;
  // Combate em que um aliado luta pelo leitor.
  const allyMode = c.mode === "ally";
  // Cópia dos inimigos, com a ENERGIA que vai baixando durante a luta.
  const [enemies, setEnemies] = useState<Fighter[]>(() => c.enemies.map((e) => ({ ...e })));
  // Índice do inimigo atual (ou do alvo escolhido, quando todos atacam juntos).
  const [idx, setIdx] = useState(0);
  // Se a rolagem de fuga dos inimigos já foi feita (ou não é necessária).
  const [fleeDone, setFleeDone] = useState(!c.flee);
  // Aliados do leitor; null enquanto ele ainda não escolheu quantos criar.
  const [allies, setAllies] = useState<Fighter[] | null>(() => (allyMode && !c.ally?.choose ? makeAllies(c) : null));
  // Índice do aliado que está lutando agora.
  const [allyIdx, setAllyIdx] = useState(0);
  // Quantos aliados o leitor quer criar (quando o texto deixa escolher).
  const [allyCount, setAllyCount] = useState(1);
  // Se é o próprio leitor quem luta (falso enquanto um aliado luta por ele).
  const [self, setSelf] = useState(!allyMode);
  // Número de séries já disputadas contra o inimigo atual.
  const [round, setRound] = useState(0);
  // Se o inimigo já se recuperou da magia que o enfraquecia.
  const [recovered, setRecovered] = useState(false);
  // Resultado da última série (para mostrar os dados e permitir testar a sorte).
  const [last, setLast] = useState<Exchange | null>(null);
  // Se a sorte já foi testada nesta série.
  const [luckUsed, setLuckUsed] = useState(false);
  // Mensagem que narra o que aconteceu na última ação.
  const [msg, setMsg] = useState("");
  // Nomes dos monstros já registrados no diário neste combate.
  const [met, setMet] = useState<string[]>([]);
  // Índice da arma escolhida na lista `weapons`.
  const [weapon, setWeapon] = useState(0);

  // Armas disponíveis na ficha (a espada comum sempre aparece).
  const weapons = weaponOptions(s);
  // Modificador total da Força de Ataque do leitor: ficha + arma + regra do texto.
  const mod = attackModifier(s) + (weapons[weapon]?.attack ?? 0) + (c.playerRoll ?? 0);
  // Inimigos ainda de pé, com o índice original de cada um.
  const alive = enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.stamina > 0);
  const enemy = enemies[idx]!;
  // Aliado atual (undefined quando todos já caíram).
  const ally = allies?.[allyIdx];
  // HABILIDADE do inimigo na próxima série.
  const skillNow = enemySkill(c, enemy.skill, round + 1, recovered);
  const allDown = alive.length === 0;
  // Vitória: todos caídos (quando atacam juntos) ou o inimigo atual caído.
  const won = c.together ? allDown : enemy.stamina <= 0;
  // O leitor caiu lutando.
  const dead = self && s.current.stamina <= 0;
  // Todos os aliados caíram e o leitor ainda não assumiu a luta.
  const alliesLost = allyMode && !self && allies !== null && !ally;
  // Ainda na preparação: falta rolar a fuga dos inimigos ou criar os aliados.
  const setup = !fleeDone || (allyMode && allies === null);

  // Muda a ENERGIA do inimigo `i` em `d` (sem ficar negativa).
  const adjustEnemy = (i: number, d: number) => setEnemies((es) => es.map((e, j) => (j === i ? { ...e, stamina: Math.max(0, e.stamina + d) } : e)));
  // Tira `n` de ENERGIA do leitor.
  const hurtPlayer = (n: number) => game.update((st) => ({ ...st, current: { ...st.current, stamina: Math.max(0, st.current.stamina - n) } }));
  // Muda a ENERGIA do leitor em `d`, entre 0 e o valor inicial.
  const adjustPlayer = (d: number) => game.update((st) => ({ ...st, current: { ...st.current, stamina: Math.max(0, Math.min(st.initial.stamina, st.current.stamina + d)) } }));
  const meet = (e: Fighter) => {
    // Cada monstro enfrentado vai para o diário, como os quadros de encontro da ficha original.
    if (met.includes(e.name)) return;
    game.log(`Encontro: ${e.name} — HABILIDADE ${e.skill}, ENERGIA ${e.stamina}`);
    setMet((m) => [...m, e.name]);
  };

  // Rola a fuga de cada inimigo; só os que ficam continuam no combate.
  const doFlee = () => {
    const r = rollFlee(enemies, d6);
    const stay = r.filter((x) => !x.fled).map((x) => x.enemy);
    setMsg(r.map((x) => `${x.enemy.name}: ${x.dice[0]} + ${x.dice[1]} — ${x.fled ? "foge" : "ataca"}`).join(" · "));
    setFleeDone(true);
    if (stay.length) { setEnemies(stay); setIdx(0); }
    else setEnemies([]);
  };

  // Cria os aliados escolhidos, cobrando a ENERGIA de cada um; com zero aliados o próprio leitor luta.
  const createAllies = () => {
    const cost = (c.ally!.choose?.cost ?? 0) * allyCount;
    if (cost) { hurtPlayer(cost); game.log(`Criou ${allyCount} ${c.ally!.name}(s) (-${cost} Energia)`); }
    if (allyCount === 0) { setAllies([]); setSelf(true); setMsg("Sem aliados: você mesmo enfrenta a criatura."); return; }
    setAllies(makeAllies(c, allyCount));
  };

  // Magias que perdem o efeito: antes de cada série depois das enfraquecidas, um dado diz se o inimigo se recupera.
  const nextSkill = (): { skill: number; note: string } => {
    const w = c.weakened;
    const r = round + 1;
    if (!w?.recover || r <= w.rounds || recovered) return { skill: enemySkill(c, enemy.skill, r, recovered), note: "" };
    const die = d6();
    const back = die % 2 === 0;
    if (back) setRecovered(true);
    return { skill: back ? enemy.skill : w.skill, note: `Dado ${die}: ${back ? `${enemy.name} se recupera (HABILIDADE ${enemy.skill}). ` : "a magia ainda o atrapalha. "}` };
  };

  // Uma série de ataque do próprio leitor.
  const playerRound = () => {
    const pSkill = playerSkill(c, s.current.skill);
    if (c.together) {
      // Todos atacam juntos: o leitor disputa uma série com cada inimigo, mas só fere o alvo escolhido.
      const target = enemies[idx]!.stamina > 0 ? idx : alive[0]!.i;
      let hurt = 0;
      const parts: string[] = [];
      let main: Exchange | null = null;
      for (const { e, i } of alive) {
        meet(e);
        const ex = exchange(c, pSkill, mod, enemySkill(c, e.skill, round + 1, recovered), d6);
        if (i === target) main = ex;
        if (ex.result === "hit" && i === target) { adjustEnemy(i, -playerDamage(c)); parts.push(`você fere ${e.name} (-${playerDamage(c)})`); }
        else if (ex.result === "hurt") { const n = woundTaken(c, ex, s.current.stamina); hurt += n; parts.push(`${e.name} fere você (-${n})`); }
        else parts.push(ex.result === "hit" ? `você se defende de ${e.name}` : `você e ${e.name} se anulam`);
      }
      if (hurt) hurtPlayer(hurt);
      setIdx(target); setLast(main); setLuckUsed(false); setRound((r) => r + 1);
      setMsg(`${parts.join("; ")}.`);
      return;
    }
    // Combate normal: uma série contra o inimigo atual.
    meet(enemy);
    const { skill, note } = nextSkill();
    const ex = exchange(c, pSkill, mod, skill, d6);
    setLast(ex); setLuckUsed(false); setRound((r) => r + 1);
    const vs = `Força ${ex.sideStrength} × ${ex.enemyStrength}`;
    if (ex.result === "hit") { adjustEnemy(idx, -playerDamage(c)); setMsg(`${note}${vs}: você fere o inimigo (-${playerDamage(c)}).`); }
    else if (ex.result === "tie") setMsg(`${note}${vs}: os golpes se anulam.`);
    else {
      let saved = false;
      let stingMsg = "";
      if (ex.stung) {
        // Ferroada: com `luckSaves`, um teste de sorte bem-sucedido a reduz a um ferimento normal.
        stingMsg = ` Dado do ferrão: ${ex.stingDie} — ferrão!`;
        if (c.sting?.luckSaves) {
          const r = game.testLuck(); saved = r.lucky;
          stingMsg += ` Sorte: ${r.a} + ${r.b} — ${r.lucky ? "Sortudo, o dano é normal." : "Azarado!"}`;
        }
      } else if (ex.stingDie) stingMsg = ` Dado do ferrão: ${ex.stingDie} — golpe normal.`;
      const n = woundTaken(c, ex, s.current.stamina, saved);
      hurtPlayer(n);
      setMsg(`${note}${vs}: você é ferido (-${n} Energia).${stingMsg}`);
    }
  };

  // Uma série de ataque do aliado (sem os modificadores do leitor); se o aliado cair, passa para o próximo.
  const allyRound = () => {
    meet(enemy);
    const { skill, note } = nextSkill();
    const a = ally!;
    const ex = exchange(c, a.skill, 0, skill, d6);
    setLast(ex); setRound((r) => r + 1);
    const vs = `Força ${ex.sideStrength} × ${ex.enemyStrength}`;
    if (ex.result === "hit") { adjustEnemy(idx, -2); setMsg(`${note}${vs}: ${a.name} fere ${enemy.name} (-2).`); return; }
    if (ex.result === "tie") { setMsg(`${note}${vs}: os golpes se anulam.`); return; }
    const n = woundTaken(c, ex, a.stamina);
    const left = a.stamina - n;
    setAllies((as) => as!.map((x, j) => (j === allyIdx ? { ...x, stamina: left } : x)));
    const sting = ex.stingDie ? ` Dado do ferrão: ${ex.stingDie}${ex.stung ? " — ferrão!" : " — golpe normal."}` : "";
    setMsg(`${note}${vs}: ${enemy.name} fere ${a.name} (-${n}).${sting}${left <= 0 ? ` ${a.name} cai.` : ""}`);
    if (left <= 0) { game.log(`${a.name} caiu`); setAllyIdx((i) => i + 1); setLast(null); }
  };

  // Testa a sorte depois de uma série: aumenta o dano causado ou reduz o dano sofrido.
  const luck = () => {
    if (!last || last.result === "tie") return;
    const r = game.testLuck(); setLuckUsed(true);
    if (last.result === "hit") {
      const extra = luckyDamage(c, r.lucky);
      adjustEnemy(idx, -extra);
      setMsg(r.lucky ? `Sortudo! Golpe devastador (+${extra} de dano).` : `Azarado! O golpe só arranha (${extra} de dano).`);
    } else {
      adjustPlayer(luckyWound(r.lucky));
      setMsg(r.lucky ? "Sortudo! Você amortece o golpe (+1 Energia)." : "Azarado! O golpe é pior do que parecia (-1 Energia).");
    }
  };

  // Inimigo derrotado: passa ao próximo ou, se era o último, segue para o parágrafo de vitória.
  const finish = () => {
    if (c.together) {
      for (const e of enemies) game.log(`Derrotou ${e.name}`);
    } else {
      game.log(`Derrotou ${enemy.name}`);
      if (idx + 1 < enemies.length) {
        const next = enemies[idx + 1]!;
        setIdx(idx + 1); setLast(null); setRound(0); setRecovered(false); setMsg(`Agora enfrente: ${next.name}.`);
        return;
      }
    }
    game.update((st) => goto(st, c.win));
    onClose();
  };

  // Usa a fuga do texto, pagando a penalidade de ENERGIA.
  const escape = () => {
    const e = c.escape!;
    game.update((st) => goto({ ...st, current: { ...st.current, stamina: st.current.stamina - (e.penalty ?? 0) } }, e.to));
    onClose();
  };

  // Todos os inimigos fugiram: segue para o parágrafo indicado.
  const fleeAll = () => { game.update((st) => goto(st, c.flee!.to)); onClose(); };

  // Inimigos exibidos: todos (quando atacam juntos) ou só o atual.
  const showEnemies = c.together ? enemies.map((e, i) => ({ e, i })) : [{ e: enemy, i: idx }];
  // Cartão do lado esquerdo: o leitor ou o aliado que está lutando.
  const left = self
    ? { name: "Você", skill: playerSkill(c, s.current.skill), stamina: s.current.stamina, onAdjust: adjustPlayer, note: c.doubleSkill ? "HABILIDADE dobrada" : undefined }
    : ally ? { name: ally.name, skill: ally.skill, stamina: ally.stamina, note: allies!.length > 1 ? `Aliado ${allyIdx + 1} de ${allies!.length}` : "Aliado",
        onAdjust: (d: number) => setAllies((as) => as!.map((x, j) => (j === allyIdx ? { ...x, stamina: Math.max(0, x.stamina + d) } : x))) }
    : null;

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">{allyMode && !self ? <Users className="text-accent" /> : <Swords className="text-accent" />} Combate</DialogTitle>
          <DialogDescription>
            {allyMode && !self
              ? "Seu aliado luta por você: você assiste e não perde ENERGIA neste combate."
              : "Role 2D6 + Habilidade. Quem tiver maior Força de Ataque fere o outro."}
            {self && mod !== 0 && ` Modificadores na sua Força de Ataque: ${signed(mod)}.`}
            {c.together && " Todos atacam ao mesmo tempo: toque no inimigo que você quer ferir."}
          </DialogDescription>
        </DialogHeader>
        {c.rules && <p className="rounded border border-border p-3 text-sm"><b className="font-display">Regra especial:</b> {c.rules}</p>}
        {self && weapons.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            Arma:
            <select className="rounded border border-border bg-background px-2 py-1" value={weapon} onChange={(e) => setWeapon(Number(e.target.value))}>
              {weapons.map((w, i) => <option key={i} value={i}>{w.label}{w.attack ? ` (${signed(w.attack)} Força de Ataque)` : ""}</option>)}
            </select>
          </label>
        )}
        {!setup && enemies.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {left ? <FighterCard {...left} dice={last?.side} rollKey={round} /> : <div />}
            <div className="space-y-3">
              {showEnemies.map(({ e, i }) => (
                <FighterCard key={i} name={e.name} skill={c.together ? e.skill : skillNow} stamina={e.stamina} dice={i === idx ? last?.enemy : undefined} rollKey={round}
                  note={!c.together && skillNow !== e.skill ? `HABILIDADE normal ${e.skill}` : undefined}
                  active={c.together && i === idx} onSelect={c.together && e.stamina > 0 ? () => setIdx(i) : undefined}
                  onAdjust={(d) => adjustEnemy(i, d)} />
              ))}
            </div>
          </div>
        )}
        {msg && <p className="rounded bg-secondary p-3 italic">{msg}</p>}
        {/* Botões de ação, conforme a fase do combate: fuga dos inimigos, criação de aliados, vitória, morte ou luta. */}
        <div className="flex flex-wrap gap-2">
          {!fleeDone ? (
            <Button onClick={doFlee} className="flex-1">Rolar a fuga dos inimigos</Button>
          ) : enemies.length === 0 ? (
            <Button onClick={fleeAll} className="flex-1">Todos fugiram — continuar → {c.flee!.to}</Button>
          ) : allyMode && allies === null ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              <span className="text-sm">Quantos {c.ally!.name}s criar ({c.ally!.choose!.cost} Energia cada)?</span>
              <Button size="icon" variant="outline" aria-label="Menos" onClick={() => setAllyCount((n) => Math.max(0, n - 1))}><Minus /></Button>
              <b className="w-6 text-center">{allyCount}</b>
              <Button size="icon" variant="outline" aria-label="Mais" onClick={() => setAllyCount((n) => n + 1)}><Plus /></Button>
              <Button className="flex-1" onClick={createAllies}><Users /> {allyCount === 0 ? "Sem aliados: lutar" : "Criar e atacar"}</Button>
            </div>
          ) : won ? (
            <Button onClick={finish} className="flex-1">{!c.together && idx + 1 < enemies.length ? "Próximo inimigo" : `Vitória! Continuar → ${c.win}`}</Button>
          ) : dead ? (
            <Button variant="destructive" onClick={onClose} className="flex-1">Você caiu...</Button>
          ) : alliesLost ? (
            c.allyLost === "self" ? (
              <Button onClick={() => { setSelf(true); setLast(null); setMsg(`Você termina a batalha contra ${enemy.name}.`); }} className="flex-1"><Swords /> Terminar a luta você mesmo</Button>
            ) : (
              <Button variant="secondary" onClick={onClose} className="flex-1">{enemy.name} venceu — escolha no texto o que fazer</Button>
            )
          ) : self ? (
            <>
              <Button onClick={playerRound} className="flex-1"><Swords /> Rolar ataque</Button>
              <Button variant="secondary" disabled={!last || last.result === "tie" || luckUsed || s.current.luck <= 0} onClick={luck}>
                <Clover /> Testar Sorte
              </Button>
              {c.escape && (
                <Button variant="outline" disabled={!canEscape(c, enemy.stamina, s.current.stamina)} onClick={escape} className="w-full">
                  <DoorOpen /> {c.escape.label} → {c.escape.to}{c.escape.penalty ? ` (-${c.escape.penalty} Energia)` : ""}
                </Button>
              )}
            </>
          ) : (
            <Button onClick={allyRound} className="flex-1"><Swords /> Rolar ataque de {ally!.name}</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
