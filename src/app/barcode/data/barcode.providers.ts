import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { BarcodeActions } from './actions/barcode.actions';
import { barcodeReducer } from './reducer/barcode.reducer';
import { BarcodeEffects } from './effects/barcode.effects';
import { selectBarcodeState } from './selectors/barcode.selector';

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
  key: 'barcode',
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
