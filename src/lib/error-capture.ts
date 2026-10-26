// Guarda o erro original por fora do fluxo normal, para que o server.ts consiga recuperar a pilha
// quando o h3 já engoliu o erro e o transformou numa resposta 500 genérica.

/** Último erro capturado e o momento da captura. */
let lastCapturedError: { error: unknown; at: number } | undefined;
/** Tempo (ms) em que o erro capturado continua valendo; depois disso é descartado. */
const TTL_MS = 5_000;

/** Guarda o erro como o último capturado. */
function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// O HTTPError do h3 vira {"status":500,"unhandled":true,"message":"HTTPError"} ao ser serializado —
// sem pilha e sem causa — então um console.error(error) simples chega aos logs sem os detalhes
// da falha. Por isso os erros são expandidos num texto com a mensagem, a pilha e toda a cadeia de causas.
/** Quantos níveis de `cause` são incluídos na descrição. */
const CAUSE_DEPTH_LIMIT = 5;
/** Tamanho máximo (em caracteres) da descrição do erro. */
const DESCRIPTION_LENGTH_LIMIT = 8_000;

/** Descreve um erro como texto: pilha (ou nome e mensagem), status HTTP e as causas encadeadas. */
export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

/** Texto " (status N)" quando o erro traz um código HTTP em `status` ou `statusCode`. */
function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

/** Converte qualquer valor em texto sem lançar erro (ex.: objetos com referências circulares). */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Se o valor é uma instância de Error. */
function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

// Envolve o console.error para que erros registrados por qualquer camada — inclusive o log interno
// de erros não tratados do h3, que este arquivo não consegue interceptar diretamente — sejam
// guardados para o consumeLastCapturedError e expandidos antes de serem serializados.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

// Também guarda erros globais e promessas rejeitadas sem tratamento, quando o ambiente oferece esses eventos.
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

/** Devolve (e esquece) o último erro capturado, se ele tiver ocorrido há menos de TTL_MS. */
export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
