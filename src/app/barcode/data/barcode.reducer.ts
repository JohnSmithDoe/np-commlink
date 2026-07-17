import { createReducer, on } from '@ngrx/store';
import { IBarcodeState } from '../../@shared/types';
import { BarcodeActions } from './barcode.actions';

export const initialBarcodeState: IBarcodeState = {};

export const barcodeReducer = createReducer(
  initialBarcodeState,
  on(BarcodeActions.saveBarcode, (_state, { base64Blob }): IBarcodeState => ({
    dataUrl: base64Blob,
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
