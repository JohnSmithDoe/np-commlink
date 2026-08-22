/* ─── why ─────────────────────────────────────────────────────────
 * A picked image is re-encoded before it is stored, never kept as the
 * camera produced it. Every note image lives as a base64 string INSIDE
 * the notes slice, and the whole slice is serialised on each save — so
 * one 12-megapixel photo would be re-written on every keystroke of the
 * body it sits under. `MAX_EDGE` is what keeps that write bounded; it is
 * a storage budget, not a display size.
 * ───────────────────────────────────────────────────────────────── */

import { SearchResult } from '../../@shared/model/item-list.types';
import { Note, NotesList } from '../model/notes.types';

const RADIANS_PER_DEGREE = Math.PI / 180;

const FALLBACK_MIME_TYPE = 'image/png';
const LOSSY_QUALITY = 0.92;

const MAX_EDGE = 1600;
const STORED_MIME_TYPE = 'image/jpeg';
const STORED_QUALITY = 0.85;

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

const mimeTypeOf = (dataUrl: string): string =>
  /^data:(image\/[\w.+-]+)[,;]/.exec(dataUrl)?.[1] ?? FALLBACK_MIME_TYPE;

const rotatedFrame = (img: HTMLImageElement, radians: number) => {
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  return {
    width: Math.round(img.naturalWidth * cos + img.naturalHeight * sin),
    height: Math.round(img.naturalWidth * sin + img.naturalHeight * cos),
  };
};

const scaledFrame = (img: HTMLImageElement) => {
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const ratio = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  return {
    width: Math.round(img.naturalWidth * ratio),
    height: Math.round(img.naturalHeight * ratio),
  };
};

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
  return canvas.toDataURL(STORED_MIME_TYPE, STORED_QUALITY);
};

export const rotateBase64 = async (dataUrl?: string, deg = 90) => {
  if (!dataUrl) return;

  const img = await loadImage(dataUrl);
  const radians = (deg % 360) * RADIANS_PER_DEGREE;
  const { width, height } = rotatedFrame(img, radians);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.translate(width / 2, height / 2);
  context.rotate(radians);
  context.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return canvas.toDataURL(mimeTypeOf(dataUrl), LOSSY_QUALITY);
};

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
  const flattened = (body ?? '').replaceAll(/\s+/g, ' ').trim();
  return flattened.length > limit
    ? `${flattened.slice(0, limit).trimEnd()}…`
    : flattened;
};
