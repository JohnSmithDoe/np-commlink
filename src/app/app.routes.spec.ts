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

/** A reachable page: the pattern its URL matches, and the title it will show. */
type TReachablePage = { pattern: string[]; title?: string };

// `title` is the router's own property (it also accepts a resolver, which no
// manifest here uses), not a `data` entry — which is what makes `buildTitle`
// find it. See AppTitleStrategy.
const titleOf = (route: Route): string | undefined =>
  typeof route.title === 'string' ? route.title : undefined;

const reachablePaths = async (
  candidates: Routes,
  prefix: string[] = [],
  inherited?: string
): Promise<TReachablePage[]> => {
  const nested = await Promise.all(
    // The `**` fallback would match every URL, including a misspelled one.
    candidates
      .filter((route) => route.path !== '**')
      .map(async (route) => {
        const here = [...prefix, ...segmentsOf(route.path ?? '')];
        // Deepest wins, which is how `AppTitleStrategy` resolves it — so a
        // componentless subtree root can carry a title its children override.
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

  /**
   * A catalog entry's `titleKey` and its route's own `title` are two
   * declarations of one fact, in files Sheriff keeps apart — `commlink/model` may
   * not read a sibling's manifest. Nothing but this can notice them drifting, and
   * the failure is quiet in both directions: the deck-config page lists the
   * catalog's key while the toolbar and `AppTitleStrategy` render the route's, so
   * one page starts naming a screen something no other page calls it.
   *
   * `deck.catalog.spec.ts` already checks each key EXISTS in the bundles — a
   * translated key can still be the wrong key.
   */
  it('agrees with each route on the page title', async () => {
    const reachable = await reachablePaths(routes);

    const disagreements = DECK_CATALOG.flatMap((entry) => {
      const page = reachable.find((candidate) =>
        matches(candidate.pattern, segmentsOf(entry.route))
      );
      // An unresolvable route is the test above's business, not this one's.
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
