import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Cria o roteador da aplicação (TanStack Router) com a árvore de rotas gerada a partir de `src/routes`.
 * Cada roteador recebe seu próprio `QueryClient` do React Query, repassado às rotas pelo contexto.
 */
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Restaura a posição de rolagem ao navegar para trás e para frente.
    scrollRestoration: true,
    // Dados pré-carregados são sempre considerados velhos (o React Query cuida do cache).
    defaultPreloadStaleTime: 0,
  });

  return router;
};
