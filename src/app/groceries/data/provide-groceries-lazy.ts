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
 * The shell orchestrators (`GroceryListEffects`, `ItemDialogsEffects`) stay
 * eager at the composition root: they are `type:shell` bridges spanning BOTH
 * groceries and tasks (one generic effect routes all four lists), so they
 * can't live in a domain's data layer, and registering one shared class in
 * both route injectors would double-dispatch across a grocery↔tasks
 * transition. They only *react* to grocery/tasks actions (which fire only
 * while a grocery/tasks route is active) and read the matching slice via
 * `withLatestFrom`, so the slice is always present when they run. The grocery
 * SAVE, by contrast, is own-data and rides here lazily (GrocerySaveEffects).
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
    // Dashboard reporters ride with their slices: registered here (not eagerly)
    // so their store.select never reads an unregistered sibling. On route entry
    // each fires its first `report`, flipping the tile standby→online; the
    // cold-launch value comes from the persisted summary.
    ProductsTelemetryEffects,
    ShoppingTelemetryEffects,
    StorageTelemetryEffects
  ),
];
