import { BarcodeActions } from './barcode.actions';
import { barcodeReducer, initialBarcodeState } from './barcode.reducer';

describe('barcodeReducer', () => {
  it('stores and clears the badge', () => {
    const saved = barcodeReducer(
      initialBarcodeState,
      BarcodeActions.saveBarcode('data:image/png;base64,AAA')
    );
    expect(saved.dataUrl).toBe('data:image/png;base64,AAA');

    const cleared = barcodeReducer(saved, BarcodeActions.deleteBarcode());
    expect(cleared.dataUrl).toBeUndefined();
  });

  it('replaces the badge on a successful rotation', () => {
    const saved = barcodeReducer(
      initialBarcodeState,
      BarcodeActions.saveBarcode('data:image/png;base64,AAA')
    );
    const rotated = barcodeReducer(
      saved,
      BarcodeActions.rotateBarcodeSuccess('data:image/png;base64,BBB')
    );
    expect(rotated.dataUrl).toBe('data:image/png;base64,BBB');
  });

  it('hydrates from the persisted slice and keeps state on null', () => {
    const hydrated = barcodeReducer(
      initialBarcodeState,
      BarcodeActions.loaded({ dataUrl: 'data:image/png;base64,CCC' })
    );
    expect(hydrated.dataUrl).toBe('data:image/png;base64,CCC');

    const unchanged = barcodeReducer(hydrated, BarcodeActions.loaded(null));
    expect(unchanged.dataUrl).toBe('data:image/png;base64,CCC');
  });
});
