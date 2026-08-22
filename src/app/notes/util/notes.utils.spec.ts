import { NOTES_LIST_ID, NotesList } from '../model/notes.types';
import {
  noteSnippet,
  readNoteImage,
  rotateBase64,
  searchNotes,
} from './notes.utils';

const BADGE_URL = 'data:image/png;base64,BADGE';
const PHOTO_URL = 'data:image/jpeg;base64,PHOTO';
const ROTATED_URL = 'data:image/png;base64,ROTATED';

type FakeCanvas = {
  width: number;
  height: number;
  getContext: () => unknown;
  toDataURL: (type?: string, quality?: number) => string;
};

const fake2dContext = () => ({
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  drawImage: vi.fn(),
});

const givenScreen = (width = 400, height = 800) =>
  vi.stubGlobal('screen', { width, height });

const pickedFile = (name = 'badge.png') =>
  new File(['badge-bytes'], name, { type: 'image/png' });

const list = (searchQuery?: string): NotesList => ({
  id: NOTES_LIST_ID,
  searchQuery,
  items: [
    { id: 'a', name: 'Einkauf', body: 'Milch und Brot' },
    { id: 'b', name: 'Urlaub', body: 'Fähre buchen' },
    { id: 'c', name: 'Ohne Text' },
  ],
});

describe('notes.utils', () => {
  let canvas: FakeCanvas;
  let context: ReturnType<typeof fake2dContext>;
  let requestedSource: string | undefined;
  let encodedAs: [string?, number?];

  const givenImage = (
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
    givenScreen();
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
    it('has nothing to rotate without an image', async () => {
      expect(await rotateBase64()).toBeUndefined();
      expect(context.drawImage).not.toHaveBeenCalled();
    });

    it('swaps the frame at the default 90°', async () => {
      givenImage(100, 40);

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
      givenImage(100, 40);

      await rotateBase64(BADGE_URL, 180);

      expect([canvas.width, canvas.height]).toEqual([100, 40]);
    });

    it('hands back the repainted canvas as a data URL', async () => {
      givenImage(100, 40);

      expect(await rotateBase64(BADGE_URL)).toBe(ROTATED_URL);
      expect(requestedSource).toBe(BADGE_URL);
    });

    it('re-encodes at the budget the import used, not above it', async () => {
      givenImage(100, 40);

      await rotateBase64(PHOTO_URL);

      expect(encodedAs).toEqual(['image/jpeg', 0.85]);
    });

    it('scales a turned frame that outgrows the budget', async () => {
      givenImage(3000, 3000);

      await rotateBase64(PHOTO_URL);

      expect([canvas.width, canvas.height]).toEqual([1600, 1600]);
      expect(context.scale).toHaveBeenCalledWith(1600 / 3000, 1600 / 3000);
    });

    it('rejects when the image cannot be loaded', async () => {
      givenImage(100, 40, 'error');

      await expect(rotateBase64(BADGE_URL)).rejects.toBeInstanceOf(Event);
    });

    it('aborts without painting when there is no 2D context', async () => {
      givenImage(100, 40);
      givenCanvasContext(null);

      expect(await rotateBase64(BADGE_URL)).toBeUndefined();
    });
  });

  describe('readNoteImage', () => {
    it('re-encodes a picked image as a stored jpeg', async () => {
      givenImage(100, 40);

      expect(await readNoteImage(pickedFile())).toBe(ROTATED_URL);
      expect(encodedAs).toEqual(['image/jpeg', 0.85]);
    });

    it('leaves an image within the budget at its own size', async () => {
      givenImage(800, 600);

      await readNoteImage(pickedFile());

      expect([canvas.width, canvas.height]).toEqual([800, 600]);
    });

    it('scales the longest edge down to the storage budget', async () => {
      givenImage(4000, 3000);

      await readNoteImage(pickedFile());

      expect([canvas.width, canvas.height]).toEqual([1600, 1200]);
    });

    it('takes the budget from the screen it was picked on', async () => {
      givenScreen(1000, 500);
      givenImage(4000, 3000);

      await readNoteImage(pickedFile());

      expect([canvas.width, canvas.height]).toEqual([2000, 1500]);
    });

    it('rejects a file the browser cannot decode', async () => {
      givenImage(0, 0, 'error');

      expect(
        await readNoteImage(pickedFile('not-an-image.png'))
      ).toBeUndefined();
    });
  });

  describe('searchNotes', () => {
    it('has no result without a query', () => {
      expect(searchNotes(list())).toBeUndefined();
      expect(searchNotes(list('  '))).toBeUndefined();
    });

    it('matches the body, not only the title', () => {
      expect(searchNotes(list('brot'))?.listItems.map(({ id }) => id)).toEqual([
        'a',
      ]);
    });

    it('never reports an exact match, so a duplicate title stays creatable', () => {
      expect(searchNotes(list('Einkauf'))?.exactMatch).toBeUndefined();
    });
  });

  describe('noteSnippet', () => {
    it('is empty for a note with no body', () => {
      expect(noteSnippet(undefined)).toBe('');
    });

    it('flattens the line breaks a textarea produces', () => {
      expect(noteSnippet('Milch\n\n  Brot ')).toBe('Milch Brot');
    });

    it('cuts an over-long body and marks the cut', () => {
      expect(noteSnippet('abcdef', 3)).toBe('abc…');
    });
  });
});
