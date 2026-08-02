import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { BarcodeActions } from './barcode.actions';
import { barcodeReducer } from './barcode.reducer';
import { BarcodeEffects } from './barcode.effects';
import { BARCODE_STATE_KEY, selectBarcodeState } from './barcode.selector';

export const barcodeContext = providePersistedContext({
  key: BARCODE_STATE_KEY,
  reducer: barcodeReducer,
  lifecycle: BarcodeActions,
  select: selectBarcodeState,
  save: {
    on: [
      BarcodeActions.saveBarcode,
      BarcodeActions.deleteBarcode,
      BarcodeActions.rotateBarcodeSuccess,
    ],
  },
  effects: [BarcodeEffects],
});
