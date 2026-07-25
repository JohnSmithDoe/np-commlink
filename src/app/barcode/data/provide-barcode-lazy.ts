import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { BarcodeActions } from './barcode.actions';
import { barcodeReducer } from './barcode.reducer';
import { BarcodeEffects } from './effects/barcode.effects';
import { BarcodeLoadEffects } from './effects/barcode-load.effects';

export const barcodeLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('barcode', barcodeReducer),
  provideEffects(BarcodeLoadEffects, BarcodeEffects),
];

/** Route hydration for the barcode slice (dispatched by the route resolver). */
export const barcodeHydrationResolver = moduleHydrationResolver(
  BarcodeActions.load,
  BarcodeActions.loaded
);
