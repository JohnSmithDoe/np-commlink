import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IBarcodeState } from '../../model/barcode.types';

export const selectBarcodeState =
  createFeatureSelector<IBarcodeState>('barcode');

export const selectBarcodeDataUrl = createSelector(
  selectBarcodeState,
  (state) => state.dataUrl
);
