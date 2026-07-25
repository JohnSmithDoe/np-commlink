import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { OfficeTimeActions } from './office-time/office-time.actions';
import { officeTimeReducer } from './office-time/office-time.reducer';
import { OfficeTimeEffects } from './effects/office-time.effects';
import { OfficeTimeTelemetryEffects } from './effects/office-time-telemetry.effects';
import { OfficeTimeLoadEffects } from './effects/office-time-load.effects';

/**
 * Lazy state + effects for the `office-time` bounded context, registered as ONE
 * unit on every route that touches it (lazy-modules Phase D). The context is a
 * single slice — `officeTime` (the tracked days + stats + the office dashboard
 * config), read by the office-time page, the /settings page, and the stats
 * telemetry.
 *
 * Two routes carry these providers:
 * - `/settings`     — edits the dashboard settings + theme
 * - `/office-time`  — reads officeTime (the day tracker + stats)
 *
 * (The SIGIL badge used to live here too, dragging `/barcode` into this context;
 * it now owns the sealed `barcode` slice — sheriff-tighten §1. The vestigial
 * `officeTimeSettings` feature-flag slice — down to a single dead `showTotalTime`
 * flag after the settings re-scope — was removed as dead code.)
 *
 * Hydration: `moduleHydrationResolver` runs once on the route (one resolve key —
 * see app.routes.ts). Save lives in the module's own effects
 * (`OfficeTimeEffects.saveOn$/saveOfficeTime$`), so no save-effect relocation is
 * needed. The telemetry reporter rides here (lazy) so its `store.select` never
 * reads an unregistered slice; the cold-launch stats come from the persisted
 * summary.
 */
export const officeTimeLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('officeTime', officeTimeReducer),
  provideEffects(
    OfficeTimeLoadEffects,
    OfficeTimeEffects,
    OfficeTimeTelemetryEffects
  ),
];

export const officeTimeHydrationResolver = moduleHydrationResolver(
  OfficeTimeActions.load,
  OfficeTimeActions.loaded
);
