import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IBarcodeState } from '../../@shared/types';

export const selectBarcodeState =
  createFeatureSelector<IBarcodeState>('barcode');

export const selectBarcodeDataUrl = createSelector(
  selectBarcodeState,
  (state) => state.dataUrl
);
