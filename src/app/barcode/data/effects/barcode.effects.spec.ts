import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { BarcodeActions } from '../actions/barcode.actions';
import { BarcodeEffects } from './barcode.effects';

const BADGE_URL = 'data:image/png;base64,BADGE';
const ROTATED_URL = 'data:image/*;base64,ROTATED';

// jsdom neither fetches images nor rasterises a canvas, so the real
// `rotateBase64` runs against stand-ins for both.
const stubBadgeImage = (outcome: 'load' | 'error') =>
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 100;
      naturalHeight = 40;
      readonly #handlers = new Map<string, (event: Event) => void>();

      addEventListener(type: string, handler: (event: Event) => void) {
        this.#handlers.set(type, handler);
      }

      set src(_: string) {
        queueMicrotask(() => this.#handlers.get(outcome)?.(new Event(outcome)));
      }
    }
  );

const stubCanvasYielding = (rotated: string) => {
  const canvas = {
    getContext: () => ({
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    }),
    toDataURL: () => rotated,
  };
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'canvas' ? (canvas as unknown as HTMLElement) : createElement(tag)
  );
};

describe('BarcodeEffects', () => {
  let actions$: Observable<Action>;
  let effects: BarcodeEffects;

  const setup = (dataUrl?: string) => {
    TestBed.configureTestingModule({
      providers: [
        BarcodeEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({ barcode: { dataUrl } }),
        }),
      ],
    });
    effects = TestBed.inject(BarcodeEffects);
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('commits a rotation that produced a new image', async () => {
    setup(BADGE_URL);
    stubBadgeImage('load');
    stubCanvasYielding(ROTATED_URL);
    actions$ = of(BarcodeActions.rotateBarcode());

    expect(await firstValueFrom(effects.rotateBarcode$)).toEqual(
      BarcodeActions.rotateBarcodeSuccess(ROTATED_URL)
    );
  });

  it('commits a rotation even if it reproduces the stored badge', async () => {
    setup(BADGE_URL);
    stubBadgeImage('load');
    stubCanvasYielding(BADGE_URL);
    actions$ = of(BarcodeActions.rotateBarcode());

    expect(await firstValueFrom(effects.rotateBarcode$)).toEqual(
      BarcodeActions.rotateBarcodeSuccess(BADGE_URL)
    );
  });

  it('emits nothing when no badge has been uploaded', async () => {
    setup();
    actions$ = of(BarcodeActions.rotateBarcode());

    expect(
      await firstValueFrom(effects.rotateBarcode$.pipe(toArray()))
    ).toEqual([]);
  });

  it('emits nothing when the badge image cannot be loaded', async () => {
    setup(BADGE_URL);
    stubBadgeImage('error');
    actions$ = of(BarcodeActions.rotateBarcode());

    expect(
      await firstValueFrom(effects.rotateBarcode$.pipe(toArray()))
    ).toEqual([]);
  });
});
