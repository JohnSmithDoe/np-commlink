import dayjs from 'dayjs';
import { createBaseItem } from '../../@shared/util/app.factory';
import { uuidv4 } from '../../@shared/util/app.utils';
import { Note, NoteImage } from '../model/notes.types';

export function createNote(name = ''): Note {
  return { ...createBaseItem(name), updatedAt: dayjs().format() };
}

export function createNoteImage(dataUrl: string): NoteImage {
  return { id: uuidv4(), dataUrl };
}

export const isBlankNote = (note: Note): boolean =>
  !note.name.trim() && !note.body?.trim() && !note.images?.length;
