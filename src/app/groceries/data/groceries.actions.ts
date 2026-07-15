import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IProductsState,
  IShoppingState,
  IStorageState,
} from '../../@shared/types';

// Grocery bounded-context hydration lifecycle (lazy-modules plan §2/§4). The
// three grocery aggregates cross-read each other, so they hydrate as ONE
// atomic unit: the route's moduleHydrationResolver dispatches `load` on entry,
// the grocery load effect reads all three keys, and `loaded` carries all three
// slices so every reducer hydrates together (no half-registered sibling).
export const GroceriesActions = createActionGroup({
  source: 'Groceries',
  events: {
    load: emptyProps(),
    loaded: (data: {
      products: IProductsState | null;
      shopping: IShoppingState | null;
      storage: IStorageState | null;
    }) => ({ data }),
  },
});
