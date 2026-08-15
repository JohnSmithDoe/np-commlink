/* ─── why ─────────────────────────────────────────────────────────
 * The router is the one state two sealed domains must read the same way.
 * It lived in `household/data/` until tasks needed it and Sheriff was
 * right to refuse: a domain reaching into another for a selector about
 * the URL is a seal break. Router state is kernel state.
 *
 * `@ngrx/router-store` is read-only by design. Causing navigation is a
 * write, so it goes through an action plus an effect that calls `Router`
 * — see `category-filter.effects.ts`.
 *
 * A repeated query param arrives as an array the drill never writes;
 * narrowing it to `undefined` rather than taking the first entry keeps a
 * hand-edited URL from half-applying.
 *
 * `selectRouteData` is the seam for what the ROUTE DEFINITION fixes
 * rather than the URL: repeating a known segment as `:listId` made
 * `/household/storage/_storage` promise an instance id the closed
 * `HouseholdListId` union cannot supply.
 * ───────────────────────────────────────────────────────────────── */

import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoryId } from '../../model/category.types';
import { CATEGORY_FILTER_PARAM } from '../../util/item-lists/category-filter.route';

const selectRouter = createFeatureSelector<RouterReducerState>('router');

const { selectRouteParams, selectRouteData, selectQueryParam } =
  getRouterSelectors(selectRouter);

export { selectRouteParams, selectRouteData };

export const selectRouteCategoryFilter = createSelector(
  selectQueryParam(CATEGORY_FILTER_PARAM),
  (value): CategoryId | undefined =>
    typeof value === 'string' ? value : undefined
);
