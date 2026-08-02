import { createActionGroup, emptyProps } from '@ngrx/store';
import { BarcodeState } from '../model/barcode.types';

export const BarcodeActions = createActionGroup({
  source: 'Barcode',
  events: {
    load: emptyProps(),
    loaded: (barcode: BarcodeState | null) => ({ barcode }),
    saveBarcode: (dataUrl: string) => ({ dataUrl }),
    deleteBarcode: emptyProps(),
    rotateBarcode: emptyProps(),
    rotateBarcodeSuccess: (dataUrl: string) => ({ dataUrl }),
  },
});
