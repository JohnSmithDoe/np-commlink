import { rotateBase64 } from './barcode.utils';

const BADGE_URL = 'data:image/png;base64,BADGE';
const ROTATED_URL = 'data:image/*;base64,ROTATED';

type TFakeCanvas = {
  width: number;
  height: number;
  getContext: () => unknown;
  toDataURL: () => string;
};

const fake2dContext = () => ({
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
});

describe('rotateBase64', () => {
  let canvas: TFakeCanvas;
  let context: ReturnType<typeof fake2dContext>;
  let requestedSource: string | undefined;

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
      toDataURL: () => ROTATED_URL,
    };
  };

  beforeEach(() => {
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
    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), -50, -20);
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

  it('wraps a bare base64 payload into a data URL before loading it', async () => {
    givenBadgeImage(100, 40);

    await rotateBase64('QkFER0U=');

    expect(requestedSource).toBe('data:image/*;base64,QkFER0U=');
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
