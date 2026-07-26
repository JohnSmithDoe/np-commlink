import { provideState } from '@ngrx/store';
import {
  mergeContexts,
  providePersistedContext,
} from '../../@shared/data/persisted-context.provider';
import { createMetric } from '../../@shared/data/effects/persisted-slice.effects.factory';
import { GroceriesActions } from './actions/groceries.actions';
import { ListSettingsActions } from './actions/list-settings.actions';
import { groceriesReducer } from './reducer/groceries.reducer';
import { quickAddReducer } from './reducer/quick-add.reducer';
import { GroceryListEffects } from './effects/grocery-list.effects';
import { ListSettingsEffects } from './effects/list-settings.effects';
import { ShoppingEffects } from './effects/shopping.effects';
import { StorageEffects } from './effects/storage.effects';
import { selectGroceriesState } from './selectors/groceries.selector';
import { selectProductCount } from './selectors/products.selector';
import { selectRecipeCount } from './selectors/recipes.selector';
import { selectActiveShoppingCount } from './selectors/shopping.selector';
import { selectLowStockCount } from './selectors/storage.selector';

/**
 * The whole grocery bounded context — every grocery route spreads this one
 * bundle: the three lists, the catalog page, `/list-settings` and SOYKAF.
 *
 * Its aggregates cross-read each other (the search buckets join the three lists,
 * the recipe matcher joins products with storage), so they are ONE slice in ONE
 * persisted doc with ONE atomic `[Groceries] loaded` — a route cannot enter with
 * a sibling missing, and there is no per-aggregate lifecycle left to sequence.
 * That is also what lets the context ride `providePersistedContext` like every
 * other one: with a single slice, its persistence is a plain slice dump again.
 *
 * `quickAdd` is the deliberate exception to the one-slice rule: it is derived,
 * ephemeral state (recomputed by the engine on enterPage/search) that must never
 * be persisted, so it registers as its own reducer with no lifecycle.
 */
export const groceriesContext = mergeContexts(
  providePersistedContext({
    key: 'groceries',
    reducer: groceriesReducer,
    lifecycle: GroceriesActions,
    select: selectGroceriesState,
    // Every action group that mutates an aggregate of the slice. Categories are
    // one catalog shared by the three lists, and `[Recipes]` rides here because
    // recipes are an aggregate too — a product delete cascading into them
    // therefore persists without a rule of its own.
    //
    // `[ListSettings]` is named per action instead: `toggleFlag` is a request
    // that its own effect answers with `updateSettings`, so persisting on the
    // request too would write the pre-toggle flags.
    save: {
      sources: [
        '[Products]',
        '[Shopping]',
        '[Storage]',
        '[GroceryCategories]',
        '[Recipes]',
      ],
      on: [ListSettingsActions.updateSettings],
    },
    // Four deck tiles off one slice. Each reporter fires its first `report` on
    // subscription, flipping its tile standby->online; the cold-launch value
    // comes from the persisted summary.
    telemetry: [
      {
        source: 'products',
        select: selectProductCount,
        metrics: createMetric('count'),
      },
      {
        source: 'shopping',
        select: selectActiveShoppingCount,
        metrics: createMetric('active'),
      },
      {
        source: 'storage',
        select: selectLowStockCount,
        metrics: createMetric('low'),
      },
      {
        source: 'recipes',
        select: selectRecipeCount,
        metrics: createMetric('count'),
      },
    ],
    // The multi-list engine is grocery-scoped (tasks and tracking each own a
    // switch-free copy, so a cross-domain transition cannot double-dispatch).
    effects: [
      GroceryListEffects,
      ShoppingEffects,
      StorageEffects,
      ListSettingsEffects,
    ],
  }),
  { providers: [provideState('quickAdd', quickAddReducer)], resolve: {} }
);
