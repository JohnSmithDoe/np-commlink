import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { ListSettingsActions } from './list-settings/list-settings.actions';
import { listSettingsReducer } from './list-settings/list-settings.reducer';
import { ListSettingsEffects } from './effects/list-settings.effects';
import { ListSettingsLoadEffects } from './effects/list-settings-load.effects';

/**
 * Minimal lazy providers for the `/list-settings` page: the grocery
 * `listSettings` slice + its own-data load/save effects, and nothing else.
 *
 * Deliberately NOT the full `groceriesLazyProviders`: that also registers the
 * products/shopping/storage slices and their telemetry reporters, and those
 * reporters emit their first `report` on subscription (a `store.select` fires
 * synchronously). On a route that never hydrates the grocery lists, that would
 * push zero-counts to the dashboard read-model and wrongly flip the deck tiles
 * standby→online. The settings page reads only `listSettings`, so it registers
 * only that.
 *
 * `listSettings` also rides in `groceriesLazyProviders` (the grocery pages read
 * the flags). NgRx keys features by name, so re-registering the same reducer
 * across route injectors is a no-op that preserves state — the slice hydrates
 * once, whichever grocery-ish route you enter first.
 */
export const listSettingsLazyProviders: Array<Provider | EnvironmentProviders> =
  [
    provideState('listSettings', listSettingsReducer),
    provideEffects(ListSettingsEffects, ListSettingsLoadEffects),
  ];

/**
 * Route hydration for the grocery `listSettings` slice — used both on the
 * `/list-settings` route and (co-hydrated) on the three grocery routes.
 */
export const listSettingsHydrationResolver = moduleHydrationResolver(
  ListSettingsActions.load,
  ListSettingsActions.loaded
);
