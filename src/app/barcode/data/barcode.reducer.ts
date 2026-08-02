import { createReducer, on } from '@ngrx/store';
import { BarcodeState } from '../model/barcode.types';
import { BarcodeActions } from './barcode.actions';

export const initialBarcodeState: BarcodeState = {};

export const barcodeReducer = createReducer(
  initialBarcodeState,
  on(BarcodeActions.saveBarcode, (_state, { dataUrl }): BarcodeState => ({
    dataUrl,
  })),
  on(
    BarcodeActions.rotateBarcodeSuccess,
    (_state, { dataUrl }): BarcodeState => ({ dataUrl })
  ),
  on(BarcodeActions.deleteBarcode, (): BarcodeState => ({
    dataUrl: undefined,
  })),
  on(
    BarcodeActions.loaded,
    (_state, { barcode }): BarcodeState => barcode ?? _state
  )
);
