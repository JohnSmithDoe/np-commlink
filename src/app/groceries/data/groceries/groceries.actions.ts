import { createActionGroup, emptyProps } from '@ngrx/store';
import { IGroceriesState } from '../../model/groceries.types';

// The grocery bounded context's hydration lifecycle — the ONE `load`/`loaded`
// pair for the whole context, because its aggregates are one slice in one
// persisted doc. The route's moduleHydrationResolver dispatches `load` on entry
// and the descriptor's generic load effect answers with `loaded`, so no reducer
// can observe a half-hydrated sibling.
export const GroceriesActions = createActionGroup({
  source: 'Groceries',
  events: {
    load: emptyProps(),
    loaded: (data: IGroceriesState | null) => ({ data }),
  },
});
