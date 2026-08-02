import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { BarcodeFacade } from '../../data';
import { BarcodeInputComponent } from './barcode-input.component';

const fileEvent = (files: File[]): Event =>
  ({ target: { files } }) as unknown as Event;

const stubImageDecode = (outcome: 'load' | 'error') =>
  vi.stubGlobal(
    'Image',
    class {
      readonly #handlers = new Map<string, (event: Event) => void>();

      addEventListener(type: string, handler: (event: Event) => void) {
        this.#handlers.set(type, handler);
      }

      set src(_: string) {
        queueMicrotask(() => this.#handlers.get(outcome)?.(new Event(outcome)));
      }
    }
  );

describe('BarcodeInputComponent', () => {
  let facade: {
    saveBarcode: ReturnType<typeof vi.fn>;
    reportUploadFailure: ReturnType<typeof vi.fn>;
  };
  let component: BarcodeInputComponent;

  beforeEach(() => {
    facade = { saveBarcode: vi.fn(), reportUploadFailure: vi.fn() };
    TestBed.configureTestingModule({
      imports: [BarcodeInputComponent],
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        { provide: BarcodeFacade, useValue: facade },
      ],
    });
    component = TestBed.createComponent(
      BarcodeInputComponent
    ).componentInstance;
  });

  afterEach(() => vi.unstubAllGlobals());

  it('reads the picked image and saves it as a data URL', async () => {
    stubImageDecode('load');
    const file = new File(['barcode-bytes'], 'code.png', { type: 'image/png' });

    await component.onFileSelected(fileEvent([file]));

    expect(facade.saveBarcode).toHaveBeenCalledTimes(1);
    expect(facade.saveBarcode.mock.calls[0][0].startsWith('data:')).toBe(true);
    expect(facade.reportUploadFailure).not.toHaveBeenCalled();
  });

  it('reports an undecodable file instead of storing it', async () => {
    stubImageDecode('error');
    const file = new File(['not-an-image'], 'code.png', { type: 'image/png' });

    await component.onFileSelected(fileEvent([file]));

    expect(facade.saveBarcode).not.toHaveBeenCalled();
    expect(facade.reportUploadFailure).toHaveBeenCalledTimes(1);
  });

  it('ignores an empty selection', async () => {
    await component.onFileSelected(fileEvent([]));

    expect(facade.saveBarcode).not.toHaveBeenCalled();
    expect(facade.reportUploadFailure).not.toHaveBeenCalled();
  });
});
