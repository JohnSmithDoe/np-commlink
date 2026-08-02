import { Route, Routes } from '@angular/router';
import { routes } from './app.routes';
import { DECK_CATALOG } from './commlink/model/deck.catalog';

const segmentsOf = (path: string): string[] => path.split('/').filter(Boolean);
const isTerminal = (route: Route): boolean =>
  !!route.component || !!route.loadComponent || !!route.redirectTo;

const childrenOf = async (route: Route): Promise<Routes> => {
  if (route.children) return route.children;
  if (!route.loadChildren) return [];
  return (await route.loadChildren()) as Routes;
};

type ReachablePage = { pattern: string[]; title?: string };

const titleOf = (route: Route): string | undefined =>
  typeof route.title === 'string' ? route.title : undefined;

const reachablePaths = async (
  candidates: Routes,
  prefix: string[] = [],
  inherited?: string
): Promise<ReachablePage[]> => {
  const nested = await Promise.all(
    candidates
      .filter((route) => route.path !== '**')
      .map(async (route) => {
        const here = [...prefix, ...segmentsOf(route.path ?? '')];
        const title = titleOf(route) ?? inherited;
        const deeper = await reachablePaths(
          await childrenOf(route),
          here,
          title
        );
        return isTerminal(route)
          ? [{ pattern: here, title }, ...deeper]
          : deeper;
      })
  );
  return nested.flat();
};

const matches = (pattern: string[], url: string[]): boolean =>
  pattern.length === url.length &&
  pattern.every(
    (segment, index) => segment.startsWith(':') || segment === url[index]
  );

describe('app route table', () => {
  it('resolves every deck catalog route to a page', async () => {
    const reachable = await reachablePaths(routes);

    const unresolved = DECK_CATALOG.filter(
      (entry) =>
        !reachable.some((page) =>
          matches(page.pattern, segmentsOf(entry.route))
        )
    ).map((entry) => `${entry.id} → ${entry.route}`);

    expect(unresolved).toEqual([]);
  });

  it('agrees with each route on the page title', async () => {
    const reachable = await reachablePaths(routes);

    const disagreements = DECK_CATALOG.flatMap((entry) => {
      const page = reachable.find((candidate) =>
        matches(candidate.pattern, segmentsOf(entry.route))
      );
      if (!page || page.title === entry.titleKey) return [];
      return [
        `${entry.id}: catalog says ${entry.titleKey}, route says ${page.title ?? '(no title)'}`,
      ];
    });

    expect(disagreements).toEqual([]);
  });

  it('lands an unknown URL on the deck', () => {
    const fallback = routes.at(-1);

    expect(fallback?.path).toBe('**');
    expect(fallback?.redirectTo).toBe('commlink');
  });
});
