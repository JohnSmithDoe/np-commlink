import { mockKernelState } from '../../@shared/testing/test-data';
import { selectBarcodeDataUrl, selectBarcodeState } from './barcode.selector';

describe('barcode.selector', () => {
  it('selects the barcode feature slice', () => {
    const barcode = { dataUrl: 'data:image/png;base64,AAA' };
    expect(selectBarcodeState(mockKernelState({ barcode }))).toBe(barcode);
  });

  it('reads the badge data URL', () => {
    expect(
      selectBarcodeDataUrl.projector({ dataUrl: 'data:image/png;base64,AAA' })
    ).toBe('data:image/png;base64,AAA');
  });

  it('is undefined while no badge has been uploaded', () => {
    expect(selectBarcodeDataUrl.projector({})).toBeUndefined();
  });
});
