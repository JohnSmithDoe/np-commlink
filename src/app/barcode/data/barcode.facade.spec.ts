import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { BarcodeActions } from './actions/barcode.actions';
import { BarcodeFacade } from './barcode.facade';
import { selectBarcodeDataUrl } from './selectors/barcode.selector';

describe('BarcodeFacade', () => {
  let store: MockStore;
  let facade: BarcodeFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectBarcodeDataUrl, 'data:image/png;base64,AAA');
    facade = TestBed.inject(BarcodeFacade);
  });

  afterEach(() => store.resetSelectors());

  it('exposes the stored badge', () => {
    expect(facade.barcode()).toBe('data:image/png;base64,AAA');
  });

  it('dispatches the badge commands', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    facade.rotateBarcode();
    facade.deleteBarcode();
    facade.saveBarcode('data:image/png;base64,BBB');

    expect(dispatch).toHaveBeenCalledWith(BarcodeActions.rotateBarcode());
    expect(dispatch).toHaveBeenCalledWith(BarcodeActions.deleteBarcode());
    expect(dispatch).toHaveBeenCalledWith(
      BarcodeActions.saveBarcode('data:image/png;base64,BBB')
    );
  });

  // The upload input is a dumb component, so the facade owns the i18n key and
  // raises the toast on the shared contract — that is what keeps TranslateService
  // out of the component.
  it('reports an unreadable upload as a danger toast on the shared contract', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    facade.reportUploadFailure();

    expect(dispatch).toHaveBeenCalledWith(
      NotificationsActions.toast({
        key: 'barcode.upload.error',
        color: 'danger',
      })
    );
  });
});
