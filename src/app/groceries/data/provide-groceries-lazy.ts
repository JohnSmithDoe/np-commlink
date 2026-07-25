import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { GroceriesActions } from './groceries.actions';
import { productsReducer } from './products.reducer';
import { shoppingReducer } from './shopping.reducer';
import { storageReducer } from './storage.reducer';
import { listSettingsReducer } from './list-settings/list-settings.reducer';
import { quickAddReducer } from './quick-add/quick-add.reducer';
import { ProductsEffects } from './effects/products.effects';
import { ShoppingEffects } from './effects/shopping.effects';
import { StorageEffects } from './effects/storage.effects';
import { ShoppingTelemetryEffects } from './effects/shopping-telemetry.effects';
import { StorageTelemetryEffects } from './effects/storage-telemetry.effects';
import { ProductsTelemetryEffects } from './effects/products-telemetry.effects';
import { GroceriesLoadEffects } from './effects/groceries-load.effects';
import { GrocerySaveEffects } from './effects/grocery-save.effects';
import { GroceryListEffects } from './effects/grocery-list.effects';
import { ListSettingsEffects } from './effects/list-settings.effects';
import { ListSettingsLoadEffects } from './effects/list-settings-load.effects';

/**
 * Lazy state + effects for the whole grocery bounded context, registered as ONE
 * unit on every grocery route (`shopping`/`storage`/`products`).
 *
 * The three aggregates cross-read each other (the search buckets in
 * `grocery-list.selector` read sibling slices, guarded by the eager
 * `listSettings` flags), so they MUST be co-registered — registering only the
 * route's own slice leaves the siblings `undefined` and crashes the selector
 * (the failure mode of the reverted lazy WIP). Using this same array on all
 * three routes guarantees that entering any one of them makes all three present.
 *
 * Hydration is handled separately by `moduleHydrationResolver(GroceriesActions.
 * load, .loaded)` on the same routes (co-hydration): the route injector
 * registers these reducers during route recognition, then the resolver
 * dispatches `[Groceries] load`; GroceriesLoadEffects reads only the three
 * grocery keys and emits one atomic `loaded` so all three hydrate together.
 *
 * The multi-list ENGINE now rides here too: `GroceryListEffects` routes the
 * generic GroceryListActions to the concrete P/S/S groups + the cross-list copy
 * rules. It was an eager shell orchestrator spanning all four lists; it is now
 * scoped to the three grocery lists and folded into this domain (tasks got its
 * own switch-free copy — TasksListEffects — in tasksLazyProviders). Splitting
 * into per-domain classes is what lets them go lazy: one shared class in both
 * the grocery and tasks route injectors would double-dispatch across a
 * grocery↔tasks transition. The grocery SAVE is own-data and rides here too
 * (GrocerySaveEffects). The dialogs need no effect at all any more — their
 * open-command is the root `ItemDialogHost` signal service.
 */
export const groceriesLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('products', productsReducer),
  provideState('shopping', shoppingReducer),
  provideState('storage', storageReducer),
  // Grocery-owned since the settings re-scope (were eager kernel slices in
  // @shared): the feature-flags the grocery selectors read (cross-list buckets +
  // quick-add gating) and the derived quick-add UI state. `listSettings`
  // hydrates via its own resolver key on the grocery routes; `quickadd` is
  // ephemeral (recomputed by the engine on enterPage/search — never persisted).
  provideState('listSettings', listSettingsReducer),
  provideState('quickadd', quickAddReducer),
  provideEffects(
    // Own-data load: reads the three grocery keys on route entry and emits one
    // atomic GroceriesActions.loaded (hydration driven by moduleHydrationResolver).
    GroceriesLoadEffects,
    // listSettings own-data load + toggle/save (the /list-settings page edits it).
    ListSettingsLoadEffects,
    ListSettingsEffects,
    // Own-data save: persists the P/S/S slice named by the action-source prefix
    // (moved off the eager shell — lazy-modules Phase E).
    GrocerySaveEffects,
    ProductsEffects,
    ShoppingEffects,
    StorageEffects,
    // The multi-list engine (grocery-scoped), folded off the eager shell
    // (lazy-modules §2b).
    GroceryListEffects,
    // Dashboard reporters ride with their slices: registered here (not eagerly)
    // so their store.select never reads an unregistered sibling. On route entry
    // each fires its first `report`, flipping the tile standby→online; the
    // cold-launch value comes from the persisted summary.
    ProductsTelemetryEffects,
    ShoppingTelemetryEffects,
    StorageTelemetryEffects
  ),
];

/**
 * Route hydration for the grocery context — one atomic `[Groceries] load/loaded`
 * co-hydrates all three lists. (The grocery `listSettings` slice hydrates on its
 * own key via `listSettingsHydrationResolver` — see provide-list-settings-lazy.)
 */
export const groceriesHydrationResolver = moduleHydrationResolver(
  GroceriesActions.load,
  GroceriesActions.loaded
);
