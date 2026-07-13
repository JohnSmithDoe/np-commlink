import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { productsReducer } from './products.reducer';
import { ProductsEffects } from './products.effects';
import { shoppingReducer } from './shopping.reducer';
import { ShoppingEffects } from './shopping.effects';
import { storageReducer } from './storage.reducer';
import { StorageEffects } from './storage.effects';

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
 * Hydration is handled separately by `datastoreHydrationResolver` on the same
 * routes (co-hydration): the route injector registers these reducers during
 * route recognition, then the resolver re-dispatches the datastore load so all
 * three hydrate from persistence together.
 *
 * The shell orchestrators (`GroceryListEffects`, `ItemDialogsEffects`) and the
 * grocery save-on-change effect stay eager at the composition root: they only
 * *react* to grocery/tasks actions (which fire only while a grocery/tasks route
 * is active) and read the matching slice via `withLatestFrom`, so the slice is
 * always present when they run.
 */
export const groceriesLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('products', productsReducer),
  provideState('shopping', shoppingReducer),
  provideState('storage', storageReducer),
  provideEffects(ProductsEffects, ShoppingEffects, StorageEffects),
];
