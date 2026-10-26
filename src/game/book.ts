import data from "./book.json";

/** Os três atributos do personagem: ENERGIA (`stamina`), HABILIDADE (`skill`) e SORTE (`luck`). */
export type StatKey = "stamina" | "skill" | "luck";
/**
 * Um efeito do texto sobre um atributo.
 * - `stat`: atributo afetado.
 * - `amount`: quanto soma (positivo) ou subtrai (negativo).
 * - `auto`: se é aplicado automaticamente ao entrar no parágrafo; senão vira um botão que o leitor aplica se a situação se encaixar.
 * - `text`: trecho do livro que descreve o efeito.
 * - `repeatable`: efeito condicional que o texto pode aplicar várias vezes (ex.: a cada teste de sorte que falhar).
 */
export type BookEffect = { stat: StatKey; amount: number; auto: boolean; text: string; repeatable?: boolean };
/**
 * Uma escolha que leva a outro parágrafo.
 * - `to`: número do parágrafo de destino.
 * - `label`: texto do botão.
 * - `spell`: código da magia lançada por esta escolha (só aparece para magos).
 * - `libra`: escolha que invoca a Deusa Libra (gasta o uso único dela).
 * - `libraUsedOnly`: mostrada só depois que Libra foi invocada (o desfecho do texto quando a ajuda dela não está mais disponível).
 * - `diceDeath`: uma morte que o texto aplica conforme um resultado de dados que o leitor rola (ex.: um duplo seis).
 */
export type BookChoice = { to: number; label: string; spell?: string; libra?: boolean; libraUsedOnly?: boolean; diceDeath?: boolean };
/** Um objeto com um número gravado; alguns parágrafos mandam o leitor para uma referência calculada a partir dele. */
export type NumberedItem = { name: string; kind: string; number: number };
/** `numberedItem`: o parágrafo deixa o leitor usar um item do tipo `kind`, indo para o número dele + `offset`. */
export type NumberedItemUse = { kind: string; offset: number; label: string };
/** Um inimigo: nome, HABILIDADE e ENERGIA. */
export type Enemy = { name: string; skill: number; stamina: number };
/** Uma criatura que luta pelo leitor; `choose`: o leitor escolhe quantas criar (ex.: uma por dente), pagando `cost` de ENERGIA por cada. */
export type Ally = Enemy & { choose?: { cost: number } };
/**
 * Um combate como o texto descreve. Os padrões seguem as regras: o leitor enfrenta um inimigo de cada vez e cada ferimento tira 2.
 * - `enemies`: os inimigos do combate. `win`: parágrafo para onde ir ao vencer.
 * - `mode: "ally"`: o leitor assiste `ally` lutar; com `allyLost: "self"` o leitor termina a luta se o aliado cair,
 *   senão as próprias escolhas do parágrafo dizem o que acontece.
 * - `together`: todos os inimigos atacam a cada série; o leitor só fere aquele que escolher como alvo.
 * - `rules`: a regra especial do texto, exibida na janela de combate.
 * - `damage`: quanto cada ferimento do leitor tira (4 com uma espada afiada por magia).
 * - `playerRoll` / `enemyRoll`: somados à rolagem de dados para a Força de Ataque. `doubleSkill`: a HABILIDADE do leitor conta em dobro.
 * - `weakened`: o inimigo luta com `skill` nas primeiras `rounds` séries; com `recover: "even"` um dado é rolado
 *   antes de cada série seguinte e só um resultado par devolve a HABILIDADE dele.
 * - `sting`: cada vez que o inimigo fere, um dado de 5–6 tira `damage` em vez disso (ou mata um aliado com `kill`); com
 *   `luckSaves` um teste de sorte bem-sucedido transforma a ferroada de volta em ferimento normal.
 * - `flee`: antes do combate dois dados são rolados por inimigo; um resultado de pelo menos a HABILIDADE dele o faz fugir; se todos fugirem, vá para `to`.
 * - `escape`: a saída que o texto oferece durante o combate, opcionalmente só quando a ENERGIA do inimigo é no máximo
 *   `enemyAtMost` e a do leitor pelo menos `playerAtLeast`; `penalty` é a ENERGIA que ela custa.
 */
export type Combat = {
  enemies: Enemy[];
  win: number;
  mode?: "ally";
  ally?: Ally;
  allyLost?: "self";
  together?: boolean;
  rules?: string;
  damage?: number;
  playerRoll?: number;
  enemyRoll?: number;
  doubleSkill?: boolean;
  weakened?: { skill: number; rounds: number; recover?: "even" };
  sting?: { damage: number; kill?: boolean; luckSaves?: boolean };
  flee?: { to: number };
  escape?: { to: number; label: string; penalty?: number; enemyAtMost?: number; playerAtLeast?: number };
};
/**
 * Uma arma à qual o texto dá um modificador de Força de Ataque, reconhecida pelo nome do item (ex.: o machado de Glandragor, −1).
 * - `match`: trechos de nome (em minúsculas) que identificam a arma.
 * - `attack`: modificador de Força de Ataque. `paragraph`: parágrafo do livro que define o modificador.
 */
