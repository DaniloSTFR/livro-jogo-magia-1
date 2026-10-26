import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

/** Formato mínimo do ponto de entrada do servidor do TanStack Start: uma função `fetch` que responde requisições. */
type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

/** Promessa do ponto de entrada, guardada para que o módulo seja importado uma única vez. */
let serverEntryPromise: Promise<ServerEntry> | undefined;

/** Importa sob demanda (e só uma vez) o ponto de entrada do servidor do TanStack Start. */
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// O h3 engole os erros lançados dentro do handler e os transforma numa resposta 500 comum com corpo
// {"unhandled":true,"message":"HTTPError"} — só o try/catch nunca é acionado nesses casos.
// Esta função detecta essa resposta, registra o erro original e devolve a página de erro em HTML.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Se o corpo da resposta é o JSON genérico que o h3 gera quando engole um erro. */
function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/** Ponto de entrada do servidor: repassa a requisição ao TanStack Start e troca falhas pela página de erro. */
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
