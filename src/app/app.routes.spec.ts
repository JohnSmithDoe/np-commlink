import { Route, Routes } from '@angular/router';
import { routes } from './app.routes';
import { DECK_CATALOG } from './commlink/model/deck.catalog';

/**
 * The deck catalog names 15 cross-domain URLs as plain strings, and the route
 * table that has to answer them is assembled from eleven domain manifests behind
 * `loadChildren` — so nothing but a test can tell that the two still agree, and a
 * renamed path would otherwise surface as a dead tile.
 *
 * It lives in the shell rather than in `commlink` because Sheriff seals a domain
 * off from the composition root: `domain:commlink` may not import `app.routes`,
 * while the shell may name a domain's model.
 */
const segmentsOf = (path: string): string[] => path.split('/').filter(Boolean);

const isTerminal = (route: Route): boolean =>
  !!route.component || !!route.loadComponent || !!route.redirectTo;

const childrenOf = async (route: Route): Promise<Routes> => {
  if (route.children) return route.children;
  if (!route.loadChildren) return [];
  // Every manifest resolves to a `Routes` array; `loadComponent` is never
  // invoked, so this walks the table without instantiating a single page.
  return (await route.loadChildren()) as Routes;
};

const reachablePaths = async (
  candidates: Routes,
  prefix: string[] = []
): Promise<string[][]> => {
  const nested = await Promise.all(
    // The `**` fallback would match every URL, including a misspelled one.
    candidates
      .filter((route) => route.path !== '**')
      .map(async (route) => {
        const here = [...prefix, ...segmentsOf(route.path ?? '')];
        const deeper = await reachablePaths(await childrenOf(route), here);
        return isTerminal(route) ? [here, ...deeper] : deeper;
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
        !reachable.some((pattern) => matches(pattern, segmentsOf(entry.route)))
    ).map((entry) => `${entry.id} → ${entry.route}`);

    expect(unresolved).toEqual([]);
  });

  it('lands an unknown URL on the deck', () => {
    const fallback = routes.at(-1);

    expect(fallback?.path).toBe('**');
    expect(fallback?.redirectTo).toBe('commlink');
  });
});
