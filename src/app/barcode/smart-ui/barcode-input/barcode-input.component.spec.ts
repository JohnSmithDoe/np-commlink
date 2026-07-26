import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BarcodeFacade } from '../../data';
import { BarcodeInputComponent } from './barcode-input.component';

// The template's `translate` pipe subscribes to TranslateService.get()/stream(),
// so a partial stub isn't enough — provide the real, no-loader
// TranslateModule.forRoot() (matches kitchen-bot's shared test setup). The
// file-read/save flow under test doesn't depend on it.
const fileEvent = (files: File[]): Event =>
  ({ target: { files } }) as unknown as Event;

describe('BarcodeInputComponent', () => {
  let facade: { saveBarcode: ReturnType<typeof vi.fn> };
  let component: BarcodeInputComponent;

  beforeEach(() => {
    facade = { saveBarcode: vi.fn() };
    TestBed.configureTestingModule({
      imports: [BarcodeInputComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        { provide: BarcodeFacade, useValue: facade },
      ],
    });
    component = TestBed.createComponent(
      BarcodeInputComponent
    ).componentInstance;
  });

  it('reads the picked image and saves it as a data URL', async () => {
    const file = new File(['barcode-bytes'], 'code.png', { type: 'image/png' });

    component.onFileSelected(fileEvent([file]));

    await vi.waitFor(() => expect(facade.saveBarcode).toHaveBeenCalledTimes(1));
    expect(facade.saveBarcode.mock.calls[0][0].startsWith('data:')).toBe(true);
  });

  it('ignores an empty selection', () => {
    component.onFileSelected(fileEvent([]));
    expect(facade.saveBarcode).not.toHaveBeenCalled();
  });
});
