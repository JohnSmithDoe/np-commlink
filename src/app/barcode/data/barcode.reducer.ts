import { createReducer, on } from '@ngrx/store';
import { IBarcodeState } from '../model/barcode.types';
import { BarcodeActions } from './barcode.actions';

export const initialBarcodeState: IBarcodeState = {};

export const barcodeReducer = createReducer(
  initialBarcodeState,
  on(BarcodeActions.saveBarcode, (_state, { dataUrl }): IBarcodeState => ({
    dataUrl,
  })),
  on(
    BarcodeActions.rotateBarcodeSuccess,
    (_state, { dataUrl }): IBarcodeState => ({ dataUrl })
  ),
  on(BarcodeActions.deleteBarcode, (): IBarcodeState => ({
    dataUrl: undefined,
  })),
  on(
    BarcodeActions.loaded,
    (_state, { barcode }): IBarcodeState => barcode ?? _state
  )
);
