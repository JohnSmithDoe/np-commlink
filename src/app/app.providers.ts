import { EnvironmentProviders, Provider } from '@angular/core';
import { commlinkContext } from './commlink/data';
import { notificationsContext } from './notifications/data';
import { settingsContext } from './settings/data';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';

/**
 * The eager kernel: everything that must exist before the first route resolves.
 *
 * These are the same `<domain>Context` bundles a routed context hands to its
 * route's `providers` — spread here instead, which is the whole of what "eager"
 * means. Lifecycle is a property of the composition site, never of who names a
 * domain's reducers: no reducer, effect or action group is visible outside the
 * domain that owns it, and `main.ts` names none of them. Their `resolve` halves
 * are empty by construction (`hydrate: 'boot'`), so only `providers` is read.
 *
 * What earns a slice a place here is being needed before its own page is: the
 * dashboard read-model and the notifications inbox are both cross-module sinks
 * behind always-on shell chrome, and the theme in `settings` must apply under
 * the boot splash before first paint.
 *
 * Order matters — the store root must come first: `provideState` /
 * `provideEffects` register through environment initializers, which run in
 * provider order.
 */
const kernelContexts = [commlinkContext, settingsContext, notificationsContext];

export function provideAppKernel(): Array<Provider | EnvironmentProviders> {
  return [
    provideStore({ router: routerReducer }),
    provideRouterStore(),
    ...kernelContexts.flatMap((context) => context.providers),
  ];
}
