import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { BarcodeActions } from './barcode.actions';
import { barcodeReducer } from './barcode.reducer';
import { BarcodeEffects } from './barcode.effects';
import { BARCODE_STATE_KEY, selectBarcodeState } from './barcode.selector';

/**
 * The `barcode` bounded context (SIGIL — the uploaded badge image), registered
 * on the `/barcode` route. Its own sealed slice; it was a field inside
 * `officeTime`, which forced a `barcode → office-time` bridge.
 *
 * The save trigger is an explicit list rather than the `[Barcode]` source
 * prefix: `Rotate Barcode` is a request that only persists once
 * `Rotate Barcode Success` has committed a genuinely new image, so persisting on
 * the request too would write an unchanged slice.
 *
 * Display-only — it reports nothing to the deck.
 */
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
