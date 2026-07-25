import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { CashActions } from './cash.actions';
import { cashReducer } from './cash.reducer';
import { CashLoadEffects } from './effects/cash-load.effects';
import { CashSaveEffects } from './effects/cash-save.effects';
import { CashTelemetryEffects } from './effects/cash-telemetry.effects';

/**
 * Lazy state + effects for the `cash` bounded context, registered on the
 * `/cash` route (lazy-modules plan §4). Cash is fully self-contained — no other
 * route reads or dispatches `[Cash]` — so it registers on its own.
 *
 * Hydration is handled by `moduleHydrationResolver(CashActions.load, .loaded)`
 * on the same route: CashLoadEffects reads the `cash` key and emits `loaded`.
 * The telemetry reporter rides with the slice (lazy) so its `store.select`
 * never reads an unregistered slice; the cold-launch balance comes from the
 * persisted summary, and the on-entry report flips the CREDSTICK tile
 * standby→online. The save effect rides here too (own-data save).
 */
export const cashLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('cash', cashReducer),
  provideEffects(CashLoadEffects, CashSaveEffects, CashTelemetryEffects),
];

/** Route hydration for the cash slice (dispatched by the route resolver). */
export const cashHydrationResolver = moduleHydrationResolver(
  CashActions.load,
  CashActions.loaded
);
