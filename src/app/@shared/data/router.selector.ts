import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector } from '@ngrx/store';

/**
 * Feature selector for the @ngrx/router-store slice (registered as `router` in
 * main.ts). Re-exports the standard router selectors so features can derive the
 * active list from the `:listId` route param instead of holding a `dataViewId`
 * in state. Consumed by the shared item-list selector (see item-list.selector).
 */
export const selectRouter = createFeatureSelector<RouterReducerState>('router');

export const {
  selectCurrentRoute,
  selectFragment,
  selectQueryParams,
  selectQueryParam,
  selectRouteParams,
  selectRouteParam,
  selectRouteData,
  selectRouteDataParam,
  selectUrl,
  selectTitle,
} = getRouterSelectors(selectRouter);
