import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { settingsReducer } from './settings/settings.reducer';
import { SettingsEffects } from './settings/settings.effects';
import { officeTimeReducer } from './office-time/office-time.reducer';
import { OfficeTimeEffects } from './office-time/office-time.effects';
import { OfficeTimeTelemetryEffects } from './office-time/office-time-telemetry.effects';
import { OfficeTimeLoadEffects } from './office-time-load.effects';

/**
 * Lazy state + effects for the `office-time` bounded context, registered as ONE
 * unit on every route that touches it (lazy-modules Phase D). The context owns
 * two slices — `settings` (feature flags, edited on /settings via
 * SettingsEffects) and `officeTime` (the tracked days + stats + the SIGIL badge
 * image). They're co-registered as one context because both belong to it and
 * its routes/effects read each independently (SettingsEffects → `settings`;
 * the stats telemetry + office-time/barcode pages → `officeTime`); registering
 * only one would leave the other `undefined` for its consumer.
 *
 * Three routes carry these providers:
 * - `/settings`     — edits the settings slice
 * - `/office-time`  — reads settings + officeTime (the day tracker + stats)
 * - `/barcode`      — reads/writes the SIGIL badge, which lives in `officeTime`
 *   (the one cross-domain Sheriff bridge `barcode → office-time`); the barcode
 *   page must find `officeTime` hydrated, so it joins the set.
 *
 * Hydration: `moduleHydrationResolver` runs once per slice on the route (two
 * resolve keys — see app.routes.ts). Save lives in the module's own effects
 * (`SettingsEffects.saveSettingsOnChange$`, `OfficeTimeEffects.saveOn$/
 * saveOfficeTime$`), so no save-effect relocation is needed. The telemetry
 * reporter rides here (lazy) so its `store.select` never reads an unregistered
 * slice; the cold-launch stats come from the persisted summary.
 */
export const officeTimeLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('settings', settingsReducer),
  provideState('officeTime', officeTimeReducer),
  provideEffects(
    OfficeTimeLoadEffects,
    SettingsEffects,
    OfficeTimeEffects,
    OfficeTimeTelemetryEffects
  ),
];
