/** Opções de um relato de erro ao Lovable: como foi capturado, se foi tratado e a gravidade. */
type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/** API de eventos que o editor do Lovable injeta na página (rastreamento e captura de exceções). */
type LovableEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

// Declara no `window` os ganchos opcionais que o Lovable injeta (só existem dentro do editor).
declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

/**
 * Envia ao Lovable um erro capturado pela página de erro do React, com a rota atual e um contexto extra.
 * Não faz nada fora do navegador ou fora do editor do Lovable.
 */
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
  // Em produção o React não relança para o window.onerror os erros capturados pela página de erro,
  // então a telemetria do editor nunca os veria. Por isso eles são repassados ao gancho de relato do
  // lovable.js, que só existe dentro da pré-visualização do editor.
  // Loaders e funções de servidor costumam lançar uma Response crua; String(ela) dá o texto opaco
  // "[object Response]", então o status e a URL são extraídos no lugar.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  window.__lovableReportRuntimeError?.({
    message,
    ...(stack !== undefined && { stack }),
    filename: window.location.pathname,
  });
}
