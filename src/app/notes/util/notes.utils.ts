/* ─── why ─────────────────────────────────────────────────────────
 * A picked image is re-encoded before it is stored, never kept as the camera
 * produced it, because base64 costs a third on top of the bytes and
 * `note-image.store.ts` buys the note out of paying that per keystroke, not
 * out of paying it at all. The cap is TWO SCREENS on the longest edge: enough
 * to fill the viewer and take a pinch, and nothing beyond what the device it
 * was taken on can ever show.
 *
 * Rotating goes through the SAME budget as importing — one `encoded`, one
 * quality, one cap. Written its own way it re-encoded at a HIGHER quality
 * than the picture was stored at and skipped the cap entirely, so every
 * rotation grew the file it was only supposed to turn.
 * ───────────────────────────────────────────────────────────────── */

import { SearchResult } from '../../@shared/model/item-list.types';
import { Note, NoteImage, NoteImageId, NotesList } from '../model/notes.types';

const RADIANS_PER_DEGREE = Math.PI / 180;

const SCREENS_OF_HEADROOM = 2;
const FALLBACK_SCREEN_EDGE = 1024;
const STORED_MIME_TYPE = 'image/jpeg';
const STORED_QUALITY = 0.85;

const maxEdge = (): number => {
  const screen = globalThis.screen;
  const longest = screen
    ? Math.max(screen.width, screen.height)
    : FALLBACK_SCREEN_EDGE;
  return longest * SCREENS_OF_HEADROOM;
};

const loadImage = async (source: string): Promise<HTMLImageElement> => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.addEventListener('load', resolve);
    img.addEventListener('error', reject);
    img.src = source;
  });
  return img;
};

const readAsDataUrl = (file: File): Promise<string | undefined> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () =>
      resolve(reader.result as string | undefined)
    );
    reader.addEventListener('error', () => resolve(undefined));
    reader.readAsDataURL(file);
  });

const encoded = (canvas: HTMLCanvasElement): string =>
  canvas.toDataURL(STORED_MIME_TYPE, STORED_QUALITY);

const capped = (width: number, height: number) => {
  const limit = maxEdge();
  const longest = Math.max(width, height);
  const ratio = longest > limit ? limit / longest : 1;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const rotatedFrame = (img: HTMLImageElement, radians: number) => {
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  return {
    width: Math.round(img.naturalWidth * cos + img.naturalHeight * sin),
    height: Math.round(img.naturalWidth * sin + img.naturalHeight * cos),
  };
};

const scaledFrame = (img: HTMLImageElement) =>
  capped(img.naturalWidth, img.naturalHeight);

export const readNoteImage = async (
  file: File
): Promise<string | undefined> => {
  const dataUrl = await readAsDataUrl(file);
  if (!dataUrl) return;

  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    return;
  }

  const { width, height } = scaledFrame(img);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;

  context.drawImage(img, 0, 0, width, height);
  return encoded(canvas);
};

export const rotateBase64 = async (dataUrl?: string, deg = 90) => {
  if (!dataUrl) return;

  const img = await loadImage(dataUrl);
  const radians = (deg % 360) * RADIANS_PER_DEGREE;
  const turned = rotatedFrame(img, radians);
  const { width, height } = capped(turned.width, turned.height);
  const scale = turned.width === 0 ? 1 : width / turned.width;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.translate(width / 2, height / 2);
  context.rotate(radians);
  context.scale(scale, scale);
  context.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return encoded(canvas);
};

export const resolveImages = (
  ids: readonly NoteImageId[] | undefined,
  urls: Record<NoteImageId, string>
): NoteImage[] =>
  (ids ?? []).flatMap((id) => {
    const dataUrl = urls[id];
    return dataUrl ? [{ id, dataUrl }] : [];
  });

export const searchNotes = (
  list: NotesList
): SearchResult<Note> | undefined => {
  const searchTerm = list.searchQuery?.trim();
  if (!searchTerm) return;
  const needle = searchTerm.toLowerCase();
  return {
    searchTerm,
    listItems: list.items.filter((note) =>
      `${note.name} ${note.body ?? ''}`.toLowerCase().includes(needle)
    ),
  };
};

export const noteSnippet = (body: string | undefined, limit = 140): string => {
  const flattened = (body ?? '')
    .slice(0, limit * 4)
    .replaceAll(/\s+/g, ' ')
    .trim();
  return flattened.length > limit
    ? `${flattened.slice(0, limit).trimEnd()}…`
    : flattened;
};