export type Weapon = { match: string[]; attack: number; paragraph: number };
/** O texto deixa o leitor comer Provisões aqui: `stamina` na primeira refeição do dia, `alreadyAte` se ele já comeu. */
export type Meal = { stamina: number; alreadyAte?: number };
/** Um preço fixo que o texto cita neste parágrafo: `gold` em Peças de Ouro e `label` com a descrição. */
export type Cost = { gold: number; label: string };
/**
 * Um parágrafo (referência) do livro.
 * - `id`: número do parágrafo. `text`: texto narrativo (trechos entre `**` aparecem em negrito).
 * - `choices`: escolhas que levam a outros parágrafos. `effects`: efeitos sobre os atributos.
 * - `combat`: combate do parágrafo, se houver. `luckTest`: teste de sorte com o destino do sortudo e do azarado.
 * - `gainItems`: itens numerados que o leitor pode guardar. `numberedItem`: uso de um item numerado para seguir.
 * - `meal`: se e quanto o leitor pode comer aqui. `costs`: preços citados no texto.
 * - `luckFree`: mostra um botão de teste de sorte livre (sem destino fixo).
 * - `back`: mostra o botão para voltar à referência anterior.
 * - `end`: fim da aventura, com vitória ("win") ou morte ("death").
 */
export type BookParagraph = {
  id: number;
  text: string;
  choices: BookChoice[];
  effects: BookEffect[];
  combat?: Combat;
  luckTest?: { lucky: number; unlucky: number };
  gainItems?: NumberedItem[];
  numberedItem?: NumberedItemUse;
  meal?: Meal;
  costs?: Cost[];
  luckFree?: boolean;
  back?: boolean;
  end?: "win" | "death";
};
/** Um monstro do bestiário, com os parágrafos (`paragraphs`) em que ele aparece. */
export type Monster = Enemy & { paragraphs: number[] };

/** Número reservado para o parágrafo de morte (não existe no livro; é gerado pelo jogo). */
export const DEATH_ID = 0;
/** Parágrafo final de vitória do livro. */
export const WIN_ID = 456;

/** Parágrafo de morte usado quando a ENERGIA do leitor chega a zero. */
const DEATH: BookParagraph = {
  id: DEATH_ID,
  text: "Sua aventura termina aqui. Os perigos das Montanhas de Shamutanti foram demais para você, e sua visão escurece nas encostas.",
  choices: [],
  effects: [],
  end: "death",
};

/** Todos os parágrafos do `book.json`, indexados pelo número (como texto). */
const BOOK = (data as unknown as { paragraphs: Record<string, BookParagraph> }).paragraphs;
/** Lista de monstros exibida no bestiário. */
export const MONSTERS = (data as unknown as { monsters: Monster[] }).monsters;
/** Armas com modificador de Força de Ataque definido pelo texto. */
export const WEAPONS = (data as unknown as { weapons: Weapon[] }).weapons;

/** Todos os parágrafos para os quais um combate pode levar, além das próprias escolhas do parágrafo. */
export const combatExits = (c: Combat) => [c.win, ...(c.flee ? [c.flee.to] : []), ...(c.escape ? [c.escape.to] : [])];

/** Tipos de itens numerados que o livro entrega ou pede (ex.: "chave"). */
export const ITEM_KINDS = [...new Set(Object.values(BOOK).flatMap((p) => [
  ...(p.gainItems ?? []).map((i) => i.kind),
  ...(p.numberedItem ? [p.numberedItem.kind] : []),
]))];

/** Parágrafos alcançados ao invocar Libra — entrar em um deles consome o uso único. */
export const LIBRA_TARGETS = new Set<number>(
  Object.values(BOOK).flatMap((p) => p.choices.filter((c) => c.libra).map((c) => c.to)),
);

/** Se o parágrafo `id` existe no livro. */
export function hasParagraph(id: number): boolean {
  return BOOK[String(id)] !== undefined;
}

/** Busca um parágrafo pelo número; devolve o parágrafo de morte para `DEATH_ID` e o parágrafo 1 se o número não existir. */
export function getParagraph(id: number): BookParagraph {
  if (id === DEATH_ID) return DEATH;
  return BOOK[String(id)] ?? BOOK["1"]!;
}

/** Nome de cada atributo como aparece na ficha. */
export const STAT_LABEL: Record<StatKey, string> = { stamina: "ENERGIA", skill: "HABILIDADE", luck: "SORTE" };
