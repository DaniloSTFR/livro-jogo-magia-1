import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

/**
 * Middleware do servidor que captura erros inesperados e devolve a página de erro (status 500).
 * Erros que já têm `statusCode` (ex.: redirecionamentos, 404) seguem adiante sem alteração.
 */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// O TanStack Start instala este middleware automaticamente quando src/start.ts não existe;
// definir o arquivo desativa isso, então ele é adicionado de novo aqui para manter as
// funções de servidor protegidas contra requisições de outros sites (CSRF).
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/** Configuração do TanStack Start: middlewares aplicados a toda requisição, na ordem da lista. */
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
