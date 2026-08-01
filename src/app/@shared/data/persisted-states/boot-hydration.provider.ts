import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';

import { Action, ActionCreator, Store } from '@ngrx/store';

/**
 * Dispatches an eager module's own `load` at boot — the eager sibling of
 * `moduleHydrationResolver`, which does the same job for a lazy module on its
 * route. Lets an eager domain ship its whole boot lifecycle (state + effects +
 * load) inside its own `<domain>.providers.ts`, so the shell never names a
 * domain's action group.
 *
 * Unlike the route resolver this does NOT await `loaded`: blocking bootstrap on
 * a storage read would delay first paint, and the boot splash already covers
 * the gap (`SettingsEffects` lifts it on `SettingsActions.loaded`, once the
 * theme is applied).
 */
export function bootHydrationProvider(
  load: ActionCreator<string, () => Action>
): EnvironmentProviders {
  return provideAppInitializer(() => inject(Store).dispatch(load()));
}
