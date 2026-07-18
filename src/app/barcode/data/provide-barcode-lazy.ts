import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { barcodeReducer } from './barcode.reducer';
import { BarcodeEffects } from './barcode.effects';
import { BarcodeLoadEffects } from './barcode-load.effects';

export const barcodeLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('barcode', barcodeReducer),
  provideEffects(BarcodeLoadEffects, BarcodeEffects),
];
