import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IBarcodeState } from '../model';

export const selectBarcodeState =
  createFeatureSelector<IBarcodeState>('barcode');

export const selectBarcodeDataUrl = createSelector(
  selectBarcodeState,
  (state) => state.dataUrl
);
