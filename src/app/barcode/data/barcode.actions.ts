import { createActionGroup, emptyProps } from '@ngrx/store';
import { IBarcodeState } from '../model';

// The SIGIL badge is its own bounded context (sheriff-tighten §1): a display-only
// domain that owns the uploaded badge image. Formerly a field inside
// `officeTime`, which forced the `barcode → office-time` Sheriff bridge.
export const BarcodeActions = createActionGroup({
  source: 'Barcode',
  events: {
    // Own-data lazy load lifecycle (mirrors every other lazy context). Payload
    // is the persisted slice; the reducer hydrates on it.
    load: emptyProps(),
    loaded: (barcode: IBarcodeState | null) => ({ barcode }),
    'Save Barcode': (base64Blob: string) => ({ base64Blob }),
    'Delete Barcode': emptyProps(),
    'Rotate Barcode': emptyProps(),
    'Rotate Barcode Success': (dataUrl: string) => ({ dataUrl }),
  },
});
