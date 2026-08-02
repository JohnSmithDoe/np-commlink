/* ─── why ─────────────────────────────────────────────────────────
 * Drilling from a category into its list is one contract carried by a
 * query-param name: the catalog facade writes it, four list pages read
 * it, and until this file the string `'filter'` was spelled out in all
 * five with nothing linking them. Renaming it in the writer would have
 * left four readers silently finding nothing — the same shape as a
 * composed i18n key, and just as invisible to every gate.
 *
 * The `ionViewWillEnter` hook itself deliberately stays in each page.
 * `IonicRouteStrategy` caches a routed component, so `ngOnInit` fires
 * once per session while the drill can happen repeatedly; and the hook
 * only fires on the component the router actually mounted, which is the
 * page and not the `app-list-page` inside it. What is shared here is the
 * contract, not the lifecycle.
 * ───────────────────────────────────────────────────────────────── */

import { ActivatedRoute } from '@angular/router';
import { CategoryId } from '../../model/category.types';
import { ListPageFacade } from './list-page.facade';

const CATEGORY_FILTER_PARAM = 'filter';

export const categoryFilterQueryParameters = (
  id: CategoryId
): Record<string, CategoryId> => ({ [CATEGORY_FILTER_PARAM]: id });

export const applyCategoryFilterFromRoute = (
  route: ActivatedRoute,
  facade: Pick<ListPageFacade, 'selectCategory'>
): void => {
  const filter = route.snapshot.queryParamMap.get(CATEGORY_FILTER_PARAM);
  if (filter) facade.selectCategory(filter);
};
