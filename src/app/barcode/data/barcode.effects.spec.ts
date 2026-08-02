import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, tap, toArray } from 'rxjs';
import { mockKernelState } from '../../@shared/testing/test-data';
import { BarcodeActions } from './barcode.actions';
import { BarcodeEffects } from './barcode.effects';

const BADGE_URL = 'data:image/png;base64,BADGE';
const ROTATED_URL = 'data:image/png;base64,ROTATED';
const ROTATED_TWICE_URL = 'data:image/png;base64,ROTATEDTWICE';

const stubBadgeImage = (outcome: 'load' | 'error'): string[] => {
  const requested: string[] = [];
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 100;
      naturalHeight = 40;
      readonly #handlers = new Map<string, (event: Event) => void>();

      addEventListener(type: string, handler: (event: Event) => void) {
        this.#handlers.set(type, handler);
      }

      set src(value: string) {
        requested.push(value);
        queueMicrotask(() => this.#handlers.get(outcome)?.(new Event(outcome)));
      }
    }
  );
  return requested;
};

const stubCanvasYielding = (...rotations: string[]) => {
  const canvas = {
    getContext: () => ({
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    }),
    toDataURL: () => rotations.shift() ?? '',
  };
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'canvas' ? (canvas as unknown as HTMLElement) : createElement(tag)
  );
};

describe('BarcodeEffects', () => {
  let actions$: Observable<Action>;
  let effects: BarcodeEffects;
  let store: MockStore;

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
    store = TestBed.inject(MockStore);
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

  it('queues a second tap and rotates the result of the first', async () => {
    setup(BADGE_URL);
    const loaded = stubBadgeImage('load');
    stubCanvasYielding(ROTATED_URL, ROTATED_TWICE_URL);
    actions$ = of(
      BarcodeActions.rotateBarcode(),
      BarcodeActions.rotateBarcode()
    );

    const committed = await firstValueFrom(
      effects.rotateBarcode$.pipe(
        tap((action) =>
          store.setState(
            mockKernelState({ barcode: { dataUrl: action.dataUrl } })
          )
        ),
        toArray()
      )
    );

    expect(committed).toEqual([
      BarcodeActions.rotateBarcodeSuccess(ROTATED_URL),
      BarcodeActions.rotateBarcodeSuccess(ROTATED_TWICE_URL),
    ]);
    expect(loaded).toEqual([BADGE_URL, ROTATED_URL]);
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
