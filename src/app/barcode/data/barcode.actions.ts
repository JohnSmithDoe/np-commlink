import { createActionGroup, emptyProps } from '@ngrx/store';
import { IBarcodeState } from '../model/barcode.types';

// The SIGIL badge is its own bounded context: a display-only domain that owns
// the uploaded badge image. Formerly a field inside `officeTime`, which forced
// the `barcode → office-time` Sheriff bridge.
export const BarcodeActions = createActionGroup({
  source: 'Barcode',
  events: {
    // Own-data lazy load lifecycle (mirrors every other lazy context). Payload
    // is the persisted slice; the reducer hydrates on it.
    load: emptyProps(),
    loaded: (barcode: IBarcodeState | null) => ({ barcode }),
    saveBarcode: (dataUrl: string) => ({ dataUrl }),
    deleteBarcode: emptyProps(),
    rotateBarcode: emptyProps(),
    rotateBarcodeSuccess: (dataUrl: string) => ({ dataUrl }),
  },
});
