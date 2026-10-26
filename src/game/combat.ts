import { WEAPONS, type Combat, type Enemy } from "./book";
import { itemLabel, type GameState } from "./useGame";

/** Resultado de uma rolagem de dois dados (2D6). */
export type Dice = readonly [number, number];
/** Qualquer combatente (inimigo ou aliado): nome, HABILIDADE e ENERGIA. */
export type Fighter = Enemy;
/**
 * Uma Série de Ataque entre um lado (o leitor ou um aliado) e um inimigo.
 * - `side` / `enemy`: os dois dados rolados por cada lado.
 * - `sideStrength` / `enemyStrength`: Força de Ataque de cada lado (dados + HABILIDADE + modificadores).
 * - `result`: "hit" quando o lado fere o inimigo, "hurt" quando o inimigo fere o lado, "tie" quando empatam.
 * - `stingDie`: o dado do ferrão, rolado só quando o inimigo fere e o combate tem ferrão.
 * - `stung`: se o ferimento do inimigo foi uma ferroada (dado 5 ou 6).
 */
export type Exchange = { side: Dice; enemy: Dice; sideStrength: number; enemyStrength: number; result: "hit" | "hurt" | "tie"; stingDie?: number; stung?: boolean };

/** Dano padrão de um ferimento, pelas regras do livro: 2 pontos de ENERGIA. */
const BASE_DAMAGE = 2;

/**
 * HABILIDADE do inimigo nesta série (contando a partir de 1), considerando uma magia que o enfraquece por algumas séries.
 * @param base HABILIDADE normal do inimigo.
 * @param round número da série atual.
 * @param recovered se o inimigo já se recuperou da magia (dado par na regra `recover: "even"`).
 */
export function enemySkill(c: Combat, base: number, round: number, recovered: boolean): number {
  const w = c.weakened;
  if (!w) return base;
  // Ainda dentro das séries em que a magia faz efeito.
  if (round <= w.rounds) return w.skill;
  // Depois disso, com `recover: "even"`, só volta ao normal quando o dado der par.
  return w.recover === "even" && !recovered ? w.skill : base;
}

/** HABILIDADE do leitor neste combate (a magia BIG a dobra). */
export const playerSkill = (c: Combat, skill: number) => (c.doubleSkill ? skill * 2 : skill);

/** Dano de um ferimento causado pelo leitor, antes de testar a sorte. */
export const playerDamage = (c: Combat) => c.damage ?? BASE_DAMAGE;

/** Sorte depois de um ferimento que o leitor causou: com sorte dobra o dano, com azar o reduz pela metade (2 → 4 ou 1, como nas regras). */
export const luckyDamage = (c: Combat, lucky: boolean) => (lucky ? playerDamage(c) : -playerDamage(c) / 2);

/** Sorte depois de um ferimento que o leitor sofreu, como ENERGIA devolvida: com sorte o dano cai para 1, com azar sobe para 3. */
export const luckyWound = (lucky: boolean) => (lucky ? 1 : -1);

/**
 * Resolve uma Série de Ataque. `sideMod` é tudo que se soma à rolagem do lado (ficha, arma, regra do texto);
 * combates de aliado ignoram os modificadores do leitor. O dado do ferrão só é rolado quando o inimigo fere e o combate tem ferrão.
 * @param sideSkill HABILIDADE de quem ataca pelo lado do leitor.
 * @param enemySkillNow HABILIDADE atual do inimigo (já considerando enfraquecimentos).
 * @param roll função que rola um dado; recebida como parâmetro para os testes poderem usar dados fixos.
 */
export function exchange(c: Combat, sideSkill: number, sideMod: number, enemySkillNow: number, roll: () => number): Exchange {
  const side = [roll(), roll()] as const;
  const enemy = [roll(), roll()] as const;
  const sideStrength = side[0] + side[1] + sideSkill + sideMod;
  const enemyStrength = enemy[0] + enemy[1] + enemySkillNow + (c.enemyRoll ?? 0);
  const result = sideStrength > enemyStrength ? "hit" : enemyStrength > sideStrength ? "hurt" : "tie";
  const ex: Exchange = { side, enemy, sideStrength, enemyStrength, result };
  if (result === "hurt" && c.sting) {
    // O inimigo feriu e tem ferrão: um dado de 5 ou 6 transforma o golpe em ferroada.
    const stingDie = roll();
    return { ...ex, stingDie, stung: stingDie >= 5 };
  }
  return ex;
}

/**
 * Quanto um ferimento do inimigo tira da ENERGIA do alvo; uma ferroada com `kill` tira tudo.
 * @param targetStamina ENERGIA atual do alvo (usada quando a ferroada mata).
 * @param luckSaved se um teste de sorte bem-sucedido transformou a ferroada em ferimento normal.
 */
export function woundTaken(c: Combat, ex: Exchange, targetStamina: number, luckSaved = false): number {
  if (ex.result !== "hurt") return 0;
  if (!ex.stung || luckSaved) return BASE_DAMAGE;
  return c.sting!.kill ? targetStamina : c.sting!.damage;
}

/** Rola dois dados por inimigo antes do combate; os que tirarem pelo menos a própria HABILIDADE fogem. */
export function rollFlee(enemies: Fighter[], roll: () => number) {
  return enemies.map((e) => {
    const dice = [roll(), roll()] as const;
    return { enemy: e, dice, fled: dice[0] + dice[1] >= e.skill };
  });
}

/** Se a fuga que o texto oferece está disponível agora (conforme a ENERGIA do inimigo e a do leitor). */
export function canEscape(c: Combat, enemyStamina: number, stamina: number): boolean {
  const e = c.escape;
  if (!e) return false;
  return enemyStamina <= (e.enemyAtMost ?? Infinity) && stamina >= (e.playerAtLeast ?? -Infinity);
}

/** Os aliados do leitor: um só, ou quantos ele escolheu criar (numerados quando houver mais de um). */
export function makeAllies(c: Combat, count = 1): Fighter[] {
  const a = c.ally;
  if (!a) return [];
  const n = a.choose ? count : 1;
  return Array.from({ length: n }, (_, i) => ({ name: n > 1 ? `${a.name} ${i + 1}` : a.name, skill: a.skill, stamina: a.stamina }));
}

/** Armas da ficha que têm modificador definido no texto (ex.: o machado de Glandragor, −1), além da espada comum. */
export function weaponOptions(s: GameState): { label: string; attack: number }[] {
  const options = [{ label: "Espada comum", attack: 0 }];
  for (const item of s.items) {
    // Reconhece a arma pelo nome do item, sem diferenciar maiúsculas e minúsculas.
    const name = (typeof item === "string" ? item : item.name).toLocaleLowerCase("pt-BR");
    const w = WEAPONS.find((w) => w.match.some((m) => name.includes(m)));
    if (w) options.push({ label: itemLabel(item), attack: w.attack });
  }
  return options;
}
