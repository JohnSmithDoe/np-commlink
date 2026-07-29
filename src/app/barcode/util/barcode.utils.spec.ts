import { readBadgeImage, rotateBase64 } from './barcode.utils';

const BADGE_URL = 'data:image/png;base64,BADGE';
const PHOTO_URL = 'data:image/jpeg;base64,PHOTO';
const ROTATED_URL = 'data:image/png;base64,ROTATED';

type TFakeCanvas = {
  width: number;
  height: number;
  getContext: () => unknown;
  toDataURL: (type?: string, quality?: number) => string;
};

const fake2dContext = () => ({
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
});

const pickedFile = (name = 'badge.png') =>
  new File(['badge-bytes'], name, { type: 'image/png' });

describe('barcode.utils', () => {
  let canvas: TFakeCanvas;
  let context: ReturnType<typeof fake2dContext>;
  let requestedSource: string | undefined;
  let encodedAs: [string?, number?];

  // jsdom neither fetches images nor rasterises a canvas, so the load outcome
  // is driven by hand and the geometry is read off a stand-in canvas.
  const givenBadgeImage = (
    width: number,
    height: number,
    outcome: 'load' | 'error' = 'load'
  ) =>
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = width;
        naturalHeight = height;
        readonly #handlers = new Map<string, (event: Event) => void>();

        addEventListener(type: string, handler: (event: Event) => void) {
          this.#handlers.set(type, handler);
        }

        set src(value: string) {
          requestedSource = value;
          queueMicrotask(() =>
            this.#handlers.get(outcome)?.(new Event(outcome))
          );
        }
      }
    );

  const givenCanvasContext = (context2d: unknown) => {
    canvas = {
      width: 0,
      height: 0,
      getContext: () => context2d,
      toDataURL: (type, quality) => {
        encodedAs = [type, quality];
        return ROTATED_URL;
      },
    };
  };

  beforeEach(() => {
    encodedAs = [];
    context = fake2dContext();
    givenCanvasContext(context);
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'canvas' ? (canvas as unknown as HTMLElement) : createElement(tag)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('rotateBase64', () => {
    it('has nothing to rotate without a badge', async () => {
      expect(await rotateBase64()).toBeUndefined();
      expect(context.drawImage).not.toHaveBeenCalled();
    });

    it('swaps the frame at the default 90°', async () => {
      givenBadgeImage(100, 40);

      await rotateBase64(BADGE_URL);

      expect([canvas.width, canvas.height]).toEqual([40, 100]);
      expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(context.translate).toHaveBeenCalledWith(20, 50);
      expect(context.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        -50,
        -20
      );
    });

    it('keeps the frame at 180°', async () => {
      givenBadgeImage(100, 40);

      await rotateBase64(BADGE_URL, 180);

      expect([canvas.width, canvas.height]).toEqual([100, 40]);
    });

    it('hands back the repainted canvas as a data URL', async () => {
      givenBadgeImage(100, 40);

      expect(await rotateBase64(BADGE_URL)).toBe(ROTATED_URL);
      expect(requestedSource).toBe(BADGE_URL);
    });

    // The old `'image/*'` is not a MIME type, so the canvas fell back to PNG and
    // a rotated photo badge grew several-fold in the persisted document.
    it('re-encodes in the format the badge arrived in', async () => {
      givenBadgeImage(100, 40);

      await rotateBase64(PHOTO_URL);

      expect(encodedAs).toEqual(['image/jpeg', 0.92]);
    });

    it('falls back to png for a data URL with no readable type', async () => {
      givenBadgeImage(100, 40);

      await rotateBase64('data:;base64,BADGE');

      expect(encodedAs[0]).toBe('image/png');
    });

    // A badge that cannot be decoded escapes as the rejected error event rather
    // than as `undefined`; `BarcodeEffects.rotateBarcode$` is the only thing that
    // turns it into "commit nothing".
    it('rejects when the badge image cannot be loaded', async () => {
      givenBadgeImage(100, 40, 'error');

      await expect(rotateBase64(BADGE_URL)).rejects.toBeInstanceOf(Event);
    });

    it('aborts without painting when there is no 2D context', async () => {
      givenBadgeImage(100, 40);
      givenCanvasContext(null);

      expect(await rotateBase64(BADGE_URL)).toBeUndefined();
    });
  });

  describe('readBadgeImage', () => {
    it('hands back the picked image as a data URL', async () => {
      givenBadgeImage(100, 40);

      const badge = await readBadgeImage(pickedFile());

      expect(badge?.startsWith('data:')).toBe(true);
      expect(requestedSource).toBe(badge);
    });

    // `accept="image/*"` filters the file dialog; it does not promise the bytes
    // decode. Without this probe a renamed text file was stored and persisted.
    it('rejects a file the browser cannot decode', async () => {
      givenBadgeImage(0, 0, 'error');

      expect(
        await readBadgeImage(pickedFile('not-an-image.png'))
      ).toBeUndefined();
    });
  });
});
