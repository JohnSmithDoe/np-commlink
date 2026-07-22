import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BarcodeActions } from '../../data';
import { UiService } from '../../../@shared/util/ui.service';
import { BarcodeInputComponent } from './barcode-input.component';

// UiService pulls in Ionic's ToastController, so we stub it. The template's
// `translate` pipe subscribes to TranslateService.get()/stream(), so a partial
// stub isn't enough — provide the real, no-loader TranslateModule.forRoot()
// (matches kitchen-bot's shared test setup). The file-read/dispatch flow under
// test depends on neither.
const fileEvent = (files: File[]): Event =>
  ({ target: { files } }) as unknown as Event;

describe('BarcodeInputComponent', () => {
  let store: MockStore;
  let component: BarcodeInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BarcodeInputComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore(),
        {
          provide: UiService,
          useValue: { showToast: () => Promise.resolve() },
        },
      ],
    });
    store = TestBed.inject(MockStore);
    component = TestBed.createComponent(
      BarcodeInputComponent
    ).componentInstance;
  });

  it('reads the picked image and dispatches saveBarcode with a data URL', async () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const file = new File(['barcode-bytes'], 'code.png', { type: 'image/png' });

    component.onFileSelected(fileEvent([file]));

    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));
    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof BarcodeActions.saveBarcode
    >;
    expect(action.type).toBe(BarcodeActions.saveBarcode.type);
    expect(action.base64Blob.startsWith('data:')).toBe(true);
  });

  it('ignores an empty selection', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    component.onFileSelected(fileEvent([]));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
