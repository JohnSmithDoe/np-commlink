import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BarcodeState } from '../model/barcode.types';

export const BARCODE_STATE_KEY = 'barcode';

export const selectBarcodeState =
  createFeatureSelector<BarcodeState>(BARCODE_STATE_KEY);

export const selectBarcodeDataUrl = createSelector(
  selectBarcodeState,
  (state) => state.dataUrl
);
