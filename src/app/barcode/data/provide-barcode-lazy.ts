import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { barcodeReducer } from './barcode.reducer';
import { BarcodeEffects } from './barcode.effects';
import { BarcodeLoadEffects } from './barcode-load.effects';

/**
 * Lazy state + effects for the `barcode` bounded context (SIGIL badge),
 * registered on the `/barcode` route and hydrated by
 * `moduleHydrationResolver(BarcodeActions.load, .loaded)`.
 *
 * Previously the badge lived inside the `officeTime` slice, so `/barcode`
 * parasitically co-registered the whole office-time context and barcode carried
 * a `barcode → office-time` Sheriff bridge. It now owns its own slice (persisted
 * under `npc-barcode`) and is fully sealed — just like every other lazy context.
 */
export const barcodeLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('barcode', barcodeReducer),
  provideEffects(BarcodeLoadEffects, BarcodeEffects),
];
