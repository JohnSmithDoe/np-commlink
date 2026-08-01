import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector } from '@ngrx/store';

/**
 * Feature selector for the @ngrx/router-store slice (registered as `router` in
 * main.ts). Re-exports the standard router selectors so features can derive the
 * active list from the `:listId` route param instead of holding a `dataViewId`
 * in state — see the grocery engine's `selectListIdParameter`, the only consumer.
 */
const selectRouter = createFeatureSelector<RouterReducerState>('router');

// Only what something reads. The full ten were re-exported on the assumption a
// feature would want them; eight never found a caller, and an unused re-export
// is indistinguishable from a supported one until someone tries to remove it.
export const { selectRouteParams, selectUrl } =
  getRouterSelectors(selectRouter);
