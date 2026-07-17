import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { productsReducer } from './products.reducer';
import { ProductsEffects } from './products.effects';
import { shoppingReducer } from './shopping.reducer';
import { ShoppingEffects } from './shopping.effects';
import { storageReducer } from './storage.reducer';
import { StorageEffects } from './storage.effects';
import { ShoppingTelemetryEffects } from './shopping-telemetry.effects';
import { StorageTelemetryEffects } from './storage-telemetry.effects';
import { ProductsTelemetryEffects } from './products-telemetry.effects';
import { GroceriesLoadEffects } from './groceries-load.effects';
import { GrocerySaveEffects } from './grocery-save.effects';
import { GroceryListEffects } from './grocery-list/grocery-list.effects';
import { GroceryItemDialogsEffects } from './grocery-list/grocery-item-dialogs.effects';

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
 * The multi-list ENGINE now rides here too: `GroceryListEffects` (routes the
 * generic GroceryListActions to the concrete P/S/S groups + the cross-list
 * copy rules) and `GroceryItemDialogsEffects` (the edit/category-dialog
 * orchestration + product flow). They were eager shell orchestrators spanning
 * all four lists; they are now scoped to the three grocery lists and folded
 * into this domain (tasks got its own switch-free copy — TasksListEffects /
 * TasksItemDialogsEffects — in tasksLazyProviders). Splitting into per-domain
 * classes is what lets them go lazy: one shared class in both the grocery and
 * tasks route injectors would double-dispatch across a grocery↔tasks
 * transition. The grocery SAVE is own-data and rides here too (GrocerySaveEffects).
 */
export const groceriesLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('products', productsReducer),
  provideState('shopping', shoppingReducer),
  provideState('storage', storageReducer),
  provideEffects(
    // Own-data load: reads the three grocery keys on route entry and emits one
    // atomic GroceriesActions.loaded (hydration driven by moduleHydrationResolver).
    GroceriesLoadEffects,
    // Own-data save: persists the P/S/S slice named by the action-source prefix
    // (moved off the eager shell — lazy-modules Phase E).
    GrocerySaveEffects,
    ProductsEffects,
    ShoppingEffects,
    StorageEffects,
    // The multi-list engine + dialog orchestration (grocery-scoped), folded off
    // the eager shell (lazy-modules §2b).
    GroceryListEffects,
    GroceryItemDialogsEffects,
    // Dashboard reporters ride with their slices: registered here (not eagerly)
    // so their store.select never reads an unregistered sibling. On route entry
    // each fires its first `report`, flipping the tile standby→online; the
    // cold-launch value comes from the persisted summary.
    ProductsTelemetryEffects,
    ShoppingTelemetryEffects,
    StorageTelemetryEffects
  ),
];
